import { useEffect, useState } from "react";
import api from "../../api/axios";

export default function Dashboard() {
  const [stats, setStats] = useState({});
  const [monthly, setMonthly] = useState([]);
  const [weekly, setWeekly] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const s = await api.get("/admin/stats");
      const m = await api.get("/admin/stats/monthly");
      const w = await api.get("/admin/stats/weekly");

      setStats(s.data);
      setMonthly(m.data);
      setWeekly(w.data);
    };

    fetchData();
  }, []);

  return (
    <div>
      <h2>Dashboard</h2>

      <div className="card-grid">
        <div className="card">
          <h4>Total Revenue</h4>
          <p>₹{stats.revenue}</p>
        </div>
        <div className="card">
          <h4>Total Orders</h4>
          <p>{stats.orders}</p>
        </div>
        <div className="card">
          <h4>Total Users</h4>
          <p>{stats.users}</p>
        </div>
      </div>

      <h3>Monthly Revenue</h3>
      <ul>
        {monthly.map((m, i) => (
          <li key={i}>
            {new Date(m.month).toLocaleDateString()} → ₹{m.revenue}
          </li>
        ))}
      </ul>

      <h3>Weekly Revenue</h3>
      <ul>
        {weekly.map((w, i) => (
          <li key={i}>
            {new Date(w.week).toLocaleDateString()} → ₹{w.revenue}
          </li>
        ))}
      </ul>
    </div>
  );
}