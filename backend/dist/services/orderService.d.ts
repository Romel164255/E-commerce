import type { OrderRow, CreateOrderResult, PayOrderResult } from "../types.js";
declare const validTransitions: Record<string, string[]>;
export { validTransitions };
export declare const createOrder: (userId: number, addressId: number) => Promise<CreateOrderResult>;
export declare const payOrder: (userId: number, orderId: string) => Promise<PayOrderResult>;
export declare const getUserOrders: (userId: number) => Promise<OrderRow[]>;
