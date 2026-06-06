import express, { type Request, type Response } from "express";
import asyncHandler from "express-async-handler";
import { authenticateToken } from "../middleware/auth.js";
import { authorizeAdmin } from "../middleware/admin.js";
import {
  getAllTickets,
  getTicketById,
  addTicketMessage,
  updateTicketStatus,
} from "../services/ticketService.js";
import type { TicketStatus } from "../types/ticket.js";

const router = express.Router();

/* =====================================================
   GET ALL TICKETS (with optional filters)
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
   ADMIN REPLY TO TICKET
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
   UPDATE TICKET STATUS
   PATCH /admin/tickets/:id/status
===================================================== */
router.patch(
  "/:id/status",
  authenticateToken,
  authorizeAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const { status } = req.body as { status: TicketStatus };

    const VALID_STATUSES: TicketStatus[] = [
      "OPEN",
      "IN_PROGRESS",
      "RESOLVED",
      "CLOSED",
    ];

    if (!VALID_STATUSES.includes(status)) {
      res.status(400).json({ error: "Invalid status" });
      return;
    }

    const ticket = await updateTicketStatus(Number(req.params.id), status);
    res.json(ticket);
  }),
);

export default router;
