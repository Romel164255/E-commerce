import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await api.get("/orders");
        setOrders(res.data.data);
      } catch {
        navigate("/auth");
      }
    };

    fetchOrders();
  }, [navigate]);

  const continuePayment = (orderId) => {
    navigate(`/checkout/payment?orderId=${orderId}`);
  };

  return (
    <div className="orders-container">
      <h2 className="orders-title">My Orders</h2>

      {orders.length === 0 && <p className="empty-orders">No orders yet</p>}

      {orders.map((order) => (
        <div key={order.id} className="order-card">
          <div className="order-header">
            <span className="order-id">Order #{order.id}</span>

            <span className={`order-status status-${order.status}`}>
              {order.status}
            </span>
          </div>

          <div className="order-body">
            <p>
              <span className="label">Total:</span> ₹{order.total}
            </p>
          </div>

          {order.status === "PENDING" && (
            <button
              type="button"
              className="continue-btn"
              onClick={() => continuePayment(order.id)}
            >
              Continue Payment
            </button>
          )}

          {["PAID", "SHIPPED", "DELIVERED"].includes(order.status) && (
            <Link
              to={`/tickets?orderId=${order.id}`}
              className="raise-ticket-btn"
              style={{
                display: "inline-block",
                marginTop: "0.5rem",
                fontSize: "0.78rem",
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "#6b7280",
                textDecoration: "none",
                border: "1px solid #e0d9cf",
                borderRadius: "3px",
                padding: "5px 12px",
                transition: "border-color 0.2s",
              }}
            >
              Raise Return / Refund
            </Link>
          )}
        </div>
      ))}
    </div>
  );
}
