-- ============================================================
--  TICKET SYSTEM MIGRATION
--  Run this once against your NeonDB
-- ============================================================

-- Enums (safe to re-run)
DO $$ BEGIN
  CREATE TYPE ticket_type AS ENUM ('RETURN', 'REFUND', 'COMPLAINT', 'OTHER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE ticket_status AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- tickets table
CREATE TABLE IF NOT EXISTS tickets (
  id                SERIAL PRIMARY KEY,
  user_id           INTEGER       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id          INTEGER       NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  type              ticket_type   NOT NULL DEFAULT 'COMPLAINT',
  status            ticket_status NOT NULL DEFAULT 'OPEN',
  subject           VARCHAR(255)  NOT NULL,
  resolution_action VARCHAR(30)   CHECK (resolution_action IN ('REFUND_ISSUED','RETURN_INITIATED','REJECTED')),
  resolved_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ticket_messages table
CREATE TABLE IF NOT EXISTS ticket_messages (
  id          SERIAL PRIMARY KEY,
  ticket_id   INTEGER     NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  sender_id   INTEGER     NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
  sender_role VARCHAR(20) NOT NULL CHECK (sender_role IN ('user', 'admin')),
  message     TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- New columns on orders table for refund tracking
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS delivered_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS refund_id      VARCHAR(100),
  ADD COLUMN IF NOT EXISTS refund_status  VARCHAR(50),
  ADD COLUMN IF NOT EXISTS refund_amount  NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS refunded_at    TIMESTAMPTZ;

-- Add RETURN_REQUESTED and CANCELLED to orders status enum if not present
DO $$ BEGIN
  ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'RETURN_REQUESTED';
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'CANCELLED';
EXCEPTION WHEN others THEN NULL; END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tickets_user      ON tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_order     ON tickets(order_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status    ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_ticket_messages   ON ticket_messages(ticket_id);
