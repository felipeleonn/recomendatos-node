import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      mercadopagoToken?: string;
      user?: {
        id: string;
      };
    }
  }
}