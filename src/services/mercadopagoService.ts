import { MercadoPagoConfig, Payment, Preference } from 'mercadopago';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const CLIENT_ID = process.env.MERCADOPAGO_CLIENT_ID!;
const CLIENT_SECRET = process.env.MERCADOPAGO_CLIENT_SECRET!;
const REDIRECT_URI = process.env.MERCADOPAGO_REDIRECT_URI!;
const mercadopagoClient = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
});

export interface CreatePreferencePayload {
  items: Array<{
    title: string;
    unit_price: number;
    quantity: number;
  }>;
  payer: {
    email: string;
  };
  orderId: string; 
}

export const generateAuthorizationURL = () => {
  const baseUrl = 'https://auth.mercadopago.com.ar/authorization';
  const params = new URLSearchParams({
    client_id: CLIENT_ID, // TODO: Mover esto a una variable de entorno
    response_type: 'code',
    platform_id: 'mp',
    redirect_uri: REDIRECT_URI, // TODO: Mover esto a una variable de entorno
  });
  return `${baseUrl}?${params.toString()}`;
};

export const exchangeCodeForToken = async (code: string) => {
  try {
    const response = await axios.post('https://api.mercadopago.com/oauth/token', {
      client_secret: CLIENT_SECRET, // TODO: Mover esto a una variable de entorno
      client_id: CLIENT_ID, // TODO: Mover esto a una variable de entorno
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: REDIRECT_URI,
    });
    return response.data;
  } catch (error) {
    console.error('Error exchanging code for token:', error);
    throw error;
  }
};

export const refreshAccessToken = async (refreshToken: string) => {
  try {
    const response = await axios.post('https://api.mercadopago.com/oauth/token', {
      client_secret: CLIENT_SECRET, // TODO: Mover esto a una variable de entorno
      client_id: CLIENT_ID, // TODO: Mover esto a una variable de entorno
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    });
    return response.data;
  } catch (error) {
    console.error('Error refreshing access token:', error);
    throw error;
  }
};
export const createPreference = async (payload: CreatePreferencePayload, accessToken: string) => {
  try {
    const client = new MercadoPagoConfig({ accessToken });
    const preference = new Preference(client);
    const result = await preference.create({
      body: {
        items: payload.items.map((item, index) => ({
          id: `item-${index}`,
          ...item
        })),
        payer: payload.payer,
        back_urls: {
          success: `${process.env.FRONTEND_URL}/success`,
          failure: `${process.env.FRONTEND_URL}/failure`,
          pending: `${process.env.FRONTEND_URL}/pending`,
        },
        auto_return: 'approved',
        external_reference: payload.orderId,
        notification_url: `${process.env.BACKEND_URL}/api/mercadopago/webhook`,
      },
    });
    return result;
  } catch (error) {
    console.error('Error creating MercadoPago preference:', error);
    throw error;
  }
};

export const getPaymentById = async (paymentId: string) => {
  try {
    const payment = new Payment(mercadopagoClient);
    const result = await payment.get({ id: paymentId });
    return result;
  } catch (error) {
    console.error('Error fetching MercadoPago payment:', error);
    throw error;
  }
};

