import type { GetProductsParams, GetProductsResult, CreateProductParams, ProductRow } from "../types.js";
export declare const getProducts: ({ page, limit, sort, category, gender, }: GetProductsParams) => Promise<GetProductsResult>;
export declare const createProduct: ({ title, description, price, stock, image_url, }: CreateProductParams) => Promise<ProductRow>;
