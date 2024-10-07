import { MercadoPagoConfig, Payment, Preference } from 'mercadopago';
import axios from 'axios';
import dotenv from 'dotenv';
import { BACKEND_URL, MERCADOPAGO_ACCESS_TOKEN, MERCADOPAGO_CLIENT_ID, MERCADOPAGO_CLIENT_SECRET, MERCADOPAGO_REDIRECT_URI } from '../config/config';

dotenv.config();

const mercadopagoClient = new MercadoPagoConfig({
  accessToken: MERCADOPAGO_ACCESS_TOKEN!,
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
    client_id: MERCADOPAGO_CLIENT_ID, 
    response_type: 'code',
    platform_id: 'mp',
    redirect_uri: MERCADOPAGO_REDIRECT_URI, 
  });
  return `${baseUrl}?${params.toString()}`;
};

export const exchangeCodeForToken = async (code: string) => {
  try {
    const response = await axios.post('https://api.mercadopago.com/oauth/token', {
      client_secret: MERCADOPAGO_CLIENT_SECRET, 
      client_id: MERCADOPAGO_CLIENT_ID, 
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: MERCADOPAGO_REDIRECT_URI,
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
      client_secret: MERCADOPAGO_CLIENT_SECRET,
      client_id: MERCADOPAGO_CLIENT_ID,
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
    const preference = new Preference(mercadopagoClient);
    const result = await preference.create({
      body: {
        items: payload.items.map((item, index) => ({
          id: `item-${index}`,
          ...item
        })),
        payer: payload.payer,
        back_urls: {
          success: `${BACKEND_URL}/api/v1/payments/success`,
          failure: `${BACKEND_URL}/api/v1/payments/failure`,
          pending: `${BACKEND_URL}/api/v1/payments/pending`,
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

