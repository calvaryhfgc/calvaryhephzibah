-- ============================================================================
-- THE BRIDGE — PO Tracker: Orders table (group checkouts + extras)
-- ============================================================================
-- Adds proper support for grouped supplier checkouts (e.g. one Amazon order
-- covering many PO lines) and off-PO extras (postage, warranties, sales tax,
-- currency fees, etc).
--
-- Run in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/pfycvgbrsbecznkcikwt/sql/new
-- ============================================================================

-- 1. The orders table — one row per actual checkout / transaction
create table if not exists po_orders (
  id              uuid primary key default gen_random_uuid(),
  po_slug         text not null,                       -- 'anniversary-2026-gear'
  supplier        text,                                -- 'Amazon UK', 'Andertons', etc.
  order_ref       text,                                -- order number / confirmation ID
  purchaser       text,                                -- who placed it (from dropdown)
  payment_method  text,                                -- 'church' | 'pocket'
  lines_total     numeric(10,2) default 0,             -- sum of line final_amounts
  extras_total    numeric(10,2) default 0,             -- sum of extras (postage etc.)
  grand_total     numeric(10,2) default 0,             -- lines_total + extras_total
  extras          jsonb default '[]'::jsonb,           -- [{label:'Postage', amount:8.50}, ...]
  notes           text,
  placed_at       timestamptz default now(),
  received_at     timestamptz,
  status          text not null default 'placed',      -- 'placed' | 'received' | 'cancelled'
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index if not exists idx_po_orders_po_slug   on po_orders(po_slug);
create index if not exists idx_po_orders_supplier  on po_orders(po_slug, supplier);

-- Auto-update updated_at
create or replace function trg_po_orders_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_po_orders_updated_at on po_orders;
create trigger trg_po_orders_updated_at
  before update on po_orders
  for each row execute function trg_po_orders_updated_at();

-- 2. Link line purchases to orders
alter table po_line_purchases
  add column if not exists order_id uuid references po_orders(id) on delete set null;

create index if not exists idx_po_line_purchases_order_id
  on po_line_purchases(order_id);

-- 3. RLS — same permissive pattern as the rest of Bridge
alter table po_orders enable row level security;

drop policy if exists "Allow all" on po_orders;
create policy "Allow all" on po_orders
  for all using (true) with check (true);

-- ============================================================================
-- Sanity check
-- ============================================================================
select 'po_orders table ready; po_line_purchases.order_id column added' as status;
