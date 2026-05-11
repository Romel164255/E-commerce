import { type ZodSchema } from "zod";
import type { Request, Response, NextFunction } from "express";
export declare const validate: (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => void;
