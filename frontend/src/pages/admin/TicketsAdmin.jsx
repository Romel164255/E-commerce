import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";

const STATUS_COLORS = {
  OPEN: "#f59e0b",
  IN_PROGRESS: "#3b82f6",
  RESOLVED: "#10b981",
  CLOSED: "#6b7280",
};

const STATUSES = ["", "OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];
const TYPES = ["", "RETURN", "REFUND", "COMPLAINT", "OTHER"];

export default function TicketsAdmin() {
  const [tickets, setTickets] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTickets();
  }, [statusFilter, typeFilter]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append("status", statusFilter);
      if (typeFilter) params.append("type", typeFilter);
      const res = await api.get(`/admin/tickets?${params.toString()}`);
      setTickets(res.data.data);
    } catch {
      /* handled by auth redirect elsewhere */
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-tickets-container">
      <h2 className="admin-section-title">Support Tickets</h2>

      {/* Filters */}
      <div className="admin-tickets-filters">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s || "All Statuses"}
            </option>
          ))}
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {t || "All Types"}
            </option>
          ))}
        </select>
      </div>

      {loading && <p>Loading tickets…</p>}

      {!loading && tickets.length === 0 && (
        <p className="empty-tickets">No tickets found.</p>
      )}

      {!loading && (
        <table className="admin-tickets-table">
          <thead>
            <tr>
              <th>#</th>
              <th>User</th>
              <th>Order</th>
              <th>Type</th>
              <th>Subject</th>
              <th>Status</th>
              <th>Messages</th>
              <th>Updated</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((t) => (
              <tr key={t.id}>
                <td>{t.id}</td>
                <td>{t.user_email}</td>
                <td>#{t.order_id}</td>
                <td>
                  <span className="ticket-type-small">{t.type}</span>
                </td>
                <td className="ticket-subject-cell">{t.subject}</td>
                <td>
                  <span
                    className="ticket-status-badge"
                    style={{
                      background: STATUS_COLORS[t.status] + "20",
                      color: STATUS_COLORS[t.status],
                    }}
                  >
                    {t.status.replace("_", " ")}
                  </span>
                </td>
                <td>{t.message_count}</td>
                <td>{new Date(t.updated_at).toLocaleDateString()}</td>
                <td>
                  <Link
                    to={`/admin/tickets/${t.id}`}
                    className="btn-sm-primary"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
