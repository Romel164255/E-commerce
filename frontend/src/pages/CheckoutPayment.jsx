import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/axios";

const RAZORPAY_SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const existingScript = document.querySelector(
      `script[src="${RAZORPAY_SCRIPT_URL}"]`
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(true), {
        once: true,
      });
      existingScript.addEventListener("error", () => resolve(false), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.src = RAZORPAY_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

export default function CheckoutPayment() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const orderId = params.get("orderId");

  useEffect(() => {
    if (!orderId) return;

    const startPayment = async () => {
      try {
        const loaded = await loadRazorpayScript();

        if (!loaded || !window.Razorpay) {
          alert("Payment SDK failed to load");
          return;
        }

        const { data } = await api.post(`/orders/${orderId}/pay`);

        const options = {
          key: data.key,
          amount: data.amount,
          currency: "INR",
          order_id: data.razorpayOrderId,
          name: "Romel Store",
          description: "Order Payment",

          handler: async function (response) {
            await api.post("/api/payment/verify", response);

            alert("Payment Successful");
            navigate("/orders");
          },

          prefill: {
            name: "",
            email: "",
            contact: ""
          },

          theme: {
            color: "#000000"
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();

      } catch (err) {
        alert(err.response?.data?.error || "Payment failed");
      }
    };

    startPayment();

  }, [orderId, navigate]);

  if (!orderId) {
    return <p>Invalid Order</p>;
  }

  return <h2>Redirecting to Payment...</h2>;
}
