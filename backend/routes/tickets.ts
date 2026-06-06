import express, { type Request, type Response } from "express";
import asyncHandler from "express-async-handler";
import { authenticateToken } from "../middleware/auth.js";
import {
  createTicket,
  getUserTickets,
  getTicketById,
  addTicketMessage,
} from "../services/ticketService.js";
import type { TicketType } from "../types/ticket.js";

const router = express.Router();

/* =====================================================
   CREATE TICKET
   POST /tickets
===================================================== */
router.post(
  "/",
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { orderId, type, subject, message } = req.body as {
      orderId: number;
      type: TicketType;
      subject: string;
      message: string;
    };

    if (!orderId || !type || !subject?.trim() || !message?.trim()) {
      res.status(400).json({ error: "orderId, type, subject and message are required" });
      return;
    }

    const VALID_TYPES: TicketType[] = ["RETURN", "REFUND", "COMPLAINT", "OTHER"];
    if (!VALID_TYPES.includes(type)) {
      res.status(400).json({ error: "Invalid ticket type" });
      return;
    }

    const ticket = await createTicket({
      userId: req.user!.userId!,
      orderId,
      type,
      subject: subject.trim(),
      message: message.trim(),
    });

    res.status(201).json(ticket);
  }),
);

/* =====================================================
   GET MY TICKETS
   GET /tickets
===================================================== */
router.get(
  "/",
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const tickets = await getUserTickets(req.user!.userId!);
    res.json({ data: tickets });
  }),
);

/* =====================================================
   GET SINGLE TICKET + MESSAGES
   GET /tickets/:id
===================================================== */
router.get(
  "/:id",
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const isAdmin = req.user!.role === "admin";
    const ticket = await getTicketById(
      Number(req.params.id),
      req.user!.userId!,
      isAdmin,
    );
    res.json(ticket);
  }),
);

/* =====================================================
   ADD MESSAGE (USER REPLY)
   POST /tickets/:id/messages
===================================================== */
router.post(
  "/:id/messages",
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { message } = req.body as { message: string };

    if (!message?.trim()) {
      res.status(400).json({ error: "Message is required" });
      return;
    }

    const msg = await addTicketMessage({
      ticketId: Number(req.params.id),
      senderId: req.user!.userId!,
      senderRole: "user",
      message: message.trim(),
    });

    res.status(201).json(msg);
  }),
);

export default router;
