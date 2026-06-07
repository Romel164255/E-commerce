import Razorpay from "razorpay";
import { pool } from "../db.js";
import type {
  TicketRow,
  TicketMessageRow,
  TicketWithDetails,
  CreateTicketParams,
  AddTicketMessageParams,
  ResolveTicketParams,
  TicketStatus,
  ResolutionAction,
} from "../types/ticket.js";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

/* ===============================
   RETURN WINDOW (days)
=============================== */
const RETURN_WINDOW_DAYS = 7;

/* ===============================
   CREATE TICKET
   - Validates order ownership
   - Enforces 7-day return window for RETURN/REFUND tickets
   - Blocks duplicate open tickets
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

    // Verify the order belongs to this user and get its details
    const orderCheck = await client.query<{
      id: number;
      status: string;
      delivered_at: Date | null;
    }>(
      "SELECT id, status, delivered_at FROM orders WHERE id = $1 AND user_id = $2",
      [orderId, userId],
    );

    if (!orderCheck.rows.length) {
      throw new Error("Order not found or does not belong to this user");
    }

    const order = orderCheck.rows[0];

    // Only allow tickets on non-pending orders
    if (order.status === "PENDING") {
      throw new Error("Cannot raise a ticket on an unpaid order");
    }

    // Enforce 7-day return window for RETURN and REFUND tickets
    if (type === "RETURN" || type === "REFUND") {
      if (order.status !== "DELIVERED" && order.status !== "RETURN_REQUESTED") {
        throw new Error(
          "Return/Refund requests can only be raised on delivered orders",
        );
      }

      if (order.delivered_at) {
        const daysSinceDelivery =
          (Date.now() - new Date(order.delivered_at).getTime()) /
          (1000 * 60 * 60 * 24);

        if (daysSinceDelivery > RETURN_WINDOW_DAYS) {
          throw new Error(
            `Return/Refund window has expired. Requests must be raised within ${RETURN_WINDOW_DAYS} days of delivery.`,
          );
        }
      }
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
export const getUserTickets = async (userId: number): Promise<TicketRow[]> => {
  const result = await pool.query<TicketRow>(
    `SELECT t.*, o.total AS order_total, o.status AS order_status
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
=============================== */
export const getTicketById = async (
  ticketId: number,
  userId: number,
  isAdmin: boolean,
): Promise<TicketWithDetails> => {
  const ticketResult = await pool.query<
    TicketRow & {
      user_email: string;
      order_total: number;
      order_status: string;
      razorpay_payment_id: string;
    }
  >(
    `SELECT t.*,
            u.email                  AS user_email,
            o.total                  AS order_total,
            o.status                 AS order_status,
            o.razorpay_payment_id    AS razorpay_payment_id,
            o.delivered_at           AS delivered_at
     FROM tickets t
     JOIN users  u ON t.user_id  = u.id
     JOIN orders o ON t.order_id = o.id
     WHERE t.id = $1`,
    [ticketId],
  );

  if (!ticketResult.rows.length) {
    throw new Error("Ticket not found");
  }

  const ticket = ticketResult.rows[0];

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
  const ticketCheck = await pool.query<{
    status: TicketStatus;
    user_id: number;
  }>("SELECT status, user_id FROM tickets WHERE id = $1", [ticketId]);

  if (!ticketCheck.rows.length) {
    throw new Error("Ticket not found");
  }

  const { status, user_id } = ticketCheck.rows[0];

  if (status === "CLOSED" || status === "RESOLVED") {
    throw new Error("Cannot reply to a resolved/closed ticket");
  }

  if (senderRole === "user" && user_id !== senderId) {
    throw new Error("Not authorized");
  }

  const msgResult = await pool.query<TicketMessageRow>(
    `INSERT INTO ticket_messages (ticket_id, sender_id, sender_role, message)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [ticketId, senderId, senderRole, message],
  );

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
   RESOLVE TICKET (ADMIN)
   The core action — this is what
   actually closes the loop:
   - RETURN  → marks order RETURN_REQUESTED
   - REFUND  → calls Razorpay refund API + records refund details
   - REJECTED → closes ticket with rejection note
=============================== */
export const resolveTicket = async ({
  ticketId,
  action,
  adminNote,
}: ResolveTicketParams): Promise<TicketRow> => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Fetch full ticket details
    const ticketResult = await client.query<
      TicketRow & {
        order_total: number;
        order_status: string;
        razorpay_payment_id: string | null;
      }
    >(
      `SELECT t.*,
              o.total               AS order_total,
              o.status              AS order_status,
              o.razorpay_payment_id AS razorpay_payment_id
       FROM tickets t
       JOIN orders o ON t.order_id = o.id
       WHERE t.id = $1
       FOR UPDATE`,
      [ticketId],
    );

    if (!ticketResult.rows.length) {
      throw new Error("Ticket not found");
    }

    const ticket = ticketResult.rows[0];

    if (ticket.status === "RESOLVED" || ticket.status === "CLOSED") {
      throw new Error("Ticket is already resolved/closed");
    }

    // -------------------------------------------------------
    // ACTION: RETURN_INITIATED
    // Flip order status to RETURN_REQUESTED
    // -------------------------------------------------------
    if (action === "RETURN_INITIATED") {
      if (ticket.type !== "RETURN") {
        throw new Error("RETURN_INITIATED action is only valid for RETURN tickets");
      }

      if (ticket.order_status !== "DELIVERED") {
        throw new Error("Order must be in DELIVERED status to initiate a return");
      }

      await client.query(
        `UPDATE orders
         SET status = 'RETURN_REQUESTED', updated_at = NOW()
         WHERE id = $1`,
        [ticket.order_id],
      );
    }

    // -------------------------------------------------------
    // ACTION: REFUND_ISSUED
    // Call Razorpay refund API, record refund details on order
    // -------------------------------------------------------
    if (action === "REFUND_ISSUED") {
      if (ticket.type !== "REFUND" && ticket.type !== "RETURN") {
        throw new Error("REFUND_ISSUED action is only valid for REFUND or RETURN tickets");
      }

      if (!ticket.razorpay_payment_id) {
        throw new Error(
          "No Razorpay payment ID found for this order. Cannot issue refund.",
        );
      }

      // Call Razorpay refund API
      const refundAmount = Math.round(Number(ticket.order_total) * 100); // paise

      let razorpayRefund: { id: string; status: string; amount: number };
      try {
        razorpayRefund = await razorpay.payments.refund(
          ticket.razorpay_payment_id,
          {
            amount: refundAmount,
            speed: "normal",
            notes: {
              ticket_id: String(ticketId),
              reason: ticket.subject,
            },
          },
        ) as typeof razorpayRefund;
      } catch (razorpayErr: unknown) {
        const msg =
          razorpayErr instanceof Error
            ? razorpayErr.message
            : "Razorpay refund failed";
        throw new Error(`Razorpay error: ${msg}`);
      }

      // Record refund on order
      await client.query(
        `UPDATE orders
         SET refund_id     = $1,
             refund_status = $2,
             refund_amount = $3,
             refunded_at   = NOW(),
             status        = 'CANCELLED',
             updated_at    = NOW()
         WHERE id = $4`,
        [
          razorpayRefund.id,
          razorpayRefund.status,
          Number(ticket.order_total),
          ticket.order_id,
        ],
      );
    }

    // -------------------------------------------------------
    // Post a system message in the thread
    // -------------------------------------------------------
    const systemMessages: Record<string, string> = {
      REFUND_ISSUED:
        "✅ Your refund has been initiated. It will reflect in your original payment method within 5–7 business days.",
      RETURN_INITIATED:
        "✅ Your return request has been approved. Our team will arrange a pickup shortly.",
      REJECTED:
        "❌ After reviewing your request, we are unable to process it at this time. Please contact support for more details.",
    };

    const noteToPost = adminNote || (action ? systemMessages[action] : "");

    if (noteToPost) {
      await client.query(
        `INSERT INTO ticket_messages (ticket_id, sender_id, sender_role, message)
         SELECT $1, u.id, 'admin', $2
         FROM users u WHERE u.role = 'admin' LIMIT 1`,
        [ticketId, noteToPost],
      );
    }

    // -------------------------------------------------------
    // Mark ticket RESOLVED
    // -------------------------------------------------------
    const updatedResult = await client.query<TicketRow>(
      `UPDATE tickets
       SET status            = 'RESOLVED',
           resolution_action = $1,
           resolved_at       = NOW(),
           updated_at        = NOW()
       WHERE id = $2
       RETURNING *`,
      [action, ticketId],
    );

    await client.query("COMMIT");
    return updatedResult.rows[0];
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

/* ===============================
   UPDATE TICKET STATUS (simple)
   For non-resolution status changes
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
}): Promise<
  Array<
    TicketRow & {
      user_email: string;
      order_total: number;
      order_status: string;
      message_count: number;
    }
  >
> => {
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
       o.status        AS order_status,
       COUNT(tm.id)    AS message_count
     FROM tickets t
     JOIN users  u  ON t.user_id  = u.id
     JOIN orders o  ON t.order_id = o.id
     LEFT JOIN ticket_messages tm ON tm.ticket_id = t.id
     ${where}
     GROUP BY t.id, u.email, o.total, o.status
     ORDER BY t.updated_at DESC`,
    values,
  );

  return result.rows;
};
