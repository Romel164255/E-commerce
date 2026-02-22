import { Outlet, Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";

export default function AdminLayout() {
  const navigate = useNavigate();

  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role !== "admin") {
      navigate("/");
    }
  }, [navigate]);

  return (
    <div className="admin-layout">

      {/* Sidebar */}
      <aside className="admin-sidebar">
        <h2 className="admin-title">Admin</h2>

        <nav className="admin-nav">
          <Link to="dashboard">Dashboard</Link>
          <Link to="products">Products</Link>
          <Link to="users">Users</Link>
          <Link to="orders">Orders</Link>
          <Link to="analytics">Analytics</Link>
        </nav>
      </aside>

      {/* Content */}
      <div className="admin-content">
        <Outlet />
      </div>

    </div>
  );
}