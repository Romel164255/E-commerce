import { useEffect, useState } from "react";
import api from "../../api/axios";

export default function Dashboard() {
  const [stats, setStats] = useState({});
  const [monthly, setMonthly] = useState([]);
  const [weekly, setWeekly] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const [s, m, w] = await Promise.all([
          api.get("/admin/stats"),
          api.get("/admin/stats/monthly"),
          api.get("/admin/stats/weekly"),
        ]);

        if (!isMounted) return;

        setStats(s.data);
        setMonthly(m.data);
        setWeekly(w.data);
      } catch {
        if (isMounted) {
          setError("Failed to load dashboard data");
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div>
      <h2>Dashboard</h2>
      {error && <p className="error-text">{error}</p>}

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
