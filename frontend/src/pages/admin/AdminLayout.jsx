import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useEffect } from "react";

export default function AdminLayout() {
  const navigate = useNavigate();

 useEffect(() => {
  const role = localStorage.getItem("role");

  if (!role) {
    navigate("/auth");
    return;
  }

  if (role.toUpperCase() !== "ADMIN") {
    navigate("/");
  }
}, [navigate]);

  return (
    <div className="admin-container">

      <aside className="admin-sidebar">
        <h2 className="logo">Admin Panel</h2>

        <nav>
          <NavLink to="dashboard">Dashboard</NavLink>
          <NavLink to="products">Products</NavLink>
          <NavLink to="users">Users</NavLink>
          <NavLink to="orders">Orders</NavLink>
        </nav>
      </aside>

      <main className="admin-main">
        <Outlet />
      </main>

    </div>
  );
}