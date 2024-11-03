import { MercadoPagoConfig, Payment, Preference } from 'mercadopago';
import axios from 'axios';
import {
  BACKEND_URL,
  MERCADOPAGO_ACCESS_TOKEN,
  MERCADOPAGO_CLIENT_ID,
  MERCADOPAGO_CLIENT_SECRET,
  MERCADOPAGO_REDIRECT_URI,
} from '../config/config';
import { logger } from '../utils/logger';
import { supabase } from './supabaseService';
import { PaymentStatus } from '../types/paymentsStatus';

const mercadopagoClient = new MercadoPagoConfig({
  accessToken: MERCADOPAGO_ACCESS_TOKEN!,
});

export interface CreatePreferencePayload {
  items: Array<{
    title: string;
    unit_price: number;
    quantity: number;
  }>;
  clerkId: string;
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

export const createPreference = async (payload: CreatePreferencePayload) => {
  const clerkId = payload.clerkId;
  // https://www.mercadopago.com.ar/developers/es/docs/checkout-bricks/wallet-brick/advanced-features/preferences
  try {
    const preference = new Preference(mercadopagoClient);
    const result = await preference.create({
      body: {
        items: payload.items.map((item, index) => ({
          id: `item-${index}`,
          ...item,
        })),
        payment_methods: {
          excluded_payment_types: [
            { id: 'credit_card' },
            { id: 'debit_card' },
            { id: 'prepaid_card' },
            { id: 'ticket' },
            { id: 'atm' },
          ],
          default_payment_method_id: 'account_money',
        },
        marketplace_fee: 1.5,
        back_urls: {
          success: `${BACKEND_URL}/api/payments/success`,
          failure: `${BACKEND_URL}/api/payments/failure`,
          pending: `${BACKEND_URL}/api/payments/pending`,
        },
        auto_return: 'approved',
        // external_reference: payload.orderId,
        // notification_url: `${process.env.BACKEND_URL}/api/mercadopago/webhook`,
        expires: true,
        expiration_date_from: new Date().toISOString(),
        expiration_date_to: new Date(new Date().getTime() + 24 * 60 * 60 * 1000).toISOString(),
      },
    });

    let redirectLinkResult = '';
    if (result.api_response.status === 201) {
      redirectLinkResult = `https://app.recomendatos.com/redirect?mode=mercadoPago&paymentId=${result.id}`;
      const { data, error: supabaseError } = await supabase.from('payments').insert({
        payment_id: result.id,
        clerk_id: clerkId,
        status: PaymentStatus.PENDING,
        usuario_id: null,
        description: payload.items[0].title,
        amount: payload.items[0].unit_price,
        currency: 'ARS',
        quantity: Number(payload.items[0].quantity),
        payment_link: result.init_point,
        redirect_link: redirectLinkResult,
        //  TODO: Transaction number es el numero de la transaccion que se obtiene cuando el pago es exitoso
        // transaction_number: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (supabaseError) throw supabaseError;
    }

    return { result, redirectLinkResult };
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

export const revokeMercadoPagoTokens = async (clerkId: string): Promise<void> => {
  try {
    // Obtener los tokens desde Supabase usando el clerkId
    const { data: tokenData, error } = await supabase
      .from('mercadopago_tokens')
      .select('*')
      .eq('clerk_id', clerkId)
      .single();

    if (error || !tokenData) {
      throw new Error('Tokens no encontrados para el clerkId proporcionado.');
    }

    const { access_token } = tokenData;

    const revokeUrl = 'https://api.mercadopago.com/oauth/revoke';

    // Revocar el access_token
    await axios.post(
      revokeUrl,
      {
        client_id: MERCADOPAGO_CLIENT_ID,
        client_secret: MERCADOPAGO_CLIENT_SECRET,
        token: access_token,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    logger.info(`Tokens revocados exitosamente para clerkId: ${clerkId}`);
  } catch (error) {
    logger.error(`Error al revocar tokens para clerkId ${clerkId}:`, error);
        throw new Error('No se pudieron revocar los tokens de MercadoPago.');
  }
};

export const removeMercadoPagoTokens = async (clerkId: string) => {
  try {
    const { data, error } = await supabase
      .from('mercadopago_tokens')
      .delete()
      .eq('clerk_id', clerkId);

    if (error) {
      throw error;
    }

    logger.info(`Tokens de MercadoPago eliminados para clerkId: ${clerkId}`);
    return data;
  } catch (error) {
    logger.error(`Error al eliminar tokens de MercadoPago para clerkId ${clerkId}:`, error);
    throw error;
  }
};