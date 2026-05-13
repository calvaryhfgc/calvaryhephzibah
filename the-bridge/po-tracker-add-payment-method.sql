-- ============================================================================
-- THE BRIDGE — PO Tracker: Add payment_method column
-- ============================================================================
-- Adds a 'payment_method' column to po_line_purchases for tracking whether
-- a purchase was paid for directly by the church or out of pocket by a
-- volunteer (and therefore is owed back).
--
-- Run in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/pfycvgbrsbecznkcikwt/sql/new
-- ============================================================================

alter table po_line_purchases
  add column if not exists payment_method text;

-- Values used by the client (null when not yet set):
--   'church'  → church paid directly (card, bank transfer, etc.)
--   'pocket'  → volunteer paid out of pocket; church owes them
-- We deliberately do NOT add a check constraint so we can introduce new
-- values (e.g. 'reimbursed') later without a schema migration.

comment on column po_line_purchases.payment_method is
  'How the line was paid: "church" (direct) | "pocket" (volunteer out of pocket, owed) | null (not set)';

select 'payment_method column ready on po_line_purchases' as status;
