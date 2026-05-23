import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function OAuthHandler() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = params.get("token");
    const role = params.get("role") || "USER";

    if (token) {
      localStorage.setItem("token", token);
      localStorage.setItem("role", role);
      window.dispatchEvent(new Event("auth-changed"));
      navigate("/");
    }
  }, [navigate, params]);

  return <div>Signing you in...</div>;
}
