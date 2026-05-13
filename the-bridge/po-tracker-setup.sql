-- ============================================================================
-- THE BRIDGE — PO Tracker
-- ============================================================================
-- Multi-user purchase coordination for Bridge purchase orders.
-- Run in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/pfycvgbrsbecznkcikwt/sql/new
--
-- Reusable across any PO page (anniversary gear, pastor gift, christmas
-- service, weekly worship purchases, etc). Keyed by (po_slug, line_ref).
-- ============================================================================

create table if not exists po_line_purchases (
  id            uuid primary key default gen_random_uuid(),
  po_slug       text not null,          -- e.g. 'anniversary-2026-gear'
  line_ref      text not null,          -- e.g. '5.19' (matches PO row numbers)
  status        text not null default 'pending',
                                        -- 'pending' | 'claimed' | 'ordered'
                                        -- | 'received' | 'cancelled'
  purchaser     text,                   -- bridge_users_v2.name snapshot
  purchaser_id  bigint,                 -- bridge_users_v2.id
  final_amount  numeric(10,2),          -- final £ paid (may differ from estimate)
  order_ref     text,                   -- order number / eBay item ID etc
  notes         text,                   -- free-text (substitutions, comments)
  claimed_at    timestamptz,
  ordered_at    timestamptz,
  received_at   timestamptz,
  updated_at    timestamptz default now(),
  unique(po_slug, line_ref)
);

-- Helpful index for filtering by PO
create index if not exists idx_po_line_purchases_po_slug
  on po_line_purchases(po_slug);

-- Auto-update updated_at on every modification
create or replace function trg_po_line_purchases_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_po_line_purchases_updated_at on po_line_purchases;
create trigger trg_po_line_purchases_updated_at
  before update on po_line_purchases
  for each row execute function trg_po_line_purchases_updated_at();

-- ============================================================================
-- RLS — permissive for v1 (same pattern as bridge_users_v2)
-- ============================================================================
-- Permission gating is enforced in the client (only 'cos' or 'lead' users get
-- the claim UI; only the claimer can release/upgrade their own claim).
-- If we ever expose this DB outside Bridge, tighten with auth.uid() policies.
-- ============================================================================

alter table po_line_purchases enable row level security;

drop policy if exists "Allow all" on po_line_purchases;
create policy "Allow all" on po_line_purchases
  for all using (true) with check (true);

-- ============================================================================
-- Sanity check
-- ============================================================================
select 'po_line_purchases table ready' as status;
