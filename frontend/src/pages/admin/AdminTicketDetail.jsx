import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../../api/axios";

const STATUS_COLORS = {
  OPEN: "#f59e0b",
  IN_PROGRESS: "#3b82f6",
  RESOLVED: "#10b981",
  CLOSED: "#6b7280",
};

const NEXT_STATUSES = {
  OPEN: ["IN_PROGRESS", "RESOLVED", "CLOSED"],
  IN_PROGRESS: ["RESOLVED", "CLOSED"],
  RESOLVED: ["CLOSED"],
  CLOSED: [],
};

export default function AdminTicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    fetchTicket();
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ticket]);

  const fetchTicket = async () => {
    try {
      const res = await api.get(`/admin/tickets/${id}`);
      setTicket(res.data);
    } catch {
      navigate("/admin/tickets");
    }
  };

  const sendReply = async () => {
    if (!reply.trim()) return;
    setError("");
    setSending(true);
    try {
      await api.post(`/admin/tickets/${id}/messages`, {
        message: reply.trim(),
      });
      setReply("");
      fetchTicket();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to send reply");
    } finally {
      setSending(false);
    }
  };

  const changeStatus = async (newStatus) => {
    setUpdatingStatus(true);
    try {
      await api.patch(`/admin/tickets/${id}/status`, { status: newStatus });
      fetchTicket();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (!ticket) return <p style={{ padding: "2rem" }}>Loading…</p>;

  const isClosed = ticket.status === "CLOSED";
  const nextStatuses = NEXT_STATUSES[ticket.status] || [];

  return (
    <div className="ticket-detail-container">
      <Link to="/admin/tickets" className="ticket-back-link">
        ← All Tickets
      </Link>

      {/* Header */}
      <div className="ticket-detail-header">
        <div>
          <h2 className="ticket-detail-title">
            #{ticket.id} — {ticket.subject}
          </h2>
          <small className="ticket-meta">
            {ticket.user_email} · Order #{ticket.order_id} (₹{ticket.order_total}) ·{" "}
            {ticket.type} · Created{" "}
            {new Date(ticket.created_at).toLocaleString()}
          </small>
        </div>

        <div className="admin-ticket-status-group">
          <span
            className="ticket-status-badge"
            style={{
              background: STATUS_COLORS[ticket.status] + "20",
              color: STATUS_COLORS[ticket.status],
              padding: "6px 14px",
              borderRadius: "999px",
              fontWeight: 600,
            }}
          >
            {ticket.status.replace("_", " ")}
          </span>

          {nextStatuses.map((s) => (
            <button
              key={s}
              type="button"
              className="btn-sm-outline"
              onClick={() => changeStatus(s)}
              disabled={updatingStatus}
            >
              → {s.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Message thread */}
      <div className="ticket-messages">
        {ticket.messages.map((msg) => (
          <div
            key={msg.id}
            className={`ticket-message ${msg.sender_role === "admin" ? "msg-admin" : "msg-user"}`}
          >
            <div className="msg-bubble">
              <p className="msg-text">{msg.message}</p>
              <small className="msg-time">
                {msg.sender_role === "admin" ? "Support (You)" : ticket.user_email}{" "}
                · {new Date(msg.created_at).toLocaleString()}
              </small>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Reply box */}
      {!isClosed ? (
        <div className="ticket-reply-box">
          {error && <p className="ticket-error">{error}</p>}
          <textarea
            rows={3}
            placeholder="Write a reply to the customer…"
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            className="ticket-reply-input"
          />
          <button
            type="button"
            className="btn-primary"
            onClick={sendReply}
            disabled={sending || !reply.trim()}
          >
            {sending ? "Sending…" : "Send Reply"}
          </button>
        </div>
      ) : (
        <p className="ticket-closed-notice">
          This ticket is closed. No further replies are allowed.
        </p>
      )}
    </div>
  );
}
