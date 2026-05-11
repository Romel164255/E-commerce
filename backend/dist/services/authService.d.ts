import type { AuthResult } from "../types.js";
export declare const registerUser: (email: string, password: string) => Promise<AuthResult>;
export declare const loginUser: (email: string, password: string) => Promise<AuthResult>;
