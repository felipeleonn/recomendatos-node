import { Request, Response, NextFunction } from 'express';
import {
  createPreference,
  CreatePreferencePayload,
  exchangeCodeForToken,
  generateAuthorizationURL,
  getPaymentById,
} from '../services/mercadopagoService';
import { logger } from '../utils/logger';
import { supabase } from '../services/supabaseService';

export const initiateAuthorization = (req: Request, res: Response) => {
  // recibo de los params un clerkId
  const { clerkId } = req.params;

  // TODO: hacer bien el tipado de clerkId
  // if (clerkId || typeof clerkId !== 'string' || clerkId.length === 0) {
  //   return res.status(400).json({ error: 'Invalid clerkId' });
  // }
  const authUrl = generateAuthorizationURL(clerkId);
  res.redirect(authUrl);
};

export const handleOAuthCallback = async (req: Request, res: Response) => {
  try {
    // state es clerkId
    const { code, state } = req.query;
    if (typeof code !== 'string') {
      throw new Error('Invalid authorization code');
    }
    const tokenData = await exchangeCodeForToken(code);

    // convertimos el tiempo de expiracion de milisegundos a una fecha
    const expiresIn = new Date(new Date().getTime() + tokenData.expires_in * 1000).toISOString();

    const { data, error } = await supabase.from('mercadopago_tokens').upsert({
      client_id: tokenData.user_id,
      clerk_id: state,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_in: expiresIn,
      created_at: new Date().toISOString(),
    });

    if (error) {
      logger.error('Error inserting token into database:', error);
      throw error;
    }
    logger.info('Authorization successful', data);
    // redirect a la app con el clerkId
    // pensamos a que pantalla enviarlo y lo redirigimos al perfil por ejemplo o a una pantalla succes de la app
    res.redirect("https://app.recomendatos.com")
  } catch (error) {
    logger.error('Error handling OAuth callback:', error);
    res.status(500).json({ error: 'Error processing authorization' });

    // TODO: Cambiar esto por una pantalla de error en la app
    // res.redirect("https://app.recomendatos.com")
  }
};

export const createPaymentPreference = async (req: Request, res: Response) => {
  try {
    const payload: CreatePreferencePayload = req.body;
    const preference = await createPreference(payload, req.mercadopagoToken!);
    res.json({
      id: preference.id,
      init_point: preference.init_point,
    });
  } catch (error) {
    logger.error('Error creating payment preference:', error);
    res.status(500).json({ error: 'Error creating payment preference' });
  }
};

export const getPayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const payment = await getPaymentById(id);
    res.json(payment);
  } catch (error) {
    logger.error('Error fetching MercadoPago payment:', error);
    res.status(500).json({ error: 'Error fetching MercadoPago payment' });
  }
};
