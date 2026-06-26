create extension if not exists pgcrypto;

create sequence if not exists public.sale_number_seq;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  currency text not null default 'USD',
  timezone text not null default 'UTC',
  tax_rate_basis_points integer not null default 0 check (tax_rate_basis_points >= 0 and tax_rate_basis_points <= 10000),
  created_at timestamptz not null default now()
);

create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  address text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  store_id uuid references public.stores(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('owner_admin', 'cashier')),
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create unique index if not exists memberships_one_org_admin
  on public.memberships(user_id, organization_id)
  where store_id is null;

create unique index if not exists memberships_one_store_role
  on public.memberships(user_id, organization_id, store_id)
  where store_id is not null;

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  parent_id uuid references public.categories(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (organization_id, name)
);

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  phone text,
  email text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  description text,
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  sku text,
  barcode text,
  name text not null default 'Default',
  sale_price_cents integer not null check (sale_price_cents >= 0),
  cost_price_cents integer not null default 0 check (cost_price_cents >= 0),
  track_stock boolean not null default true,
  reorder_level numeric(12, 3) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists product_variants_org_sku_unique
  on public.product_variants(organization_id, lower(sku))
  where sku is not null and sku <> '';

create unique index if not exists product_variants_org_barcode_unique
  on public.product_variants(organization_id, lower(barcode))
  where barcode is not null and barcode <> '';

create table if not exists public.inventory_balances (
  store_id uuid not null references public.stores(id) on delete cascade,
  product_variant_id uuid not null references public.product_variants(id) on delete cascade,
  quantity_on_hand numeric(12, 3) not null default 0,
  updated_at timestamptz not null default now(),
  primary key (store_id, product_variant_id)
);

create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  product_variant_id uuid not null references public.product_variants(id) on delete cascade,
  movement_type text not null check (movement_type in ('opening', 'adjustment', 'sale', 'return', 'void')),
  quantity_delta numeric(12, 3) not null,
  unit_cost_cents integer,
  reference_type text,
  reference_id uuid,
  note text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.register_sessions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  opened_by uuid not null references public.profiles(id),
  closed_by uuid references public.profiles(id),
  opening_cash_cents integer not null default 0 check (opening_cash_cents >= 0),
  expected_cash_cents integer not null default 0,
  actual_cash_cents integer check (actual_cash_cents >= 0),
  status text not null default 'open' check (status in ('open', 'closed')),
  opened_at timestamptz not null default now(),
  closed_at timestamptz
);

create unique index if not exists one_open_register_per_user_store
  on public.register_sessions(store_id, opened_by)
  where status = 'open';

create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  register_session_id uuid not null references public.register_sessions(id),
  cashier_id uuid not null references public.profiles(id),
  sale_number text not null,
  status text not null default 'completed' check (status in ('completed', 'voided')),
  subtotal_cents integer not null check (subtotal_cents >= 0),
  discount_cents integer not null default 0 check (discount_cents >= 0),
  tax_cents integer not null default 0 check (tax_cents >= 0),
  total_cents integer not null check (total_cents >= 0),
  cash_received_cents integer not null check (cash_received_cents >= 0),
  change_due_cents integer not null default 0 check (change_due_cents >= 0),
  completed_at timestamptz not null default now(),
  voided_at timestamptz,
  voided_by uuid references public.profiles(id),
  void_reason text,
  unique (organization_id, sale_number)
);

