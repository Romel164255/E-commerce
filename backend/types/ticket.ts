/* ===============================
   TICKET TYPES
=============================== */

export type TicketType = "RETURN" | "REFUND" | "COMPLAINT" | "OTHER";
export type TicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
export type ResolutionAction =
  | "REFUND_ISSUED"
  | "RETURN_INITIATED"
  | "REJECTED"
  | null;

export interface TicketRow {
  id: number;
  user_id: number;
  order_id: number;
  type: TicketType;
  status: TicketStatus;
  subject: string;
  resolution_action: ResolutionAction;
  resolved_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface TicketMessageRow {
  id: number;
  ticket_id: number;
  sender_id: number;
  sender_role: "user" | "admin";
  message: string;
  created_at: Date;
}

export interface CreateTicketParams {
  userId: number;
  orderId: number;
  type: TicketType;
  subject: string;
  message: string;
}

export interface AddTicketMessageParams {
  ticketId: number;
  senderId: number;
  senderRole: "user" | "admin";
  message: string;
}

export interface ResolveTicketParams {
  ticketId: number;
  action: ResolutionAction;
  adminNote?: string;
}

export interface TicketWithDetails extends TicketRow {
  user_email?: string;
  order_total?: number;
  order_status?: string;
  razorpay_payment_id?: string;
  messages: TicketMessageRow[];
}
