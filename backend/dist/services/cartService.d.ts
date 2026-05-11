import type { CartItemRow, CartItemWithProduct } from "../types.js";
export declare const addToCart: (userId: number, productId: number, quantity: number) => Promise<CartItemRow>;
export declare const getCartItems: (userId: number) => Promise<CartItemWithProduct[]>;
export declare const removeCartItem: (userId: number, cartItemId: string) => Promise<{
    message: string;
}>;
