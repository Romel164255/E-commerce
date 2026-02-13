import { useEffect, useState } from "react";
import api from "../api/axios";

export default function Cart() {
  const [cart, setCart] = useState([]);

  useEffect(() => {
    api.get("/cart")
      .then(res => {
        setCart(res.data.data || res.data);
      })
      .catch(err => console.error(err));
  }, []);

  const checkout = async () => {
    try {
      await api.post("/orders/checkout");
      alert("Order placed!");
    } catch {
      alert("Checkout failed");
    }
  };
  
  const removeItem = async (id) => {
  try {
    await api.delete(`/cart/${id}`);
    setCart(cart.filter(item => item.id !== id));
  } catch (err) {
    console.error(err);
  }
  };

  const total = cart.reduce(
  (sum, item) => sum + item.price * item.quantity,
  0
  );

  return (
    <div className="cart-container">
      <h2 className="page-title">Cart</h2>

      {cart.map(item => (
  <div key={item.id} className="cart-item">

    <img
      src={`http://localhost:5000/uploads/${item.image_url}`}
      alt={item.title}
      className="cart-image"
    />

    <div className="cart-info">
      <h4>{item.title}</h4>
      <p>₹{item.price}</p>
      <p>Qty: {item.quantity}</p>
      <button
      className="danger-btn"
      onClick={() => removeItem(item.id)}
      >
      Remove
      </button>
    </div>

    </div>
    ))}

      {cart.length > 0 && (
        <div className="cart-total">
          <h3>Total: ₹{total}</h3>
          <button className="primary-btn" onClick={checkout}>
          Checkout
          </button>
        </div>
        
        
      )}
    </div>
  );
}