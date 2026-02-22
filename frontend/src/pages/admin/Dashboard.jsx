import { useEffect, useState } from "react";
import api from "../../api/axios";

export default function Dashboard() {
  const [stats, setStats] = useState({
    revenue: 0,
    orders: 0,
    users: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get("/admin/stats");
        setStats(data);
      } catch (err) {
        console.error("Failed to fetch stats");
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="admin-dashboard">

      <div className="stat-card">
        <h3>Total Revenue</h3>
        <p>₹{stats.revenue}</p>
      </div>

      <div className="stat-card">
        <h3>Total Orders</h3>
        <p>{stats.orders}</p>
      </div>

      <div className="stat-card">
        <h3>Total Users</h3>
        <p>{stats.users}</p>
      </div>

    </div>
  );
}