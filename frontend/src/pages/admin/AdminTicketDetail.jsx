import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../../api/axios";

const STATUS_COLORS = {
  OPEN: "#f59e0b",
  IN_PROGRESS: "#3b82f6",
  RESOLVED: "#10b981",
  CLOSED: "#6b7280",
};

// Which resolve actions are valid per ticket type
const RESOLVE_ACTIONS = {
  RETURN:    [{ action: "RETURN_INITIATED", label: "✅ Approve Return",  color: "#10b981" },
              { action: "REJECTED",         label: "❌ Reject Request",  color: "#ef4444" }],
  REFUND:    [{ action: "REFUND_ISSUED",    label: "✅ Issue Refund",    color: "#10b981" },
              { action: "REJECTED",         label: "❌ Reject Request",  color: "#ef4444" }],
  COMPLAINT: [{ action: "REJECTED",         label: "✅ Mark Resolved",   color: "#10b981" }],
  OTHER:     [{ action: "REJECTED",         label: "✅ Mark Resolved",   color: "#10b981" }],
};

export default function AdminTicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [resolving, setResolving] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // { action, label }
  const [adminNote, setAdminNote] = useState("");
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
      await api.post(`/admin/tickets/${id}/messages`, { message: reply.trim() });
      setReply("");
      fetchTicket();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to send reply");
    } finally {
      setSending(false);
    }
  };

  const handleResolve = async () => {
    if (!confirmAction) return;
    setError("");
    setResolving(true);
    try {
      await api.post(`/admin/tickets/${id}/resolve`, {
        action: confirmAction.action,
        adminNote: adminNote.trim() || undefined,
      });
      setConfirmAction(null);
      setAdminNote("");
      fetchTicket();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to resolve ticket");
    } finally {
      setResolving(false);
    }
  };

  if (!ticket) return <p style={{ padding: "2rem" }}>Loading…</p>;

  const isResolved = ticket.status === "RESOLVED" || ticket.status === "CLOSED";
  const actions = RESOLVE_ACTIONS[ticket.type] || [];

  return (
    <div className="ticket-detail-container">
      <Link to="/admin/tickets" className="ticket-back-link">← All Tickets</Link>

      {/* Header */}
      <div className="ticket-detail-header">
        <div>
          <h2 className="ticket-detail-title">#{ticket.id} — {ticket.subject}</h2>
          <small className="ticket-meta">
            {ticket.user_email} · Order #{ticket.order_id} (₹{ticket.order_total}) ·{" "}
            {ticket.type} · Order status: <strong>{ticket.order_status}</strong> ·{" "}
            Created {new Date(ticket.created_at).toLocaleString()}
          </small>
        </div>

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
      </div>

      {/* Resolution info if already resolved */}
      {isResolved && ticket.resolution_action && (
        <div className="resolution-banner">
          <strong>Resolution:</strong> {ticket.resolution_action.replace("_", " ")}
          {ticket.resolved_at && (
            <> · {new Date(ticket.resolved_at).toLocaleString()}</>
          )}
        </div>
      )}

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
                {msg.sender_role === "admin" ? "Support (You)" : ticket.user_email}
                {" · "}{new Date(msg.created_at).toLocaleString()}
              </small>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {error && <p className="ticket-error">{error}</p>}

      {!isResolved && (
        <>
          {/* Reply box */}
          <div className="ticket-reply-box" style={{ marginBottom: "1.5rem" }}>
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

          {/* Action buttons */}
          <div className="resolve-actions-section">
            <p className="resolve-actions-label">Take Action</p>
            <div className="resolve-actions-row">
              {actions.map(({ action, label, color }) => (
                <button
                  key={action}
                  type="button"
                  className="resolve-action-btn"
                  style={{ borderColor: color, color }}
                  onClick={() => setConfirmAction({ action, label })}
                  disabled={resolving}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Confirm dialog */}
          {confirmAction && (
            <div className="resolve-confirm-box">
              <p className="resolve-confirm-title">
                Confirm: <strong>{confirmAction.label}</strong>
              </p>

              {confirmAction.action === "REFUND_ISSUED" && (
                <p className="resolve-confirm-warning">
                  ⚠️ This will call the Razorpay refund API immediately and refund{" "}
                  <strong>₹{ticket.order_total}</strong> to the customer. This cannot be undone.
                </p>
              )}
              {confirmAction.action === "RETURN_INITIATED" && (
                <p className="resolve-confirm-warning">
                  ⚠️ This will mark the order as <strong>RETURN_REQUESTED</strong> in the system.
                  Arrange pickup separately.
                </p>
              )}

              <div className="form-group" style={{ marginTop: "0.8rem" }}>
                <label>Optional note to customer</label>
                <textarea
                  rows={2}
                  placeholder="Leave blank to send default message…"
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  className="ticket-reply-input"
                />
              </div>

              <div style={{ display: "flex", gap: "0.8rem", marginTop: "0.8rem" }}>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleResolve}
                  disabled={resolving}
                >
                  {resolving ? "Processing…" : "Confirm"}
                </button>
                <button
                  type="button"
                  className="btn-sm-outline"
                  onClick={() => { setConfirmAction(null); setAdminNote(""); }}
                  disabled={resolving}
                  style={{ padding: "0.55rem 1.2rem" }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {isResolved && (
        <p className="ticket-closed-notice">
          This ticket has been {ticket.status.toLowerCase()}. No further actions available.
        </p>
      )}
    </div>
  );
}
