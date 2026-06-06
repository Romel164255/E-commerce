import { pool } from "../db.js";
import type {
  TicketRow,
  TicketMessageRow,
  TicketWithDetails,
  CreateTicketParams,
  AddTicketMessageParams,
  TicketStatus,
} from "../types/ticket.js";

/* ===============================
   CREATE TICKET
=============================== */
export const createTicket = async ({
  userId,
  orderId,
  type,
  subject,
  message,
}: CreateTicketParams): Promise<TicketRow> => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Verify the order belongs to the user
    const orderCheck = await client.query<{ id: number; status: string }>(
      "SELECT id, status FROM orders WHERE id = $1 AND user_id = $2",
      [orderId, userId],
    );

    if (!orderCheck.rows.length) {
      throw new Error("Order not found or does not belong to this user");
    }

    // Prevent duplicate open tickets for same order+type
    const dupCheck = await client.query<{ id: number }>(
      `SELECT id FROM tickets
       WHERE user_id = $1 AND order_id = $2 AND type = $3
         AND status NOT IN ('RESOLVED','CLOSED')`,
      [userId, orderId, type],
    );

    if (dupCheck.rows.length) {
      throw new Error(
        "An open ticket of this type already exists for this order",
      );
    }

    // Insert ticket
    const ticketResult = await client.query<TicketRow>(
      `INSERT INTO tickets (user_id, order_id, type, subject)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userId, orderId, type, subject],
    );

    const ticket = ticketResult.rows[0];

    // Insert opening message
    await client.query(
      `INSERT INTO ticket_messages (ticket_id, sender_id, sender_role, message)
       VALUES ($1, $2, 'user', $3)`,
      [ticket.id, userId, message],
    );

    await client.query("COMMIT");
    return ticket;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

/* ===============================
   GET USER'S TICKETS
=============================== */
export const getUserTickets = async (
  userId: number,
): Promise<TicketRow[]> => {
  const result = await pool.query<TicketRow>(
    `SELECT t.*, o.total AS order_total
     FROM tickets t
     JOIN orders o ON t.order_id = o.id
     WHERE t.user_id = $1
     ORDER BY t.updated_at DESC`,
    [userId],
  );
  return result.rows;
};

/* ===============================
   GET SINGLE TICKET WITH MESSAGES
   (accessible by owner or admin)
=============================== */
export const getTicketById = async (
  ticketId: number,
  userId: number,
  isAdmin: boolean,
): Promise<TicketWithDetails> => {
  const ticketResult = await pool.query<TicketRow & { user_email: string; order_total: number }>(
    `SELECT t.*, u.email AS user_email, o.total AS order_total
     FROM tickets t
     JOIN users  u ON t.user_id   = u.id
     JOIN orders o ON t.order_id  = o.id
     WHERE t.id = $1`,
    [ticketId],
  );

  if (!ticketResult.rows.length) {
    throw new Error("Ticket not found");
  }

  const ticket = ticketResult.rows[0];

  // Non-admin can only see their own ticket
  if (!isAdmin && ticket.user_id !== userId) {
    throw new Error("Not authorized");
  }

  const messagesResult = await pool.query<TicketMessageRow>(
    `SELECT tm.*, u.email AS sender_email
     FROM ticket_messages tm
     JOIN users u ON tm.sender_id = u.id
     WHERE tm.ticket_id = $1
     ORDER BY tm.created_at ASC`,
    [ticketId],
  );

  return { ...ticket, messages: messagesResult.rows };
};

/* ===============================
   ADD MESSAGE TO TICKET
=============================== */
export const addTicketMessage = async ({
  ticketId,
  senderId,
  senderRole,
  message,
}: AddTicketMessageParams): Promise<TicketMessageRow> => {
  // Check ticket is not closed
  const ticketCheck = await pool.query<{ status: TicketStatus; user_id: number }>(
    "SELECT status, user_id FROM tickets WHERE id = $1",
    [ticketId],
  );

  if (!ticketCheck.rows.length) {
    throw new Error("Ticket not found");
  }

  const { status, user_id } = ticketCheck.rows[0];

  if (status === "CLOSED") {
    throw new Error("Cannot reply to a closed ticket");
  }

  // Non-admin: only owner can reply
  if (senderRole === "user" && user_id !== senderId) {
    throw new Error("Not authorized");
  }

  const msgResult = await pool.query<TicketMessageRow>(
    `INSERT INTO ticket_messages (ticket_id, sender_id, sender_role, message)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [ticketId, senderId, senderRole, message],
  );

  // Auto-bump ticket to IN_PROGRESS when admin first replies
  if (senderRole === "admin" && status === "OPEN") {
    await pool.query(
      "UPDATE tickets SET status = 'IN_PROGRESS', updated_at = NOW() WHERE id = $1",
      [ticketId],
    );
  } else {
    await pool.query(
      "UPDATE tickets SET updated_at = NOW() WHERE id = $1",
      [ticketId],
    );
  }

  return msgResult.rows[0];
};

/* ===============================
   UPDATE TICKET STATUS (ADMIN)
=============================== */
export const updateTicketStatus = async (
  ticketId: number,
  status: TicketStatus,
): Promise<TicketRow> => {
  const result = await pool.query<TicketRow>(
    `UPDATE tickets
     SET status = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [status, ticketId],
  );

  if (!result.rows.length) {
    throw new Error("Ticket not found");
  }

  return result.rows[0];
};

/* ===============================
   GET ALL TICKETS (ADMIN)
=============================== */
export const getAllTickets = async (filters: {
  status?: TicketStatus;
  type?: string;
}): Promise<Array<TicketRow & { user_email: string; order_total: number; message_count: number }>> => {
  const conditions: string[] = [];
  const values: string[] = [];
  let idx = 1;

  if (filters.status) {
    conditions.push(`t.status = $${idx++}`);
    values.push(filters.status);
  }

  if (filters.type) {
    conditions.push(`t.type = $${idx++}`);
    values.push(filters.type);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const result = await pool.query(
    `SELECT
       t.*,
       u.email         AS user_email,
       o.total         AS order_total,
       COUNT(tm.id)    AS message_count
     FROM tickets t
     JOIN users  u  ON t.user_id  = u.id
     JOIN orders o  ON t.order_id = o.id
     LEFT JOIN ticket_messages tm ON tm.ticket_id = t.id
     ${where}
     GROUP BY t.id, u.email, o.total
     ORDER BY t.updated_at DESC`,
    values,
  );

  return result.rows;
};
