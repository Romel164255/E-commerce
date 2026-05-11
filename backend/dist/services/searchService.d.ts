import type { ProductRow } from "../types.js";
export declare const saveSearchHistory: (userId: number, query: string) => Promise<void>;
export declare const getRecommendations: (userId: number) => Promise<ProductRow[]>;
