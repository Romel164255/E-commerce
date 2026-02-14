import { Routes, Route, Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useCart } from "./context/CartContext";

import Products from "./pages/Products";
import Cart from "./pages/Cart";
import Orders from "./pages/Orders";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Admin from "./pages/Admin";

import "./App.css";

function App() {
  const navigate = useNavigate();
  const { totalItems } = useCart();

  // Always read fresh auth state from localStorage
  const token = localStorage.getItem("token");
  const email = localStorage.getItem("email");
  const isLoggedIn = !!token;

  const [menuOpen, setMenuOpen] = useState(false);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("email");

    setMenuOpen(false);
    navigate("/");
    window.location.reload(); // refresh UI state
  };

  return (
    <div className="app-container">

      {/* ================= HEADER ================= */}
      <header className="top-header">
        <h1 className="logo">Outfito.</h1>

        {/* Account Dropdown */}
        <div
          className="account-dropdown"
          onMouseEnter={() => setMenuOpen(true)}
          onMouseLeave={() => setMenuOpen(false)}
        >
          <div className="account-trigger">
            👤 Account
          </div>

          {menuOpen && (
            <div className="dropdown-menu">
              {isLoggedIn ? (
                <>
                  <div className="dropdown-email">
                    {email}
                  </div>
                  <button className="dropdown-btn" onClick={logout}>
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="dropdown-link">
                    Login
                  </Link>
                  <Link to="/register" className="dropdown-link">
                    Register
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </header>

      {/* ================= NAVBAR ================= */}
      <nav className="navbar">
        <div className="nav-left">
          <Link className="nav-link" to="/">Products</Link>
          <Link className="nav-link" to="/orders">Orders</Link>
          <Link className="nav-link" to="/admin">Admin</Link>
        </div>

        <div className="nav-right">
          <Link to="/cart" className="cart-icon-wrapper">
            <img
              src="/shopping-cart.png"
              alt="Cart"
              className="cart-icon"
            />
            {totalItems > 0 && (
              <span className="cart-badge">{totalItems}</span>
            )}
          </Link>
        </div>
      </nav>

      {/* ================= ROUTES ================= */}
      <div className="page-content">
        <Routes>
          <Route path="/" element={<Products />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </div>

    </div>
  );
}

export default App;