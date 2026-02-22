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
      <h2>All Orders</h2>

      <table className="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Total</th>
            <th>Status</th>
            <th>Created</th>
          </tr>
        </thead>

        <tbody>
          {orders.map(order => (
            <tr key={order.id}>
              <td>{order.id}</td>
              <td>₹{order.total}</td>
              <td>{order.status}</td>
              <td>{new Date(order.created_at).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}