import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async () => {
    try {
      if (isLogin) {
        // LOGIN
        const res = await api.post("/auth/login", { email, password });

        localStorage.setItem("token", res.data.token);
        localStorage.setItem("role", res.data.role);
        localStorage.setItem("email", email);

        if (res.data.role === "admin") {
          navigate("/admin");
        } else {
          navigate("/");
        }

      } else {
        // REGISTER
        await api.post("/auth/register", { email, password });
        alert("Registration successful. Please login.");
        setIsLogin(true); // Switch back to login
      }
    } catch {
      alert(isLogin ? "Invalid credentials" : "Registration failed");
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h2>{isLogin ? "Login" : "Create Account"}</h2>

        <input
          type="email"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button onClick={handleSubmit}>
          {isLogin ? "Login" : "Register"}
        </button>

        <p className="switch-text">
          {isLogin ? "Don't have an account?" : "Already have an account?"}
          <span onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? " Register here" : " Login here"}
          </span>
        </p>
      </div>
    </div>
  );
}