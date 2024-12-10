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
import { generateAlphanumericString } from '../utils/generateAlpanumericString';
import { generateCodeVerifier } from '../utils/pkce';
import { generateCodeChallenge } from '../utils/pkce';

const mercadopagoClientRecomendatos = new MercadoPagoConfig({
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
export const generateAuthorizationURL = async (clerkId: string) => {
  const baseUrl = 'https://auth.mercadopago.com.ar/authorization';
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);

  const { data: existingRow } = await supabase
    .from('mercadopago_tokens')
    .select('*')
    .eq('clerk_id', clerkId)
    .single();

  const { error } = existingRow
    ? await supabase
        .from('mercadopago_tokens')
        .update({
          code_verifier: codeVerifier,
        })
        .eq('clerk_id', clerkId)
    : await supabase.from('mercadopago_tokens').insert({
        client_id: '',
        clerk_id: clerkId,
        access_token: '',
        refresh_token: '',
        expires_in: new Date().toISOString(),
        created_at: new Date().toISOString(),
        code_verifier: codeVerifier,
      });

  if (error) {
    logger.error(
      'Error updating mercadopago_tokens in function generateAuthorizationURL:',
      error,
    );
    throw error;
  }

  const params = new URLSearchParams({
    client_id: MERCADOPAGO_CLIENT_ID,
    response_type: 'code',
    platform_id: 'mp',
    redirect_uri: MERCADOPAGO_REDIRECT_URI,
    state: clerkId,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });
  return `${baseUrl}?${params.toString()}`;
};

// https://www.mercadopago.com.ar/developers/es/reference/oauth/_oauth_token/post

export const exchangeCodeForToken = async (code: string, state: string) => {
  const { data: mercadopagoTokenData, error } = await supabase
    .from('mercadopago_tokens')
    .select('*')
    .eq('clerk_id', state)
    .single();

  if (error) {
    logger.error('Error fetching MercadoPago token data in exchangeCodeForToken:', error);
    throw error;
  }

  try {
    const response = await axios.post('https://api.mercadopago.com/oauth/token', {
      client_secret: MERCADOPAGO_CLIENT_SECRET,
      client_id: MERCADOPAGO_CLIENT_ID,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: MERCADOPAGO_REDIRECT_URI,
      code_verifier: mercadopagoTokenData?.code_verifier,
    });
    logger.info('response exchangeCodeForToken', response.data);
    return response.data;
  } catch (error) {
    logger.error('Error exchanging code for token:', error);
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
    logger.error('Error refreshing access token:', error);
    throw error;
  }
};

export const createPreference = async (payload: CreatePreferencePayload, token: string) => {
  const clerkId = payload.clerkId;
  const mercadopagoClientProveedor = new MercadoPagoConfig({
    accessToken: token,
  });

  const recomendatosComission = 0.012;
  const mercadopagoComission = 0.018;

  const randomExternalReference = generateAlphanumericString(32);

  try {
    const preference = new Preference(mercadopagoClientProveedor);
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
        marketplace_fee: payload.items[0].unit_price * recomendatosComission,
        marketplace: 'MP-MKT-4824894571384864',
        back_urls: {
          success: `${BACKEND_URL}/api/payments/success`,
          failure: `${BACKEND_URL}/api/payments/failure`,
          pending: `${BACKEND_URL}/api/payments/pending`,
        },
        auto_return: 'approved',
        notification_url: `${BACKEND_URL}/api/mercadopago/webhook`,
        external_reference: randomExternalReference,
        expires: true,
        expiration_date_from: new Date().toISOString(),
        expiration_date_to: new Date(new Date().getTime() + 24 * 60 * 60 * 1000).toISOString(),
      },
    });

    if (result.api_response.status !== 201) {
      throw new Error('Error creating MercadoPago preference');
    }

    logger.info('[createPreference] result:', result);

    const redirectLinkResult = `https://app.recomendatos.com/redirect?mode=mercadoPago&paymentId=${result.id}`;
    const providerAmount =
      payload.items[0].unit_price * (1 - mercadopagoComission - recomendatosComission);
    const recomendatosComissionAmount = payload.items[0].unit_price * recomendatosComission;

    logger.info('[createPreference] providerAmount:', providerAmount);
    logger.info('[createPreference] recomendatosComissionAmount:', recomendatosComissionAmount);

    const { data, error: supabaseError } = await supabase.from('payments').insert({
      payment_id: result.id,
      clerk_id: clerkId,
      status: PaymentStatus.PENDING,
      usuario_id: null,
      description: payload.items[0].title,
      amount: payload.items[0].unit_price,
      provider_amount: providerAmount,
      recomendatos_comission: recomendatosComissionAmount,
      currency: 'ARS',
      quantity: Number(payload.items[0].quantity),
      payment_link: result.init_point,
      redirect_link: redirectLinkResult,
      external_reference: randomExternalReference,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (supabaseError) throw supabaseError;

    return { result, redirectLinkResult };
  } catch (error) {
    logger.error('Error creating MercadoPago preference:', error);
    throw error;
  }
};

export const getPaymentById = async (paymentId: string) => {
  try {
    const payment = new Payment(mercadopagoClientRecomendatos);
    const result = await payment.get({ id: paymentId });
    return result;
  } catch (error) {
    logger.error('Error fetching MercadoPago payment:', error);
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
      },
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