create table if not exists public.sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales(id) on delete cascade,
  product_variant_id uuid not null references public.product_variants(id),
  product_name_snapshot text not null,
  sku_snapshot text,
  quantity numeric(12, 3) not null check (quantity > 0),
  unit_price_cents integer not null check (unit_price_cents >= 0),
  unit_cost_cents integer not null default 0 check (unit_cost_cents >= 0),
  line_total_cents integer not null check (line_total_cents >= 0)
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales(id) on delete cascade,
  method text not null default 'cash',
  amount_cents integer not null check (amount_cents >= 0),
  cash_received_cents integer check (cash_received_cents >= 0),
  change_due_cents integer check (change_due_cents >= 0),
  status text not null default 'completed' check (status in ('completed', 'voided')),
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_id uuid references public.profiles(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists touch_products_updated_at on public.products;
create trigger touch_products_updated_at
before update on public.products
for each row execute function public.touch_updated_at();

drop trigger if exists touch_product_variants_updated_at on public.product_variants;
create trigger touch_product_variants_updated_at
before update on public.product_variants
for each row execute function public.touch_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_org_member(p_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.memberships m
    join public.profiles p on p.id = m.user_id
    where m.organization_id = p_organization_id
      and m.user_id = auth.uid()
      and p.is_active
  );
$$;

create or replace function public.is_org_owner(p_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.memberships m
    join public.profiles p on p.id = m.user_id
    where m.organization_id = p_organization_id
      and m.user_id = auth.uid()
      and m.role = 'owner_admin'
      and p.is_active
  );
$$;

create or replace function public.is_store_member(p_store_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.stores s
    join public.memberships m on m.organization_id = s.organization_id
    join public.profiles p on p.id = m.user_id
    where s.id = p_store_id
      and m.user_id = auth.uid()
      and (m.store_id is null or m.store_id = p_store_id)
      and p.is_active
      and s.is_active
  );
$$;

alter table public.organizations enable row level security;
alter table public.stores enable row level security;
alter table public.profiles enable row level security;
alter table public.memberships enable row level security;
alter table public.categories enable row level security;
alter table public.suppliers enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.inventory_balances enable row level security;
alter table public.stock_movements enable row level security;
alter table public.register_sessions enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.payments enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists "members can read organizations" on public.organizations;
create policy "members can read organizations" on public.organizations
for select using (public.is_org_member(id));

drop policy if exists "owners can update organizations" on public.organizations;
create policy "owners can update organizations" on public.organizations
for update using (public.is_org_owner(id)) with check (public.is_org_owner(id));

drop policy if exists "members can read stores" on public.stores;
create policy "members can read stores" on public.stores
for select using (public.is_org_member(organization_id));

drop policy if exists "owners can write stores" on public.stores;
create policy "owners can write stores" on public.stores
for all using (public.is_org_owner(organization_id)) with check (public.is_org_owner(organization_id));

drop policy if exists "users can read own profile or org staff" on public.profiles;
create policy "users can read own profile or org staff" on public.profiles
for select using (
  id = auth.uid()
  or exists (
    select 1 from public.memberships m
    where m.user_id = profiles.id
      and public.is_org_owner(m.organization_id)
  )
);

drop policy if exists "users can insert own profile" on public.profiles;
create policy "users can insert own profile" on public.profiles
for insert with check (id = auth.uid());

drop policy if exists "users can update own profile" on public.profiles;
create policy "users can update own profile" on public.profiles
for update using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "users can read memberships" on public.memberships;
create policy "users can read memberships" on public.memberships
for select using (user_id = auth.uid() or public.is_org_owner(organization_id));

drop policy if exists "owners can write memberships" on public.memberships;
create policy "owners can write memberships" on public.memberships
for all using (public.is_org_owner(organization_id)) with check (public.is_org_owner(organization_id));

drop policy if exists "members can read categories" on public.categories;
create policy "members can read categories" on public.categories
for select using (public.is_org_member(organization_id));

drop policy if exists "owners can write categories" on public.categories;
create policy "owners can write categories" on public.categories
for all using (public.is_org_owner(organization_id)) with check (public.is_org_owner(organization_id));

drop policy if exists "members can read suppliers" on public.suppliers;
create policy "members can read suppliers" on public.suppliers
for select using (public.is_org_member(organization_id));

drop policy if exists "owners can write suppliers" on public.suppliers;
create policy "owners can write suppliers" on public.suppliers
for all using (public.is_org_owner(organization_id)) with check (public.is_org_owner(organization_id));

drop policy if exists "members can read products" on public.products;
create policy "members can read products" on public.products
for select using (public.is_org_member(organization_id));

drop policy if exists "owners can write products" on public.products;
create policy "owners can write products" on public.products
for all using (public.is_org_owner(organization_id)) with check (public.is_org_owner(organization_id));

drop policy if exists "members can read variants" on public.product_variants;
create policy "members can read variants" on public.product_variants
for select using (public.is_org_member(organization_id));

drop policy if exists "owners can write variants" on public.product_variants;
create policy "owners can write variants" on public.product_variants
for all using (public.is_org_owner(organization_id)) with check (public.is_org_owner(organization_id));

drop policy if exists "members can read balances" on public.inventory_balances;
create policy "members can read balances" on public.inventory_balances
for select using (public.is_store_member(store_id));

drop policy if exists "owners can write balances" on public.inventory_balances;
create policy "owners can write balances" on public.inventory_balances
for all using (
  exists (select 1 from public.stores s where s.id = store_id and public.is_org_owner(s.organization_id))
) with check (
  exists (select 1 from public.stores s where s.id = store_id and public.is_org_owner(s.organization_id))
);

drop policy if exists "members can read stock movements" on public.stock_movements;
create policy "members can read stock movements" on public.stock_movements
for select using (public.is_org_member(organization_id));

drop policy if exists "owners can write stock movements" on public.stock_movements;
create policy "owners can write stock movements" on public.stock_movements
for insert with check (public.is_org_owner(organization_id));

drop policy if exists "members can read register sessions" on public.register_sessions;
create policy "members can read register sessions" on public.register_sessions
for select using (public.is_store_member(store_id));

drop policy if exists "members can open register sessions" on public.register_sessions;
create policy "members can open register sessions" on public.register_sessions
for insert with check (opened_by = auth.uid() and public.is_store_member(store_id));

drop policy if exists "session owners can update register sessions" on public.register_sessions;
create policy "session owners can update register sessions" on public.register_sessions
for update using (
  opened_by = auth.uid()
  or public.is_org_owner(organization_id)
) with check (
  opened_by = auth.uid()
  or public.is_org_owner(organization_id)
);

drop policy if exists "members can read sales" on public.sales;
create policy "members can read sales" on public.sales
for select using (public.is_store_member(store_id));

drop policy if exists "members can read sale items" on public.sale_items;
create policy "members can read sale items" on public.sale_items
for select using (
  exists (select 1 from public.sales s where s.id = sale_id and public.is_store_member(s.store_id))
);

drop policy if exists "members can read payments" on public.payments;
create policy "members can read payments" on public.payments
for select using (
  exists (select 1 from public.sales s where s.id = sale_id and public.is_store_member(s.store_id))
);

drop policy if exists "owners can read audit logs" on public.audit_logs;
create policy "owners can read audit logs" on public.audit_logs
for select using (public.is_org_owner(organization_id));

drop policy if exists "members can write audit logs" on public.audit_logs;
create policy "members can write audit logs" on public.audit_logs
for insert with check (public.is_org_member(organization_id));

create or replace view public.daily_sales_summary
with (security_invoker = true)
as
with sale_totals as (
  select
    completed_at::date as sale_date,
    organization_id,
    store_id,
    coalesce(sum(total_cents) filter (where status = 'completed'), 0)::integer as gross_sales_cents,
    count(*) filter (where status = 'completed')::integer as transaction_count,
    coalesce(round(avg(total_cents) filter (where status = 'completed')), 0)::integer as average_order_cents,
    count(*) filter (where status = 'voided')::integer as voided_sales_count
  from public.sales
  group by completed_at::date, organization_id, store_id
),
item_totals as (
  select
    s.completed_at::date as sale_date,
    s.organization_id,
    s.store_id,
    coalesce(sum(si.quantity), 0)::numeric(12, 3) as items_sold
  from public.sales s
  join public.sale_items si on si.sale_id = s.id
  where s.status = 'completed'
  group by s.completed_at::date, s.organization_id, s.store_id
),
cash_totals as (
  select
    s.completed_at::date as sale_date,
    s.organization_id,
    s.store_id,
    coalesce(sum(p.amount_cents), 0)::integer as cash_collected_cents
  from public.sales s
  join public.payments p on p.sale_id = s.id
  where s.status = 'completed'
    and p.method = 'cash'
    and p.status = 'completed'
  group by s.completed_at::date, s.organization_id, s.store_id
)
select
  st.sale_date,
  st.organization_id,
  st.store_id,
  st.gross_sales_cents,
  st.transaction_count,
  st.average_order_cents,
  coalesce(it.items_sold, 0)::numeric(12, 3) as items_sold,
  coalesce(ct.cash_collected_cents, 0)::integer as cash_collected_cents,
  st.voided_sales_count
from sale_totals st
left join item_totals it
  on it.sale_date = st.sale_date
  and it.organization_id = st.organization_id
  and it.store_id = st.store_id
left join cash_totals ct
  on ct.sale_date = st.sale_date
  and ct.organization_id = st.organization_id
  and ct.store_id = st.store_id;

create or replace view public.low_stock_products
with (security_invoker = true)
as
select
  ib.store_id,
  pv.organization_id,
  pv.id as product_variant_id,
  p.name as product_name,
  pv.name as variant_name,
  pv.sku,
  pv.barcode,
  ib.quantity_on_hand,
  pv.reorder_level
from public.inventory_balances ib
join public.product_variants pv on pv.id = ib.product_variant_id
join public.products p on p.id = pv.product_id
where pv.track_stock
  and pv.is_active
  and p.is_active
  and ib.quantity_on_hand <= pv.reorder_level;

create or replace view public.daily_top_products
with (security_invoker = true)
as
select
  s.completed_at::date as sale_date,
  s.organization_id,
  s.store_id,
  si.product_variant_id,
  si.product_name_snapshot,
  sum(si.quantity)::numeric(12, 3) as quantity_sold,
  sum(si.line_total_cents)::integer as sales_cents
from public.sale_items si
join public.sales s on s.id = si.sale_id
where s.status = 'completed'
group by s.completed_at::date, s.organization_id, s.store_id, si.product_variant_id, si.product_name_snapshot;

create or replace function public.bootstrap_owner_account(
  p_organization_name text,
  p_store_name text,
  p_full_name text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_org_id uuid;
  v_store_id uuid;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if exists (select 1 from public.memberships where user_id = v_user_id) then
    raise exception 'This user already belongs to an organization';
  end if;

  insert into public.profiles (id, full_name)
  values (v_user_id, nullif(trim(p_full_name), ''))
  on conflict (id) do update
    set full_name = coalesce(nullif(trim(p_full_name), ''), public.profiles.full_name);

  insert into public.organizations (name)
  values (coalesce(nullif(trim(p_organization_name), ''), 'My Business'))
  returning id into v_org_id;

  insert into public.stores (organization_id, name)
  values (v_org_id, coalesce(nullif(trim(p_store_name), ''), 'Main Store'))
  returning id into v_store_id;

  insert into public.memberships (organization_id, store_id, user_id, role, created_by)
  values (v_org_id, null, v_user_id, 'owner_admin', v_user_id);

  insert into public.audit_logs (organization_id, actor_id, action, entity_type, entity_id, after_data)
  values (
    v_org_id,
    v_user_id,
    'bootstrap_owner_account',
    'organization',
    v_org_id,
    jsonb_build_object('store_id', v_store_id)
  );

  return jsonb_build_object('organization_id', v_org_id, 'store_id', v_store_id);
end;
$$;

create or replace function public.open_register_session(
  p_store_id uuid,
  p_opening_cash_cents integer default 0
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_org_id uuid;
  v_session_id uuid;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if p_opening_cash_cents < 0 then
    raise exception 'Opening cash cannot be negative';
  end if;

  select organization_id into v_org_id
  from public.stores
  where id = p_store_id and is_active;

  if v_org_id is null or not public.is_store_member(p_store_id) then
    raise exception 'Store access denied';
  end if;

  insert into public.register_sessions (
    organization_id,
    store_id,
    opened_by,
    opening_cash_cents,
    expected_cash_cents
  )
  values (v_org_id, p_store_id, v_user_id, p_opening_cash_cents, p_opening_cash_cents)
  returning id into v_session_id;

  insert into public.audit_logs (organization_id, actor_id, action, entity_type, entity_id, after_data)
  values (
    v_org_id,
    v_user_id,
    'open_register_session',
    'register_session',
    v_session_id,
    jsonb_build_object('opening_cash_cents', p_opening_cash_cents)
  );

  return jsonb_build_object('register_session_id', v_session_id);
end;
$$;

create or replace function public.close_register_session(
  p_register_session_id uuid,
  p_actual_cash_cents integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_session public.register_sessions%rowtype;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if p_actual_cash_cents < 0 then
    raise exception 'Actual cash cannot be negative';
  end if;

  select * into v_session
  from public.register_sessions
  where id = p_register_session_id
  for update;

  if not found then
    raise exception 'Register session not found';
  end if;

  if v_session.status <> 'open' then
    raise exception 'Register session is already closed';
  end if;

  if v_session.opened_by <> v_user_id and not public.is_org_owner(v_session.organization_id) then
    raise exception 'Only the opener or owner can close this register';
  end if;

  update public.register_sessions
  set
    status = 'closed',
    closed_by = v_user_id,
    actual_cash_cents = p_actual_cash_cents,
    closed_at = now()
  where id = p_register_session_id;

  insert into public.audit_logs (organization_id, actor_id, action, entity_type, entity_id, after_data)
  values (
    v_session.organization_id,
    v_user_id,
    'close_register_session',
    'register_session',
    p_register_session_id,
    jsonb_build_object(
      'expected_cash_cents', v_session.expected_cash_cents,
      'actual_cash_cents', p_actual_cash_cents,
      'difference_cents', p_actual_cash_cents - v_session.expected_cash_cents
    )
  );

  return jsonb_build_object(
    'register_session_id', p_register_session_id,
    'expected_cash_cents', v_session.expected_cash_cents,
    'actual_cash_cents', p_actual_cash_cents,
    'difference_cents', p_actual_cash_cents - v_session.expected_cash_cents
  );
end;
$$;

create or replace function public.adjust_inventory(
  p_store_id uuid,
  p_product_variant_id uuid,
  p_quantity_delta numeric,
  p_note text default null,
  p_movement_type text default 'adjustment'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_org_id uuid;
  v_new_quantity numeric(12, 3);
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select s.organization_id into v_org_id
  from public.stores s
  join public.product_variants pv on pv.organization_id = s.organization_id
  where s.id = p_store_id and pv.id = p_product_variant_id and s.is_active;

  if v_org_id is null or not public.is_org_owner(v_org_id) then
    raise exception 'Only owners can adjust inventory';
  end if;

  if p_movement_type not in ('opening', 'adjustment') then
    raise exception 'Invalid inventory movement type';
  end if;

  insert into public.inventory_balances (store_id, product_variant_id, quantity_on_hand)
  values (p_store_id, p_product_variant_id, 0)
  on conflict (store_id, product_variant_id) do nothing;

  update public.inventory_balances
  set
    quantity_on_hand = quantity_on_hand + p_quantity_delta,
    updated_at = now()
  where store_id = p_store_id and product_variant_id = p_product_variant_id
  returning quantity_on_hand into v_new_quantity;

  if v_new_quantity < 0 then
    raise exception 'Inventory cannot be adjusted below zero';
  end if;

  insert into public.stock_movements (
    organization_id,
    store_id,
    product_variant_id,
    movement_type,
    quantity_delta,
    reference_type,
    note,
    created_by
  )
  values (
    v_org_id,
    p_store_id,
    p_product_variant_id,
    p_movement_type,
    p_quantity_delta,
    'manual',
    p_note,
    v_user_id
  );

  insert into public.audit_logs (organization_id, actor_id, action, entity_type, entity_id, after_data)
  values (
    v_org_id,
    v_user_id,
    'adjust_inventory',
    'product_variant',
    p_product_variant_id,
    jsonb_build_object('quantity_delta', p_quantity_delta, 'new_quantity', v_new_quantity)
  );

  return jsonb_build_object('product_variant_id', p_product_variant_id, 'quantity_on_hand', v_new_quantity);
end;
$$;

create or replace function public.complete_cash_sale(
  p_store_id uuid,
  p_register_session_id uuid,
  p_cart_items jsonb,
  p_cash_received_cents integer,
  p_discount_cents integer default 0
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_session public.register_sessions%rowtype;
  v_tax_rate_basis_points integer := 0;
  v_sale_id uuid;
  v_sale_number text;
  v_subtotal_cents integer := 0;
  v_tax_cents integer := 0;
  v_total_cents integer := 0;
  v_change_due_cents integer := 0;
  v_line record;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if p_cash_received_cents < 0 or p_discount_cents < 0 then
    raise exception 'Cash and discount cannot be negative';
  end if;

  if p_cart_items is null or jsonb_typeof(p_cart_items) <> 'array' then
    raise exception 'Cart items must be an array';
  end if;

  select * into v_session
  from public.register_sessions
  where id = p_register_session_id
  for update;

  if not found then
    raise exception 'Register session not found';
  end if;

  if v_session.store_id <> p_store_id or v_session.status <> 'open' then
    raise exception 'Register session is not open for this store';
  end if;

  if v_session.opened_by <> v_user_id and not public.is_org_owner(v_session.organization_id) then
    raise exception 'Only the active cashier or owner can use this register';
  end if;

  if not public.is_store_member(p_store_id) then
    raise exception 'Store access denied';
  end if;

  drop table if exists pg_temp.checkout_cart;
  create temporary table checkout_cart (
    product_variant_id uuid primary key,
    quantity numeric(12, 3) not null check (quantity > 0)
  ) on commit drop;

  insert into checkout_cart (product_variant_id, quantity)
  select variant_id, sum(quantity)::numeric(12, 3)
  from jsonb_to_recordset(p_cart_items) as x(variant_id uuid, quantity numeric)
  where variant_id is not null and quantity > 0
  group by variant_id;

  if not exists (select 1 from checkout_cart) then
    raise exception 'Cart is empty';
  end if;

  if exists (
    select 1
    from checkout_cart c
    left join public.product_variants pv
      on pv.id = c.product_variant_id
      and pv.organization_id = v_session.organization_id
      and pv.is_active
    left join public.products p on p.id = pv.product_id and p.is_active
    where pv.id is null or p.id is null
  ) then
    raise exception 'Cart contains inactive or unknown products';
  end if;

  insert into public.inventory_balances (store_id, product_variant_id, quantity_on_hand)
  select p_store_id, c.product_variant_id, 0
  from checkout_cart c
  on conflict (store_id, product_variant_id) do nothing;

  for v_line in
    select
      c.quantity,
      pv.id,
      pv.track_stock,
      pv.sale_price_cents,
      pv.cost_price_cents,
      ib.quantity_on_hand
    from checkout_cart c
    join public.product_variants pv on pv.id = c.product_variant_id
    join public.inventory_balances ib on ib.store_id = p_store_id and ib.product_variant_id = pv.id
    for update of ib
  loop
    if v_line.track_stock and v_line.quantity_on_hand < v_line.quantity then
      raise exception 'Insufficient stock for variant %', v_line.id;
    end if;
  end loop;

  select tax_rate_basis_points into v_tax_rate_basis_points
  from public.organizations
  where id = v_session.organization_id;

  select coalesce(sum(round(c.quantity * pv.sale_price_cents)), 0)::integer
  into v_subtotal_cents
  from checkout_cart c
  join public.product_variants pv on pv.id = c.product_variant_id;

  if p_discount_cents > v_subtotal_cents then
    raise exception 'Discount cannot exceed subtotal';
  end if;

  v_tax_cents := round(((v_subtotal_cents - p_discount_cents) * v_tax_rate_basis_points)::numeric / 10000)::integer;
  v_total_cents := v_subtotal_cents - p_discount_cents + v_tax_cents;

  if p_cash_received_cents < v_total_cents then
    raise exception 'Cash received is less than sale total';
  end if;

  v_change_due_cents := p_cash_received_cents - v_total_cents;
  v_sale_number := 'S-' || to_char(now(), 'YYYYMMDD') || '-' || lpad(nextval('public.sale_number_seq')::text, 6, '0');

  insert into public.sales (
    organization_id,
    store_id,
    register_session_id,
    cashier_id,
    sale_number,
    subtotal_cents,
    discount_cents,
    tax_cents,
    total_cents,
    cash_received_cents,
    change_due_cents
  )
  values (
    v_session.organization_id,
    p_store_id,
    p_register_session_id,
    v_user_id,
    v_sale_number,
    v_subtotal_cents,
    p_discount_cents,
    v_tax_cents,
    v_total_cents,
    p_cash_received_cents,
    v_change_due_cents
  )
  returning id into v_sale_id;

  insert into public.sale_items (
    sale_id,
    product_variant_id,
    product_name_snapshot,
    sku_snapshot,
    quantity,
    unit_price_cents,
    unit_cost_cents,
    line_total_cents
  )
  select
    v_sale_id,
    pv.id,
    case when pv.name = 'Default' then p.name else p.name || ' / ' || pv.name end,
    pv.sku,
    c.quantity,
    pv.sale_price_cents,
    pv.cost_price_cents,
    round(c.quantity * pv.sale_price_cents)::integer
  from checkout_cart c
  join public.product_variants pv on pv.id = c.product_variant_id
  join public.products p on p.id = pv.product_id;

  insert into public.payments (
    sale_id,
    method,
    amount_cents,
    cash_received_cents,
    change_due_cents,
    status
  )
  values (
    v_sale_id,
    'cash',
    v_total_cents,
    p_cash_received_cents,
    v_change_due_cents,
    'completed'
  );

  update public.inventory_balances ib
  set
    quantity_on_hand = ib.quantity_on_hand - c.quantity,
    updated_at = now()
  from checkout_cart c
  join public.product_variants pv on pv.id = c.product_variant_id
  where ib.store_id = p_store_id
    and ib.product_variant_id = c.product_variant_id
    and pv.track_stock;

  insert into public.stock_movements (
    organization_id,
    store_id,
    product_variant_id,
    movement_type,
    quantity_delta,
    unit_cost_cents,
    reference_type,
    reference_id,
    created_by
  )
  select
    v_session.organization_id,
    p_store_id,
    pv.id,
    'sale',
    -c.quantity,
    pv.cost_price_cents,
    'sale',
    v_sale_id,
    v_user_id
  from checkout_cart c
  join public.product_variants pv on pv.id = c.product_variant_id
  where pv.track_stock;

  update public.register_sessions
  set expected_cash_cents = expected_cash_cents + v_total_cents
  where id = p_register_session_id;

  insert into public.audit_logs (organization_id, actor_id, action, entity_type, entity_id, after_data)
  values (
    v_session.organization_id,
    v_user_id,
    'complete_cash_sale',
    'sale',
    v_sale_id,
    jsonb_build_object('sale_number', v_sale_number, 'total_cents', v_total_cents)
  );

  return jsonb_build_object(
    'sale_id', v_sale_id,
    'sale_number', v_sale_number,
    'subtotal_cents', v_subtotal_cents,
    'discount_cents', p_discount_cents,
    'tax_cents', v_tax_cents,
    'total_cents', v_total_cents,
    'cash_received_cents', p_cash_received_cents,
    'change_due_cents', v_change_due_cents,
    'items', (
      select jsonb_agg(
        jsonb_build_object(
          'name', si.product_name_snapshot,
          'quantity', si.quantity,
          'line_total_cents', si.line_total_cents
        )
        order by si.product_name_snapshot
      )
      from public.sale_items si
      where si.sale_id = v_sale_id
    )
  );
end;
$$;

create or replace function public.void_sale(
  p_sale_id uuid,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_sale public.sales%rowtype;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_sale
  from public.sales
  where id = p_sale_id
  for update;

  if not found then
    raise exception 'Sale not found';
  end if;

  if not public.is_org_owner(v_sale.organization_id) then
    raise exception 'Only owners can void sales';
  end if;

  if v_sale.status <> 'completed' then
    raise exception 'Sale is already voided';
  end if;

  update public.inventory_balances ib
  set
    quantity_on_hand = quantity_on_hand + si.quantity,
    updated_at = now()
  from public.sale_items si
  join public.product_variants pv on pv.id = si.product_variant_id
  where si.sale_id = p_sale_id
    and ib.store_id = v_sale.store_id
    and ib.product_variant_id = si.product_variant_id
    and pv.track_stock;

  insert into public.stock_movements (
    organization_id,
    store_id,
    product_variant_id,
    movement_type,
    quantity_delta,
    unit_cost_cents,
    reference_type,
    reference_id,
    note,
    created_by
  )
  select
    v_sale.organization_id,
    v_sale.store_id,
    si.product_variant_id,
    'void',
    si.quantity,
    si.unit_cost_cents,
    'sale',
    p_sale_id,
    p_note,
    v_user_id
  from public.sale_items si
  join public.product_variants pv on pv.id = si.product_variant_id
  where si.sale_id = p_sale_id and pv.track_stock;

  update public.payments
  set status = 'voided'
  where sale_id = p_sale_id;

  update public.register_sessions
  set expected_cash_cents = expected_cash_cents - v_sale.total_cents
  where id = v_sale.register_session_id and status = 'open';

  update public.sales
  set
    status = 'voided',
    voided_at = now(),
    voided_by = v_user_id,
    void_reason = p_note
  where id = p_sale_id;

  insert into public.audit_logs (organization_id, actor_id, action, entity_type, entity_id, after_data)
  values (
    v_sale.organization_id,
    v_user_id,
    'void_sale',
    'sale',
    p_sale_id,
    jsonb_build_object('note', p_note, 'total_cents', v_sale.total_cents)
  );

  return jsonb_build_object('sale_id', p_sale_id, 'status', 'voided');
end;
$$;

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "members can read product images" on storage.objects;
create policy "members can read product images" on storage.objects
for select using (
  bucket_id = 'product-images'
  and public.is_org_member(((storage.foldername(name))[1])::uuid)
);

drop policy if exists "owners can upload product images" on storage.objects;
create policy "owners can upload product images" on storage.objects
for insert with check (
  bucket_id = 'product-images'
  and public.is_org_owner(((storage.foldername(name))[1])::uuid)
);

drop policy if exists "owners can update product images" on storage.objects;
create policy "owners can update product images" on storage.objects
for update using (
  bucket_id = 'product-images'
  and public.is_org_owner(((storage.foldername(name))[1])::uuid)
) with check (
  bucket_id = 'product-images'
  and public.is_org_owner(((storage.foldername(name))[1])::uuid)
);
