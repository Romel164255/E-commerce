import { useContext } from "react";
import { CartContext } from "./CartStateContext";

export const useCart = () => useContext(CartContext);
