-- ============================================================
-- K MART — AUTO-CREATE CUSTOMER & CART ON FIRST LOGIN
-- When someone verifies their phone with OTP for the first time,
-- this creates their row in the customers table automatically,
-- using the phone number OTP already verified. No client-side
-- INSERT permission needed (and none is given).
-- It also initializes their cart row so checkout edge function
-- can find and process their cart.
-- ============================================================

create or replace function public.handle_new_customer()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer_id uuid;
begin
  -- Only phone (OTP) logins become customers. Admin/staff logins use
  -- email + password and have no phone, so they are skipped here.
  if new.phone is not null and new.phone <> '' then
    insert into public.customers (auth_user_id, phone)
    values (new.id, new.phone)
    on conflict (phone) do update
      set auth_user_id = coalesce(public.customers.auth_user_id, excluded.auth_user_id)
    returning id into v_customer_id;

    -- Ensure an active cart exists for this customer so checkout finds it
    if v_customer_id is not null then
      if not exists (select 1 from public.carts where customer_id = v_customer_id) then
        insert into public.carts (customer_id) values (v_customer_id);
      end if;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_customer on auth.users;

create trigger on_auth_user_created_customer
  after insert on auth.users
  for each row execute function public.handle_new_customer();

-- ---------- Backfill: people who already logged in before this existed ----------
-- (e.g. Om's test logins - they have a login but no customers row yet)
insert into public.customers (auth_user_id, phone)
select u.id, u.phone
from auth.users u
where u.phone is not null and u.phone <> ''
  and not exists (select 1 from public.customers c where c.auth_user_id = u.id)
on conflict (phone) do update
  set auth_user_id = coalesce(public.customers.auth_user_id, excluded.auth_user_id);

-- Ensure all existing customers have a cart row
insert into public.carts (customer_id)
select c.id
from public.customers c
where not exists (select 1 from public.carts cart where cart.customer_id = c.id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

alter table if exists public.customers enable row level security;
alter table if exists public.orders enable row level security;
alter table if exists public.order_items enable row level security;
alter table if exists public.order_status_history enable row level security;
alter table if exists public.carts enable row level security;
alter table if exists public.cart_items enable row level security;
alter table if exists public.addresses enable row level security;

-- Drop prior policies if present to prevent conflicts
drop policy if exists "Users can view their own customer row" on public.customers;
drop policy if exists "Users can update their own customer row" on public.customers;
drop policy if exists "Users can view their own cart" on public.carts;
drop policy if exists "Users can view their own cart items" on public.cart_items;
drop policy if exists "Users can insert their own cart items" on public.cart_items;
drop policy if exists "Users can update their own cart items" on public.cart_items;
drop policy if exists "Users can delete their own cart items" on public.cart_items;
drop policy if exists "Users can manage their own addresses" on public.addresses;
drop policy if exists "Users can view their own orders" on public.orders;
drop policy if exists "Users can view their own order_items" on public.order_items;
drop policy if exists "Users can view their own order_status_history" on public.order_status_history;

-- Customers: view and update own profile (inserts handled strictly by trigger)
create policy "Users can view their own customer row" on public.customers
  for select to authenticated
  using (auth_user_id = auth.uid());

create policy "Users can update their own customer row" on public.customers
  for update to authenticated
  using (auth_user_id = auth.uid())
  with check (auth_user_id = auth.uid());

-- Carts: view and insert own cart
drop policy if exists "Users can view their own cart" on public.carts;
create policy "Users can view their own cart" on public.carts
  for select to authenticated
  using (customer_id in (select id from public.customers where auth_user_id = auth.uid()));

drop policy if exists "Users can insert their own cart" on public.carts;
create policy "Users can insert their own cart" on public.carts
  for insert to authenticated
  with check (customer_id in (select id from public.customers where auth_user_id = auth.uid()));

-- Cart Items: manage items in own cart
create policy "Users can view their own cart items" on public.cart_items
  for select to authenticated
  using (cart_id in (
    select c.id from public.carts c
    join public.customers cu on cu.id = c.customer_id
    where cu.auth_user_id = auth.uid()
  ));

create policy "Users can insert their own cart items" on public.cart_items
  for insert to authenticated
  with check (cart_id in (
    select c.id from public.carts c
    join public.customers cu on cu.id = c.customer_id
    where cu.auth_user_id = auth.uid()
  ));

create policy "Users can update their own cart items" on public.cart_items
  for update to authenticated
  using (cart_id in (
    select c.id from public.carts c
    join public.customers cu on cu.id = c.customer_id
    where cu.auth_user_id = auth.uid()
  ));

create policy "Users can delete their own cart items" on public.cart_items
  for delete to authenticated
  using (cart_id in (
    select c.id from public.carts c
    join public.customers cu on cu.id = c.customer_id
    where cu.auth_user_id = auth.uid()
  ));

-- Addresses: manage own addresses
create policy "Users can manage their own addresses" on public.addresses
  for all to authenticated
  using (customer_id in (select id from public.customers where auth_user_id = auth.uid()))
  with check (customer_id in (select id from public.customers where auth_user_id = auth.uid()));

-- ORDERS & ORDER ITEMS:
-- LOCKED AGAINST CLIENT INSERTS (NO INSERT POLICY).
-- Orders must go through the server-side Checkout Edge Function.
-- Authenticated users can view their own orders:
create policy "Users can view their own orders" on public.orders
  for select to authenticated
  using (customer_id in (select id from public.customers where auth_user_id = auth.uid()));

create policy "Users can view their own order_items" on public.order_items
  for select to authenticated
  using (order_id in (
    select id from public.orders
    where customer_id in (select id from public.customers where auth_user_id = auth.uid())
  ));

create policy "Users can view their own order_status_history" on public.order_status_history
  for select to authenticated
  using (order_id in (
    select id from public.orders
    where customer_id in (select id from public.customers where auth_user_id = auth.uid())
  ));

-- ============================================================
-- OPTIONAL: SEED MISSING CATALOG PRODUCTS (E.G. KELLOGG'S CORN FLAKES)
-- Run this if you want Kellogg's Corn Flakes available in your live DB
-- ============================================================
insert into public.products (id, name, selling_price, mrp, weight_unit, brand, active, image_url)
values (
  'a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c8d',
  'Kellogg''s Corn Flakes',
  245,
  275,
  '500 g',
  'Kellogg''s',
  true,
  'https://images.unsplash.com/photo-1521483451569-e33803c0330c?auto=format&fit=crop&w=600&q=80'
) on conflict (id) do nothing;

insert into public.inventory (store_id, product_id, stock_quantity)
select s.id, 'a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c8d', 100
from public.stores s
on conflict do nothing;

-- ============================================================
-- AUTOMATED DELIVERY SLOTS GENERATION (NEXT 30 DAYS)
-- Ensures valid Morning & Evening slots exist for all stores
-- so checkout edge function never rejects active bookings.
-- ============================================================

create or replace function public.ensure_delivery_slots(p_days int default 14)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_store record;
  v_day date;
begin
  for v_store in select id from public.stores where active = true loop
    for i in 0..coalesce(p_days, 14) loop
      v_day := current_date + i;
      
      -- Morning slot (11:00 AM - 2:00 PM, cutoff 12:30 PM)
      insert into public.delivery_slots (
        store_id, slot_name, slot_date, start_time, end_time, order_cutoff_time, capacity, current_bookings
      )
      select v_store.id, 'Morning', v_day, '11:00:00'::time, '14:00:00'::time, '12:30:00'::time, 30, 0
      where not exists (
        select 1 from public.delivery_slots ds
        where ds.store_id = v_store.id
          and ds.slot_date = v_day
          and ds.slot_name = 'Morning'
      );

      -- Evening slot (4:00 PM - 7:00 PM, cutoff 5:30 PM)
      insert into public.delivery_slots (
        store_id, slot_name, slot_date, start_time, end_time, order_cutoff_time, capacity, current_bookings
      )
      select v_store.id, 'Evening', v_day, '16:00:00'::time, '19:00:00'::time, '17:30:00'::time, 30, 0
      where not exists (
        select 1 from public.delivery_slots ds
        where ds.store_id = v_store.id
          and ds.slot_date = v_day
          and ds.slot_name = 'Evening'
      );
    end loop;
  end loop;
end;
$$;

grant execute on function public.ensure_delivery_slots(int) to anon, authenticated, service_role;

-- Run immediately to populate the next 30 days of slots for all stores
select public.ensure_delivery_slots(30);


