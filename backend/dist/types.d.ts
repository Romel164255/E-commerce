export interface JwtPayload {
    userId: number;
    role: string;
}
export interface UserRow {
    id: number;
    email: string;
    role: string;
    password_hash?: string;
    created_at?: Date;
}
export interface ProductRow {
    id: number;
    title: string;
    description?: string;
    price: number;
    stock: number;
    image_url?: string;
    category?: string;
    gender?: string;
    product_code?: string;
    created_at?: Date;
    updated_at?: Date;
}
export interface CartItemRow {
    id: number;
    user_id: number;
    product_id: number;
    quantity: number;
}
export interface AddressRow {
    id: number;
    user_id: number;
    full_name: string;
    phone: string;
    address_line: string;
    city: string;
    state: string;
    pincode: string;
    lat?: number;
    lng?: number;
}
export interface OrderRow {
    id: number;
    user_id: number;
    total: number;
    status: "PENDING" | "PAID" | "SHIPPED" | "DELIVERED" | "CANCELLED";
    payment_status?: string;
    address_id: number;
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
    created_at?: Date;
    updated_at?: Date;
}
export interface OrderItemRow {
    id: number;
    order_id: number;
    product_id: number;
    quantity: number;
    price: number;
}
export interface AuthResult {
    token: string;
    role: string;
}
export interface GetProductsParams {
    page?: number;
    limit?: number;
    sort?: string;
    category?: string;
    gender?: string;
}
export interface GetProductsResult {
    page: number;
    total: number;
    totalPages: number;
    limit: number;
    data: ProductRow[];
}
export interface CreateProductParams {
    title: string;
    description: string;
    price: number;
    stock: number;
    image_url: string | null;
}
export interface CartItemWithProduct {
    id: number;
    title: string;
    price: number;
    image_url?: string;
    quantity: number;
}
export interface CreateOrderResult {
    message: string;
    orderId: number;
}
export interface PayOrderResult {
    razorpayOrderId: string;
    amount: number;
    key: string | undefined;
}
export interface GeocodeAddressComponent {
    long_name: string;
    short_name: string;
    types: string[];
}
export interface GeocodeResult {
    formatted_address: string;
    geometry: {
        location: {
            lat: number;
            lng: number;
        };
    };
    address_components: GeocodeAddressComponent[];
}
export interface GeocodeResponse {
    results: GeocodeResult[];
}
