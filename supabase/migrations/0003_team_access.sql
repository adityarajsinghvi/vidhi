-- ---------------------------------------------------------------------------
-- Multi-user team access: Owner / Coordinator / Helper roles per wedding.
--
-- weddings.owner_user_id stays the canonical "admin" pointer. wedding_members
-- is the access gate every other policy now keys off; the owner is mirrored
-- there as role='owner'. Helpers can read everything EXCEPT money (payments).
-- ---------------------------------------------------------------------------

create table public.wedding_members (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  role text not null check (role in ('owner', 'coordinator', 'helper')),
  created_at timestamptz not null default now(),
  unique (wedding_id, user_id)
);
create index wedding_members_wedding_id_idx on public.wedding_members (wedding_id);
create index wedding_members_user_id_idx on public.wedding_members (user_id);

-- Pending invites keyed by phone; resolved into memberships when the invitee
-- next opens the app (resolve_my_invites rpc, called from the dashboard layout).
create table public.wedding_invites (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  phone text not null,
  role text not null check (role in ('coordinator', 'helper')),
  invited_by uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (wedding_id, phone)
);
create index wedding_invites_phone_idx on public.wedding_invites (phone);

-- Audit: who recorded a payment (now that multiple people can).
alter table public.payments
  add column recorded_by_user_id uuid references public.users (id) on delete set null;

-- ---------------------------------------------------------------------------
-- Helper functions (security definer -> bypass RLS, avoid policy recursion)
-- ---------------------------------------------------------------------------
create or replace function public.is_wedding_member(wid uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.wedding_members
    where wedding_id = wid and user_id = auth.uid()
  );
$$;

create or replace function public.wedding_role(wid uuid)
returns text language sql security definer stable set search_path = public as $$
  select role from public.wedding_members
  where wedding_id = wid and user_id = auth.uid();
$$;

create or replace function public.shares_wedding_with(other uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.wedding_members m1
    join public.wedding_members m2 on m1.wedding_id = m2.wedding_id
    where m1.user_id = auth.uid() and m2.user_id = other
  );
$$;

create or replace function public.resolve_my_invites()
returns void language plpgsql security definer set search_path = public as $$
declare v_phone text;
begin
  v_phone := auth.jwt() ->> 'phone';
  if v_phone is null or v_phone = '' then return; end if;
  insert into public.wedding_members (wedding_id, user_id, role)
    select i.wedding_id, auth.uid(), i.role
    from public.wedding_invites i
    where i.phone = v_phone
  on conflict (wedding_id, user_id) do nothing;
  delete from public.wedding_invites where phone = v_phone;
end;
$$;

-- Auto-create the owner membership whenever a wedding is created.
create or replace function public.handle_new_wedding()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.wedding_members (wedding_id, user_id, role)
  values (new.id, new.owner_user_id, 'owner')
  on conflict (wedding_id, user_id) do nothing;
  return new;
end;
$$;
create trigger on_wedding_created
  after insert on public.weddings
  for each row execute function public.handle_new_wedding();

-- Trigger functions are invoked by the trigger system, never via RPC.
revoke execute on function public.handle_new_wedding() from anon, authenticated;
revoke execute on function public.handle_new_auth_user() from anon, authenticated;

-- Backfill existing weddings' owners as members.
insert into public.wedding_members (wedding_id, user_id, role)
  select id, owner_user_id, 'owner' from public.weddings
on conflict (wedding_id, user_id) do nothing;

-- ---------------------------------------------------------------------------
-- RLS on the new tables
-- ---------------------------------------------------------------------------
alter table public.wedding_members enable row level security;
alter table public.wedding_invites enable row level security;

create policy "members read co-members" on public.wedding_members
  for select using (public.is_wedding_member(wedding_id));
create policy "owner manages members" on public.wedding_members
  for all using (
    exists (select 1 from public.weddings w where w.id = wedding_id and w.owner_user_id = auth.uid())
  ) with check (
    exists (select 1 from public.weddings w where w.id = wedding_id and w.owner_user_id = auth.uid())
  );

