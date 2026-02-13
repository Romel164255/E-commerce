import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();  // ✅

  const login = async () => {
    try {
     const res = await api.post("/auth/login", { email, password });

     localStorage.setItem("token", res.data.token);
     localStorage.setItem("role", res.data.role);
     localStorage.setItem("email", email);

     if (res.data.role === "admin") {
         navigate("/admin");
  } else {
         navigate("/");
  }
    } catch {
      alert("Invalid credentials");
    }
  };

  return (
    <div className="login-container">
      <h2>Login</h2>
      <input placeholder="Email" onChange={e => setEmail(e.target.value)} />
      <input type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} />
      <button onClick={login}>Login</button>
    </div>
  );
}