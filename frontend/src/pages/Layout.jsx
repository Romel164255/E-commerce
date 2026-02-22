import { Outlet, Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useState } from "react";

export default function Layout() {
  const { totalItems } = useCart();
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const email = localStorage.getItem("email");

  const [menuOpen, setMenuOpen] = useState(false);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("email");
    navigate("/");
    window.location.reload();
  };

  return (
    <div className="layout">

      {/* ================= HEADER ================= */}
      <header className="header">
        <Link to="/" className="logo">
          Outfito.
        </Link>

        <div className="header-right">

          {/* 🛒 Cart */}
          <Link to="/cart" className="cart-link">
            Cart ({totalItems})
          </Link>

          {/* 👑 Admin Link (Visible Only To Admin) */}
          {token && role === "admin" && (
            <Link to="/admin" className="admin-link">
              Admin
            </Link>
          )}

          {/* 👤 Account Dropdown */}
          <div
            className="account"
            onMouseEnter={() => setMenuOpen(true)}
            onMouseLeave={() => setMenuOpen(false)}
          >
            👤 Account

            {menuOpen && (
              <div className="dropdown">
                {token ? (
                  <>
                    <div className="email">{email}</div>
                    <button onClick={logout}>Logout</button>
                  </>
                ) : (
                  <>
                    <Link to="/login">Login</Link>
                    <Link to="/register">Register</Link>
                  </>
                )}
              </div>
            )}
          </div>

        </div>
      </header>

      {/* ================= MAIN CONTENT ================= */}
      <main className="main-content">
        <Outlet />
      </main>

      {/* ================= FOOTER ================= */}
      <footer className="footer">
        <p>© {new Date().getFullYear()} Outfito. All rights reserved.</p>
      </footer>

    </div>
  );
}