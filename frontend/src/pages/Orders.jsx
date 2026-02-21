import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/orders")
      .then(res => setOrders(res.data.data))
      .catch(() => navigate("/login"));
  }, []);

  const continuePayment = (orderId) => {
    navigate(`/checkout/payment?orderId=${orderId}`);
  };

  return (
    <div className="orders-container">
      <h2>My Orders</h2>

      {orders.length === 0 && <p>No orders yet</p>}

      {orders.map(order => (
        <div key={order.id} className="order-card">
          <p><strong>Order ID:</strong> {order.id}</p>
          <p><strong>Total:</strong> ₹{order.total}</p>
          <p><strong>Status:</strong> {order.status}</p>

          {order.status === "PENDING" && (
            <button
              type="button"
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