import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import { CartContext } from "./CartStateContext";

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);

  /* ===============================
     FETCH CART FROM BACKEND
  =============================== */

  const fetchCart = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/cart");
      setCart(data);
    } catch {
      console.error("Failed to load cart");
      setCart([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /* ===============================
     ADD TO CART (BACKEND)
  =============================== */

  const addToCart = useCallback(async (product) => {
    try {
      await api.post("/cart", {
        productId: Number(product.id),
        quantity: 1,
      });

      await fetchCart();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to add to cart");
    }
  }, [fetchCart]);

  /* ===============================
     REMOVE ITEM
  =============================== */

  const removeItem = useCallback(async (cartItemId) => {
    try {
      await api.delete(`/cart/${cartItemId}`);
      await fetchCart();
    } catch {
      alert("Failed to remove item");
    }
  }, [fetchCart]);

  /* ===============================
     UPDATE QUANTITY
  =============================== */

  const updateQuantity = useCallback(async (cartItemId, newQty) => {
    const cartItem = cart.find((item) => item.id === cartItemId);

    if (!cartItem) {
      alert("Cart item not found");
      return;
    }

    if (newQty <= 0) {
      await removeItem(cartItemId);
      return;
    }

    try {
      await api.post("/cart", {
        productId: cartItem.product_id,
        quantity: newQty - cartItem.quantity,
      });

      await fetchCart();
    } catch {
      alert("Failed to update quantity");
    }
  }, [cart, fetchCart, removeItem]);

  /* ===============================
     TOTALS
  =============================== */

  const totalItems = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );
  const totalPrice = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity * item.price, 0),
    [cart]
  );

  /* ===============================
     LOAD CART ON LOGIN
  =============================== */

  useEffect(() => {
    const syncCartOnAuthChange = () => {
      const token = localStorage.getItem("token");

      if (token) {
        void fetchCart();
      } else {
        setCart([]);
      }
    };

    syncCartOnAuthChange();

    window.addEventListener("storage", syncCartOnAuthChange);
    window.addEventListener("auth-changed", syncCartOnAuthChange);

    return () => {
      window.removeEventListener("storage", syncCartOnAuthChange);
      window.removeEventListener("auth-changed", syncCartOnAuthChange);
    };
  }, [fetchCart]);

  const value = useMemo(
    () => ({
      cart,
      loading,
      addToCart,
      updateQuantity,
      removeItem,
      totalItems,
      totalPrice,
      fetchCart,
    }),
    [
      cart,
      loading,
      addToCart,
      updateQuantity,
      removeItem,
      totalItems,
      totalPrice,
      fetchCart,
    ]
  );

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
