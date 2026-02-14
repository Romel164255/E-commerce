import { useCart } from "../context/CartContext";
import QuantitySelector from "../components/QuantitySelector";
import api from "../api/axios";

export default function Cart() {
  const {
    cart,
    totalItems,
    totalPrice,
    updateQuantity,
    removeItem,
  } = useCart();

  const checkout = async () => {
    try {
      await api.post("/orders/checkout");
      alert("Order placed!");
    } catch {
      alert("Checkout failed");
    }
  };

  return (
    <div className="cart-container">
      <h2 className="page-title">Cart</h2>

      {cart.length > 0 && (
        <div className="cart-total">
          <h3>
            Subtotal ({totalItems} items): ₹{totalPrice}
          </h3>

          <button className="primary-btn" onClick={checkout}>
            Proceed to Buy
          </button>
        </div>
      )}

      {cart.map((item) => (
        <div key={item.id} className="cart-item">
          <img
            src={`http://localhost:5000/uploads/${item.image_url}`}
            alt={item.title}
            className="cart-image"
          />

          <div className="cart-info">
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
              className="danger-btn"
              onClick={() => removeItem(item.id)}
            >
              Remove
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}