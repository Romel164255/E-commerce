import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);

  /* ===============================
     FETCH CART FROM BACKEND
  =============================== */

  const fetchCart = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/cart");
      setCart(data);
    } catch (err) {
      console.error("Failed to load cart");
      setCart([]);
    } finally {
      setLoading(false);
    }
  };

  /* ===============================
     ADD TO CART (BACKEND)
  =============================== */

  const addToCart = async (product) => {
    try {
      await api.post("/cart", {
        productId: product.id,
        quantity: 1
      });

      await fetchCart(); // reload from DB
    } catch (err) {
      alert(err.response?.data?.error || "Failed to add to cart");
    }
  };

  /* ===============================
     UPDATE QUANTITY
  =============================== */

  const updateQuantity = async (cartItemId, newQty) => {
    if (newQty <= 0) {
      await removeItem(cartItemId);
      return;
    }

    try {
      await api.post("/cart", {
        productId: cart.find(i => i.id === cartItemId)?.product_id,
        quantity: newQty - cart.find(i => i.id === cartItemId)?.quantity
      });

      await fetchCart();
    } catch (err) {
      alert("Failed to update quantity");
    }
  };

  /* ===============================
     REMOVE ITEM
  =============================== */

  const removeItem = async (cartItemId) => {
    try {
      await api.delete(`/cart/${cartItemId}`);
      await fetchCart();
    } catch (err) {
      alert("Failed to remove item");
    }
  };

  /* ===============================
     TOTALS
  =============================== */

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce(
    (sum, item) => sum + item.quantity * item.price,
    0
  );

  /* ===============================
     LOAD CART ON LOGIN
  =============================== */

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetchCart();
    }
  }, []);

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        addToCart,
        updateQuantity,
        removeItem,
        totalItems,
        totalPrice,
        fetchCart
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);