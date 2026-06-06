-- ============================================================
--  TICKET SYSTEM MIGRATION
--  Adds support tables: tickets, ticket_messages
-- ============================================================

-- Ticket type enum
DO $$ BEGIN
  CREATE TYPE ticket_type AS ENUM ('RETURN', 'REFUND', 'COMPLAINT', 'OTHER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Ticket status enum
DO $$ BEGIN
  CREATE TYPE ticket_status AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Main tickets table
CREATE TABLE IF NOT EXISTS tickets (
  id             SERIAL PRIMARY KEY,
  user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id       INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  type           ticket_type   NOT NULL DEFAULT 'COMPLAINT',
  status         ticket_status NOT NULL DEFAULT 'OPEN',
  subject        VARCHAR(255)  NOT NULL,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Messages / thread inside a ticket (user + admin replies)
CREATE TABLE IF NOT EXISTS ticket_messages (
  id          SERIAL PRIMARY KEY,
  ticket_id   INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  sender_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sender_role VARCHAR(20) NOT NULL CHECK (sender_role IN ('user', 'admin')),
  message     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tickets_user    ON tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_order   ON tickets(order_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status  ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_ticket_messages ON ticket_messages(ticket_id);
