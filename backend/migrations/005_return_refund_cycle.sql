-- ============================================================
--  MIGRATION 005 — Return/Refund cycle support
--  Run AFTER 004_tickets.sql
-- ============================================================

-- Add RETURN_REQUESTED to order status enum
ALTER TYPE order_status_enum ADD VALUE IF NOT EXISTS 'RETURN_REQUESTED';
-- If your orders.status column is a plain VARCHAR (not enum), this is a no-op —
-- the CHECK constraint below handles it instead.

-- Add delivered_at timestamp so we can enforce return windows
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;

-- Add refund tracking columns
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS refund_id        VARCHAR(255),
  ADD COLUMN IF NOT EXISTS refund_status    VARCHAR(50),
  ADD COLUMN IF NOT EXISTS refund_amount    NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS refunded_at      TIMESTAMPTZ;

-- Add resolution metadata to tickets
ALTER TABLE tickets
  ADD COLUMN IF NOT EXISTS resolution_action VARCHAR(50),   -- 'REFUND_ISSUED' | 'RETURN_INITIATED' | 'REJECTED' | null
  ADD COLUMN IF NOT EXISTS resolved_at        TIMESTAMPTZ;
