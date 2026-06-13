-- ============================================================
--  TICKET SYSTEM MIGRATION  v2
--  orders.status is VARCHAR — no enum to alter
--  Safe to re-run (all IF NOT EXISTS / exception guards)
-- ============================================================

-- ── 1. Ticket enums ─────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE ticket_type AS ENUM ('RETURN', 'REFUND', 'COMPLAINT', 'OTHER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE ticket_status AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── 2. tickets ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tickets (
  id                SERIAL        PRIMARY KEY,
  user_id           INTEGER       NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
  order_id          INTEGER       NOT NULL REFERENCES orders(id)  ON DELETE CASCADE,
  type              ticket_type   NOT NULL DEFAULT 'COMPLAINT',
  status            ticket_status NOT NULL DEFAULT 'OPEN',
  subject           VARCHAR(255)  NOT NULL,
  resolution_action VARCHAR(30)   CHECK (resolution_action IN ('REFUND_ISSUED','RETURN_INITIATED','REJECTED')),
  resolved_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ── 3. ticket_messages ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS ticket_messages (
  id          SERIAL      PRIMARY KEY,
  ticket_id   INTEGER     NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  sender_id   INTEGER     NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
  sender_role VARCHAR(20) NOT NULL CHECK (sender_role IN ('user','admin')),
  message     TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 4. New columns on orders (refund tracking + delivery ts) ─
--   orders.status is plain VARCHAR so no enum changes needed
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS delivered_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS refund_id      VARCHAR(100),
  ADD COLUMN IF NOT EXISTS refund_status  VARCHAR(50),
  ADD COLUMN IF NOT EXISTS refund_amount  NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS refunded_at    TIMESTAMPTZ;

-- ── 5. Indexes ───────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_tickets_user     ON tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_order    ON tickets(order_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status   ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_ticket_messages  ON ticket_messages(ticket_id);
