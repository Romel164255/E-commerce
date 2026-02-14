import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios";

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

  // Load cart from backend
  const fetchCart = async () => {
    try {
      const res = await api.get("/cart");
      setCart(res.data);
    } catch {
      setCart([]);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  // Add item
  const addToCart = async (productId) => {
    await api.post("/cart", { productId, quantity: 1 });
    fetchCart();
  };

  // Update quantity
  const updateQuantity = async (cartItemId, quantity) => {
    if (quantity <= 0) return;
    await api.patch(`/cart/${cartItemId}`, { quantity });
    fetchCart();
  };

  // Remove
  const removeItem = async (cartItemId) => {
    await api.delete(`/cart/${cartItemId}`);
    fetchCart();
  };

  const totalItems = cart.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const totalPrice = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        cart,
        totalItems,
        totalPrice,
        addToCart,
        updateQuantity,
        removeItem
      }}
    >
      {children}
    </CartContext.Provider>
  );
};