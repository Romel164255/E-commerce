import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/axios";

export default function CheckoutPayment() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const orderId = params.get("orderId");

  const handlePayment = async () => {
    try {
      await api.post(`/orders/${orderId}/pay`);
      navigate("/orders");
    } catch (err) {
      alert(err.response?.data?.error || "Payment failed");
    }
  };

  if (!orderId) {
    return <p>Invalid Order</p>;
  }

  return (
    <div>
      <h2>Payment</h2>

      <p>Order ID: {orderId}</p>

      <button
        type="button"
        onClick={handlePayment}
      >
        Pay Now
      </button>
    </div>
  );
}