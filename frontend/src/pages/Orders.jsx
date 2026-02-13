import { useEffect, useState } from "react";
import api from "../api/axios";

export default function Orders() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    api.get("/orders").then(res => {
      setOrders(res.data.data);
    });
  }, []);

  return (
    <div>
      <h2>My Orders</h2>
      {orders.map(order => (
        <div key={order.id}>
          {order.total} - {order.status}
        </div>
      ))}
    </div>
  );
}