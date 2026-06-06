import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";

const STATUS_COLORS = {
  OPEN: "#f59e0b",
  IN_PROGRESS: "#3b82f6",
  RESOLVED: "#10b981",
  CLOSED: "#6b7280",
};

const TYPE_LABELS = {
  RETURN: "Return",
  REFUND: "Refund",
  COMPLAINT: "Complaint",
  OTHER: "Other",
};

export default function Tickets() {
  const [tickets, setTickets] = useState([]);
  const [orders, setOrders] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    orderId: "",
    type: "COMPLAINT",
    subject: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchTickets();
    fetchOrders();
  }, []);

  const fetchTickets = async () => {
    try {
      const res = await api.get("/tickets");
      setTickets(res.data.data);
    } catch {
      navigate("/auth");
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await api.get("/orders");
      // Only allow tickets on placed (non-pending) orders
      const eligible = res.data.data.filter((o) => o.status !== "PENDING");
      setOrders(eligible);
    } catch {
      /* silently ignore */
    }
  };

  const handleSubmit = async () => {
    setError("");
    if (!form.orderId || !form.subject.trim() || !form.message.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/tickets", {
        orderId: Number(form.orderId),
        type: form.type,
        subject: form.subject.trim(),
        message: form.message.trim(),
      });
      setForm({ orderId: "", type: "COMPLAINT", subject: "", message: "" });
      setShowForm(false);
      fetchTickets();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create ticket");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="tickets-container">
      <div className="tickets-header">
        <h2 className="tickets-title">My Support Tickets</h2>
        <button
          type="button"
          className="btn-primary"
          onClick={() => setShowForm((v) => !v)}
        >
          {showForm ? "Cancel" : "+ New Ticket"}
        </button>
      </div>

      {/* New Ticket Form */}
      {showForm && (
        <div className="ticket-form-card">
          <h3>Raise a Request</h3>

          {error && <p className="ticket-error">{error}</p>}

          <div className="form-group">
            <label>Order</label>
            <select
              value={form.orderId}
              onChange={(e) => setForm({ ...form, orderId: e.target.value })}
            >
              <option value="">Select order…</option>
              {orders.map((o) => (
                <option key={o.id} value={o.id}>
                  Order #{o.id} — ₹{o.total} ({o.status})
                </option>
              ))}
            </select>
            {orders.length === 0 && (
              <small className="form-hint">
                You have no eligible orders. Only paid/shipped/delivered orders
                can be raised.
              </small>
            )}
          </div>

          <div className="form-group">
            <label>Request Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              <option value="RETURN">Return</option>
              <option value="REFUND">Refund</option>
              <option value="COMPLAINT">Complaint</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label>Subject</label>
            <input
              type="text"
              placeholder="Brief description…"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Details</label>
            <textarea
              rows={4}
              placeholder="Describe your issue in detail…"
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
            />
          </div>

          <button
            type="button"
            className="btn-primary"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? "Submitting…" : "Submit Ticket"}
          </button>
        </div>
      )}

      {/* Tickets List */}
      {tickets.length === 0 && !showForm && (
        <p className="empty-tickets">No support tickets yet.</p>
      )}

      {tickets.map((ticket) => (
        <Link
          key={ticket.id}
          to={`/tickets/${ticket.id}`}
          className="ticket-card"
          style={{ textDecoration: "none" }}
        >
          <div className="ticket-card-header">
            <span className="ticket-id">#{ticket.id}</span>
            <span
              className="ticket-type-badge"
              style={{ background: "#e0f2fe", color: "#0369a1" }}
            >
              {TYPE_LABELS[ticket.type]}
            </span>
            <span
              className="ticket-status-badge"
              style={{
                background: STATUS_COLORS[ticket.status] + "20",
                color: STATUS_COLORS[ticket.status],
              }}
            >
              {ticket.status.replace("_", " ")}
            </span>
          </div>
          <p className="ticket-subject">{ticket.subject}</p>
          <small className="ticket-meta">
            Order #{ticket.order_id} ·{" "}
            {new Date(ticket.created_at).toLocaleDateString()}
          </small>
        </Link>
      ))}
    </div>
  );
}
