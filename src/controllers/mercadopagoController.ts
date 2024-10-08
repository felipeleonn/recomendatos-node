import { Request, Response, NextFunction } from 'express';
import { createPreference, CreatePreferencePayload, exchangeCodeForToken, generateAuthorizationURL, getPaymentById } from '../services/mercadopagoService';
import { logger } from '../utils/logger';
import { supabase } from '../services/supabaseService';

// export const getAuthorizationURL = (req: Request, res: Response) => {
//   const authUrl = generateAuthorizationURL();
//   res.json({ authorizationUrl: authUrl });
// };

export const initiateAuthorization = (req: Request, res: Response) => {
  logger.info('Initiating authorization');
  const authUrl = generateAuthorizationURL();
  logger.info(`Generated auth URL: ${authUrl}`);
  res.redirect(authUrl);
};

// TODO: Hacer en supabase una tabla de tokens de mercado pago
export const handleOAuthCallback = async (req: Request, res: Response) => {
  try {
    const { code } = req.query;
    if (typeof code !== 'string') {
      throw new Error('Invalid authorization code');
    }
    const tokenData = await exchangeCodeForToken(code);
    
    const { data, error } = await supabase
      .from('mercadopago_tokens')
      .upsert({
        clerk_id: req.user!.id,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_in: tokenData.expires_in,
        created_at: new Date().toISOString(),
      });

    if (error) {
      throw error;
    }

    res.json({ message: 'Authorization successful' });
  } catch (error) {
    logger.error('Error handling OAuth callback:', error);
    res.status(500).json({ error: 'Error processing authorization' });
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





