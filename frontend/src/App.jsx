import { Routes, Route, Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

import Products from "./pages/Products";
import Cart from "./pages/Cart";
import Orders from "./pages/Orders";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Admin from "./pages/Admin";

import "./App.css";

function App() {
  const navigate = useNavigate();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const email = localStorage.getItem("email");

    setIsLoggedIn(!!token);
    setUserEmail(email || "");
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("email");

    setIsLoggedIn(false);
    setUserEmail("");

    navigate("/");
  };

  return (
    <div className="app-container">

      {/* ================= HEADER BAR ================= */}
      <header className="top-header">
        <h1 className="logo">MyStore</h1>

        <div className="user-section">
          {isLoggedIn ? (
            <>
              <span className="user-email">
                👤 {userEmail}
              </span>
              <button className="logout-btn" onClick={logout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link className="auth-link" to="/login">
                Login
              </Link>
              <Link className="auth-link" to="/register">
                Register
              </Link>
            </>
          )}
        </div>
      </header>

      {/* ================= NAVBAR ================= */}
      <nav className="navbar">
        <Link className="nav-link" to="/">Products</Link>
        <Link className="nav-link" to="/cart">Cart</Link>
        <Link className="nav-link" to="/orders">Orders</Link>
        <Link className="nav-link" to="/admin">Admin</Link>
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