import { MercadoPagoConfig, Payment, Preference } from 'mercadopago';
import axios from 'axios';
import {
  BACKEND_URL,
  MERCADOPAGO_ACCESS_TOKEN,
  MERCADOPAGO_CLIENT_ID,
  MERCADOPAGO_CLIENT_SECRET,
  MERCADOPAGO_REDIRECT_URI,
} from '../config/config';

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

// https://www.mercadopago.com.ar/developers/es/docs/split-payments/integration-configuration/create-configuration
// https://auth.mercadopago.com.ar/authorization?client_id=<APP_ID>&response_type=code&platform_id=mp&redirect_uri=<REDIRECT_URI>&clerkId=<CLERK_ID>
export const generateAuthorizationURL = (clerkId: string) => {
  const baseUrl = 'https://auth.mercadopago.com.ar/authorization';
  const params = new URLSearchParams({
    client_id: MERCADOPAGO_CLIENT_ID,
    response_type: 'code',
    platform_id: 'mp',
    redirect_uri: MERCADOPAGO_REDIRECT_URI,
    state: clerkId,
  });
  return `${baseUrl}?${params.toString()}`;
};

// https://www.mercadopago.com.ar/developers/es/reference/oauth/_oauth_token/post
//TODO: no olvidarnos de poner el redirect_uri en la config de mercado pago
export const exchangeCodeForToken = async (code: string) => {

  // ejemplo de authorization_code  
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
/* 
respuesta ejemplo de exchangeCodeForToken
{
  "access_token": "APP_USR-4934588586838432-XXXXXXXX-241983636",
  "token_type": "bearer",
  "expires_in": 15552000,
  "scope": "read write offline_access",
  "user_id": 241983636,
  "refresh_token": "TG-XXXXXXXX-241983636",
  "public_key": "APP_USR-d0a26210-XXXXXXXX-479f0400869e",
  "live_mode": true
} 
*/

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

// TODO: evaluar a donde redirigir con back_urls al usuario
export const createPreference = async (payload: CreatePreferencePayload, accessToken: string) => {
  // TODO: sumarle el 1.5% de comision a cada pago
  try {
    const preference = new Preference(mercadopagoClient);
    const result = await preference.create({
      body: {
        items: payload.items.map((item, index) => ({
          id: `item-${index}`,
          ...item,
        })),
        payer: payload.payer,
        back_urls: {
          success: `${BACKEND_URL}/api/payments/success`,
          failure: `${BACKEND_URL}/api/payments/failure`,
          pending: `${BACKEND_URL}/api/payments/pending`,
        },
        auto_return: 'approved',
        external_reference: payload.orderId,
        //! notification_url to handle backend notificacion about payment status change real-time
        // notification_url: `${process.env.BACKEND_URL}/api/mercadopago/webhook`,
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
