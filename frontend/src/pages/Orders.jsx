import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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

      {orders.length === 0 && (
        <p className="empty-orders">No orders yet</p>
      )}

      {orders.map((order) => (
        <div key={order.id} className="order-card">

          <div className="order-header">
            <span className="order-id">
              Order #{order.id}
            </span>

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
        </div>
      ))}
    </div>
  );
}