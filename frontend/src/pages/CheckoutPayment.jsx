import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/axios";

export default function CheckoutPayment() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const orderId = params.get("orderId");

  useEffect(() => {
    if (!orderId) return;

    const startPayment = async () => {
      try {
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