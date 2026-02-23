import { useEffect, useState } from "react";
import api from "../../api/axios";

export default function OrdersAdmin() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data } = await api.get("/admin/orders");
        setOrders(data);
      } catch (err) {
        console.error("Failed to fetch orders", err);
      }
    };
    fetchOrders();
  }, []);

  return (
    <div>
      <h2>Orders</h2>

      {orders.map(order => (
        <div key={order.order_id} className="order-card">
          <h4>Order #{order.order_id}</h4>

          <p><strong>Email:</strong> {order.email}</p>
          <p><strong>Total:</strong> ₹{order.total}</p>
          <p><strong>Status:</strong> {order.status}</p>
          <p><strong>Payment Status:</strong> {order.payment_status}</p>
          <p><strong>Payment ID:</strong> {order.razorpay_payment_id}</p>

          <hr />

          <h5>Shipping Details</h5>
          <p><strong>Name:</strong> {order.full_name}</p>
          <p><strong>Phone:</strong> {order.phone}</p>
          <p>
            <strong>Address:</strong> {order.address_line}, {order.city}, {order.state} - {order.pincode}
          </p>

          <hr />

          <h5>Items</h5>
          <ul>
            {order.items?.map((item, i) => (
              <li key={i}>
                {item.product} × {item.quantity} (₹{item.price})
              </li>
            ))}
          </ul>

          <hr />

          <p><strong>Created:</strong> {new Date(order.created_at).toLocaleString()}</p>
          <p><strong>Updated:</strong> {new Date(order.updated_at).toLocaleString()}</p>

        </div>
      ))}
    </div>
  );
}