import { useEffect, useState } from "react";
import api from "../../api/axios";

export default function OrdersAdmin() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const fetchOrders = async () => {
      const { data } = await api.get("/admin/orders");
      setOrders(data);
    };
    fetchOrders();
  }, []);

  return (
    <div>
      <h2>Orders</h2>

      {orders.map(order => (
        <div key={order.order_id} className="order-card">
          <h4>Order #{order.order_id}</h4>
          <p>Email: {order.email}</p>
          <p>Total: ₹{order.total}</p>
          <p>Status: {order.status}</p>
          <p>Payment: {order.payment_status}</p>

          <ul>
            {order.items.map((item, i) => (
              <li key={i}>
                {item.product} × {item.quantity} (₹{item.price})
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}