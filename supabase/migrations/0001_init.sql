-- Vidhi v1 schema — matches project/uploads/design.md's data model exactly.
-- Every table is scoped to its owning wedding's owner via RLS so one
-- planner can never read or write another planner's data.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- users — profile row mirroring auth.users, created automatically on signup
-- ---------------------------------------------------------------------------
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  phone text,
  name text,
  created_at timestamptz not null default now()
);

create function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, phone)
  values (new.id, new.phone)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- ---------------------------------------------------------------------------
-- weddings
-- ---------------------------------------------------------------------------
create table public.weddings (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.users (id) on delete cascade,
  couple_names text not null,
  start_date date,
  end_date date,
  budget_total numeric(12, 2) not null default 0,
  created_at timestamptz not null default now()
);

create index weddings_owner_user_id_idx on public.weddings (owner_user_id);

-- ---------------------------------------------------------------------------
-- ceremonies
-- ---------------------------------------------------------------------------
create table public.ceremonies (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  name text not null,
  date date,
  time time,
  venue text,
  notes text
);

create index ceremonies_wedding_id_idx on public.ceremonies (wedding_id);

-- ---------------------------------------------------------------------------
-- vendors
-- ---------------------------------------------------------------------------
create table public.vendors (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  name text not null,
  category text not null,
  phone text,
  quoted_amount numeric(12, 2) not null default 0,
  notes text
);

create index vendors_wedding_id_idx on public.vendors (wedding_id);

-- ---------------------------------------------------------------------------
-- vendor_ceremony — junction: a vendor can serve multiple ceremonies
-- ---------------------------------------------------------------------------
create table public.vendor_ceremony (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors (id) on delete cascade,
  ceremony_id uuid not null references public.ceremonies (id) on delete cascade,
  unique (vendor_id, ceremony_id)
);

create index vendor_ceremony_vendor_id_idx on public.vendor_ceremony (vendor_id);
create index vendor_ceremony_ceremony_id_idx on public.vendor_ceremony (ceremony_id);

-- ---------------------------------------------------------------------------
-- payments
-- ---------------------------------------------------------------------------
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors (id) on delete cascade,
  amount numeric(12, 2) not null,
  mode text not null check (mode in ('cash', 'upi', 'bank')),
  type text not null check (type in ('advance', 'balance')),
  paid_at timestamptz not null default now(),
  notes text,
  created_via text not null default 'manual' check (created_via in ('manual', 'voice', 'chat_paste'))
);

create index payments_vendor_id_idx on public.payments (vendor_id);

-- ---------------------------------------------------------------------------
-- tasks
-- ---------------------------------------------------------------------------
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  ceremony_id uuid not null references public.ceremonies (id) on delete cascade,
  vendor_id uuid references public.vendors (id) on delete set null,
  description text not null,
  due_at timestamptz,
  done boolean not null default false
);

create index tasks_ceremony_id_idx on public.tasks (ceremony_id);
create index tasks_vendor_id_idx on public.tasks (vendor_id);

-- ---------------------------------------------------------------------------
-- reminders
-- ---------------------------------------------------------------------------
create table public.reminders (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  vendor_id uuid not null references public.vendors (id) on delete cascade,
  message_text text not null,
  scheduled_at timestamptz not null,
  sent boolean not null default false,
  wa_link text
);

create index reminders_wedding_id_idx on public.reminders (wedding_id);
create index reminders_scheduled_at_idx on public.reminders (scheduled_at) where not sent;

-- ---------------------------------------------------------------------------
-- push_subscriptions
-- ---------------------------------------------------------------------------
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  endpoint text not null unique,
  p256dh_key text not null,
  auth_key text not null
);

create index push_subscriptions_user_id_idx on public.push_subscriptions (user_id);

-- ---------------------------------------------------------------------------
-- Row Level Security — every table scoped to the owning planner
-- ---------------------------------------------------------------------------
alter table public.users enable row level security;
alter table public.weddings enable row level security;
alter table public.ceremonies enable row level security;
alter table public.vendors enable row level security;
alter table public.vendor_ceremony enable row level security;
alter table public.payments enable row level security;
alter table public.tasks enable row level security;
alter table public.reminders enable row level security;
alter table public.push_subscriptions enable row level security;

create policy "read own profile" on public.users
  for select using (id = auth.uid());
create policy "update own profile" on public.users
  for update using (id = auth.uid());

create policy "manage own weddings" on public.weddings
  for all using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());

create policy "manage ceremonies of own weddings" on public.ceremonies
  for all using (
    exists (select 1 from public.weddings w where w.id = wedding_id and w.owner_user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.weddings w where w.id = wedding_id and w.owner_user_id = auth.uid())
  );

create policy "manage vendors of own weddings" on public.vendors
  for all using (
    exists (select 1 from public.weddings w where w.id = wedding_id and w.owner_user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.weddings w where w.id = wedding_id and w.owner_user_id = auth.uid())
  );

create policy "manage vendor_ceremony of own weddings" on public.vendor_ceremony
  for all using (
    exists (
      select 1 from public.vendors v
      join public.weddings w on w.id = v.wedding_id
      where v.id = vendor_id and w.owner_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.vendors v
      join public.weddings w on w.id = v.wedding_id
      where v.id = vendor_id and w.owner_user_id = auth.uid()
    )
  );

create policy "manage payments of own vendors" on public.payments
  for all using (
    exists (
      select 1 from public.vendors v
      join public.weddings w on w.id = v.wedding_id
      where v.id = vendor_id and w.owner_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.vendors v
      join public.weddings w on w.id = v.wedding_id
      where v.id = vendor_id and w.owner_user_id = auth.uid()
    )
  );

create policy "manage tasks of own ceremonies" on public.tasks
  for all using (
    exists (
      select 1 from public.ceremonies c
      join public.weddings w on w.id = c.wedding_id
      where c.id = ceremony_id and w.owner_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.ceremonies c
      join public.weddings w on w.id = c.wedding_id
      where c.id = ceremony_id and w.owner_user_id = auth.uid()
    )
  );

create policy "manage reminders of own weddings" on public.reminders
  for all using (
    exists (select 1 from public.weddings w where w.id = wedding_id and w.owner_user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.weddings w where w.id = wedding_id and w.owner_user_id = auth.uid())
  );

create policy "manage own push subscriptions" on public.push_subscriptions
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid());