create policy "owner manages invites" on public.wedding_invites
  for all using (
    exists (select 1 from public.weddings w where w.id = wedding_id and w.owner_user_id = auth.uid())
  ) with check (
    exists (select 1 from public.weddings w where w.id = wedding_id and w.owner_user_id = auth.uid())
  );
create policy "invitee reads own invites" on public.wedding_invites
  for select using (phone = auth.jwt() ->> 'phone');

-- ---------------------------------------------------------------------------
-- Rewrite existing policies: owner-only -> membership/role based
-- ---------------------------------------------------------------------------
create policy "read co-members" on public.users
  for select using (public.shares_wedding_with(id));

drop policy if exists "manage own weddings" on public.weddings;
create policy "members read weddings" on public.weddings
  for select using (public.is_wedding_member(id));
create policy "owner inserts weddings" on public.weddings
  for insert with check (owner_user_id = auth.uid());
create policy "owner updates weddings" on public.weddings
  for update using (owner_user_id = auth.uid()) with check (owner_user_id = auth.uid());
create policy "owner deletes weddings" on public.weddings
  for delete using (owner_user_id = auth.uid());

drop policy if exists "manage ceremonies of own weddings" on public.ceremonies;
create policy "members read ceremonies" on public.ceremonies
  for select using (public.is_wedding_member(wedding_id));
create policy "staff write ceremonies" on public.ceremonies
  for all using (public.wedding_role(wedding_id) in ('owner', 'coordinator'))
  with check (public.wedding_role(wedding_id) in ('owner', 'coordinator'));

drop policy if exists "manage vendors of own weddings" on public.vendors;
create policy "members read vendors" on public.vendors
  for select using (public.is_wedding_member(wedding_id));
create policy "staff write vendors" on public.vendors
  for all using (public.wedding_role(wedding_id) in ('owner', 'coordinator'))
  with check (public.wedding_role(wedding_id) in ('owner', 'coordinator'));

drop policy if exists "manage vendor_ceremony of own weddings" on public.vendor_ceremony;
create policy "members read vendor_ceremony" on public.vendor_ceremony
  for select using (
    exists (select 1 from public.vendors v where v.id = vendor_id and public.is_wedding_member(v.wedding_id))
  );
create policy "staff write vendor_ceremony" on public.vendor_ceremony
  for all using (
    exists (select 1 from public.vendors v where v.id = vendor_id and public.wedding_role(v.wedding_id) in ('owner', 'coordinator'))
  ) with check (
    exists (select 1 from public.vendors v where v.id = vendor_id and public.wedding_role(v.wedding_id) in ('owner', 'coordinator'))
  );

-- payments: owner/coordinator only (helpers cannot even read money)
drop policy if exists "manage payments of own vendors" on public.payments;
create policy "staff manage payments" on public.payments
  for all using (
    exists (select 1 from public.vendors v where v.id = vendor_id and public.wedding_role(v.wedding_id) in ('owner', 'coordinator'))
  ) with check (
    exists (select 1 from public.vendors v where v.id = vendor_id and public.wedding_role(v.wedding_id) in ('owner', 'coordinator'))
  );

-- tasks: every member (incl. helper) can read & manage
drop policy if exists "manage tasks of own ceremonies" on public.tasks;
create policy "members manage tasks" on public.tasks
  for all using (
    exists (select 1 from public.ceremonies c where c.id = ceremony_id and public.is_wedding_member(c.wedding_id))
  ) with check (
    exists (select 1 from public.ceremonies c where c.id = ceremony_id and public.is_wedding_member(c.wedding_id))
  );

-- reminders: owner/coordinator only
drop policy if exists "manage reminders of own weddings" on public.reminders;
create policy "staff manage reminders" on public.reminders
  for all using (public.wedding_role(wedding_id) in ('owner', 'coordinator'))
  with check (public.wedding_role(wedding_id) in ('owner', 'coordinator'));
