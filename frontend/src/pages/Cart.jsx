import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";
import QuantitySelector from "../components/QuantitySelector";

export default function Cart() {
  const {
    cart,
    totalItems,
    totalPrice,
    updateQuantity,
    removeItem,
  } = useCart();

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const handleProceed = (e) => {
    e.preventDefault();   // prevent form submit
    e.stopPropagation();  // extra safety

    if (!token) {
      navigate("/auth");
      return;
    }

    navigate("/checkout/address");
  };

  return (
    <div className="cart-container">
      <h2>Cart</h2>

      {cart.length > 0 && (
        <div>
          <h3>
            Subtotal ({totalItems} items): ₹{totalPrice}
          </h3>

          <button
            type="button"
            onClick={handleProceed}
          >
            Proceed to Buy
          </button>
        </div>
      )}

      {cart.map((item) => (
        <div key={item.id}>
          <h4>{item.title}</h4>
          <p>₹{item.price}</p>

          <QuantitySelector
            quantity={item.quantity}
            onDecrease={() =>
              updateQuantity(item.id, item.quantity - 1)
            }
            onIncrease={() =>
              updateQuantity(item.id, item.quantity + 1)
            }
          />

          <button
            type="button"
            onClick={() => removeItem(item.id)}
          >
            Remove
          </button>
        </div>
      ))}
    </div>
  );
}