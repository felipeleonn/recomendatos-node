import { Request, Response, NextFunction } from 'express';
import {
  createPreference,
  CreatePreferencePayload,
  exchangeCodeForToken,
  generateAuthorizationURL,
  removeMercadoPagoTokens,
  revokeMercadoPagoTokens,
} from '../services/mercadopagoService';
import { logger } from '../utils/logger';
import { supabase } from '../services/supabaseService';

export const initiateAuthorization = async (req: Request, res: Response) => {
  const { clerkId } = req.params;

  if (!clerkId) {
    return res.status(400).json({ error: 'Invalid clerkId' });
  }
  const authUrl = await generateAuthorizationURL(clerkId);
  res.redirect(authUrl);
};

export const handleOAuthCallback = async (req: Request, res: Response) => {
  try {
    // state es clerkId
    const { code, state } = req.query;
    logger.info('handleOAuthCallback', { code, state });
    // code es el codigo de autorizacion que nos manda mercado pago
    if (typeof code !== 'string' || typeof state !== 'string') {
      throw new Error('Invalid authorization code');
    }
    const tokenData = await exchangeCodeForToken(code, state);

    // convertimos el tiempo de expiracion de milisegundos a una fecha
    const expiresIn = new Date(new Date().getTime() + tokenData.expires_in * 1000).toISOString();

    const { data, error } = await supabase.from('mercadopago_tokens').update({
      client_id: tokenData.user_id,
      clerk_id: state,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_in: expiresIn,
      created_at: new Date().toISOString(),
    }).eq('clerk_id', state).select();


    if (error) {
      logger.error('Error inserting token into database:', error);
      throw error;
    }
    logger.info('Authorization successful', data);

    res.redirect(`https://app.recomendatos.com/redirect?mode=authApproved`);
  } catch (error) {
    logger.error('Error handling OAuth callback:', error);
    res.status(500).json({ error: 'Error processing authorization' });

    res.redirect(`https://app.recomendatos.com/redirect?mode=authRejected`);
  }
};

export const createPaymentPreference = async (req: Request, res: Response) => {
  try {
    const payload: CreatePreferencePayload = req.body;
    const token = req.mercadopagoToken;

    console.log('token proveedor client mercadopago', token)

    const preference = await createPreference(payload, token!);
    res.json({
      id: preference.result.id,
      init_point: preference.result.init_point,
      redirect_link: preference.redirectLinkResult, // url deeplink para que el cliente pague
    });
  } catch (error) {
    logger.error('Error creating payment preference:', error);
    res.status(500).json({ error: 'Error creating payment preference' });
  }
};

export const unlinkMercadoPago = async (req: Request, res: Response) => {
  const { clerkId } = req.body;

  if (!clerkId) {
    return res.status(400).json({ error: 'clerkId es requerido.' });
  }

  try {
    // Revocar los tokens de MercadoPago
    await revokeMercadoPagoTokens(clerkId);

    // Eliminar los tokens de Supabase
    await removeMercadoPagoTokens(clerkId);
    res.status(200).json({ message: 'Tokens de MercadoPago desvinculados exitosamente.' });
  } catch (error) {
    logger.error('Error al desvincular tokens de MercadoPago:', error);
    res.status(500).json({ error: 'Error al desvincular tokens de MercadoPago.' });
  }
};
