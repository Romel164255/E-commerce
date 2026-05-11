import type { AddressRow } from "../types.js";
export declare const addAddress: (userId: number, data: {
    full_name: string;
    phone: string;
    address_line: string;
}) => Promise<AddressRow>;
export declare const getUserAddresses: (userId: number) => Promise<AddressRow[]>;
