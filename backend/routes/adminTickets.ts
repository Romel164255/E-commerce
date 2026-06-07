import express, { type Request, type Response } from "express";
import asyncHandler from "express-async-handler";
import { authenticateToken } from "../middleware/auth.js";
import { authorizeAdmin } from "../middleware/admin.js";
import {
  getAllTickets,
  getTicketById,
  addTicketMessage,
  updateTicketStatus,
  resolveTicket,
} from "../services/ticketService.js";
import type { TicketStatus, ResolutionAction } from "../types/ticket.js";

const router = express.Router();

/* =====================================================
   GET ALL TICKETS
   GET /admin/tickets?status=OPEN&type=REFUND
===================================================== */
router.get(
  "/",
  authenticateToken,
  authorizeAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const status = req.query.status as TicketStatus | undefined;
    const type = req.query.type as string | undefined;
    const tickets = await getAllTickets({ status, type });
    res.json({ data: tickets });
  }),
);

/* =====================================================
   GET SINGLE TICKET + MESSAGES
   GET /admin/tickets/:id
===================================================== */
router.get(
  "/:id",
  authenticateToken,
  authorizeAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const ticket = await getTicketById(
      Number(req.params.id),
      req.user!.userId!,
      true,
    );
    res.json(ticket);
  }),
);

/* =====================================================
   ADMIN REPLY
   POST /admin/tickets/:id/messages
===================================================== */
router.post(
  "/:id/messages",
  authenticateToken,
  authorizeAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const { message } = req.body as { message: string };
    if (!message?.trim()) {
      res.status(400).json({ error: "Message is required" });
      return;
    }
    const msg = await addTicketMessage({
      ticketId: Number(req.params.id),
      senderId: req.user!.userId!,
      senderRole: "admin",
      message: message.trim(),
    });
    res.status(201).json(msg);
  }),
);

/* =====================================================
   RESOLVE TICKET  ← THE REAL ACTION
   POST /admin/tickets/:id/resolve
   body: { action: "REFUND_ISSUED" | "RETURN_INITIATED" | "REJECTED", adminNote?: string }
===================================================== */
router.post(
  "/:id/resolve",
  authenticateToken,
  authorizeAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const { action, adminNote } = req.body as {
      action: ResolutionAction;
      adminNote?: string;
    };

    const VALID_ACTIONS: ResolutionAction[] = [
      "REFUND_ISSUED",
      "RETURN_INITIATED",
      "REJECTED",
    ];

    if (!action || !VALID_ACTIONS.includes(action)) {
      res.status(400).json({ error: "Invalid action. Use REFUND_ISSUED, RETURN_INITIATED, or REJECTED" });
      return;
    }

    const ticket = await resolveTicket({
      ticketId: Number(req.params.id),
      action,
      adminNote,
    });

    res.json(ticket);
  }),
);

/* =====================================================
   UPDATE STATUS (simple, non-resolution changes)
   PATCH /admin/tickets/:id/status
===================================================== */
router.patch(
  "/:id/status",
  authenticateToken,
  authorizeAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const { status } = req.body as { status: TicketStatus };
    const VALID_STATUSES: TicketStatus[] = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];
    if (!VALID_STATUSES.includes(status)) {
      res.status(400).json({ error: "Invalid status" });
      return;
    }
    const ticket = await updateTicketStatus(Number(req.params.id), status);
    res.json(ticket);
  }),
);

export default router;
