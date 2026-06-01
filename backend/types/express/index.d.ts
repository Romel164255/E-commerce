declare global {
  namespace Express {
    interface User {
      id?: number;
      userId?: number;
      email?: string;
      role?: string;
    }

    interface Request {
      user?: User;
    }
  }
}

export {};
