import dotenv from 'dotenv';

dotenv.config();

export const PORT = process.env.PORT || 3000;
export const NODE_ENV = process.env.NODE_ENV || 'development';
export const SUPABASE_URL = process.env.SUPABASE_URL!;
export const SUPABASE_KEY = process.env.SUPABASE_KEY!;
export const BACKEND_URL = process.env.BACKEND_URL!;
export const MERCADOPAGO_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN!;
export const MERCADOPAGO_CLIENT_ID = process.env.MERCADOPAGO_CLIENT_ID!;
export const MERCADOPAGO_CLIENT_SECRET = process.env.MERCADOPAGO_CLIENT_SECRET!;
export const MERCADOPAGO_REDIRECT_URI = process.env.MERCADOPAGO_REDIRECT_URI!;