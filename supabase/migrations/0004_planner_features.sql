-- ---------------------------------------------------------------------------
-- Four planner-facing features, all keyed off the existing membership model:
--   1. contacts          — shared directory beyond vendors (family POCs etc.)
--   2. run_sheet_items   — minute-by-minute day-of timeline per ceremony
--   3. vendors.balance_due_at + reminders.kind — payment-due auto reminders
--   4. budget_categories + vendor_quotes — budget breakdown & quote comparison
-- ---------------------------------------------------------------------------

create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  name text not null,
  relation text,
  phone text,
  notes text,
  created_at timestamptz not null default now()
);
create index contacts_wedding_id_idx on public.contacts (wedding_id);

create table public.run_sheet_items (
  id uuid primary key default gen_random_uuid(),
  ceremony_id uuid not null references public.ceremonies (id) on delete cascade,
  time time,
  title text not null,
  notes text,
  done boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index run_sheet_items_ceremony_id_idx on public.run_sheet_items (ceremony_id);

alter table public.vendors add column balance_due_at timestamptz;

alter table public.reminders
  add column kind text not null default 'manual' check (kind in ('manual', 'payment_due'));
-- One auto payment-due reminder per vendor; re-set the due date and we upsert it.
create unique index reminders_payment_due_vendor_idx on public.reminders (vendor_id)
  where kind = 'payment_due';

create table public.budget_categories (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  name text not null,
  allocated_amount numeric(12, 2) not null default 0,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (wedding_id, name)
);
create index budget_categories_wedding_id_idx on public.budget_categories (wedding_id);

create table public.vendor_quotes (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors (id) on delete cascade,
  amount numeric(12, 2) not null,
  notes text,
  created_at timestamptz not null default now()
);
create index vendor_quotes_vendor_id_idx on public.vendor_quotes (vendor_id);

-- ---------------------------------------------------------------------------
-- RLS — contacts & budget data follow the vendor pattern (members read, staff
-- write). Run sheet follows the task pattern (every member, incl. helper,
-- can read & tick items off — they're the ones executing on the day).
-- ---------------------------------------------------------------------------
alter table public.contacts enable row level security;
alter table public.run_sheet_items enable row level security;
alter table public.budget_categories enable row level security;
alter table public.vendor_quotes enable row level security;

create policy "members read contacts" on public.contacts
  for select using (public.is_wedding_member(wedding_id));
create policy "staff write contacts" on public.contacts
  for all using (public.wedding_role(wedding_id) in ('owner', 'coordinator'))
  with check (public.wedding_role(wedding_id) in ('owner', 'coordinator'));

create policy "members manage run sheet" on public.run_sheet_items
  for all using (
    exists (select 1 from public.ceremonies c where c.id = ceremony_id and public.is_wedding_member(c.wedding_id))
  ) with check (
    exists (select 1 from public.ceremonies c where c.id = ceremony_id and public.is_wedding_member(c.wedding_id))
  );

create policy "members read budget categories" on public.budget_categories
  for select using (public.is_wedding_member(wedding_id));
create policy "staff write budget categories" on public.budget_categories
  for all using (public.wedding_role(wedding_id) in ('owner', 'coordinator'))
  with check (public.wedding_role(wedding_id) in ('owner', 'coordinator'));

create policy "members read vendor quotes" on public.vendor_quotes
  for select using (
    exists (select 1 from public.vendors v where v.id = vendor_id and public.is_wedding_member(v.wedding_id))
  );
create policy "staff write vendor quotes" on public.vendor_quotes
  for all using (
    exists (select 1 from public.vendors v where v.id = vendor_id and public.wedding_role(v.wedding_id) in ('owner', 'coordinator'))
  ) with check (
    exists (select 1 from public.vendors v where v.id = vendor_id and public.wedding_role(v.wedding_id) in ('owner', 'coordinator'))
  );
