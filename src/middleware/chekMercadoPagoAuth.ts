import { Request, Response, NextFunction } from 'express';
import { supabase } from '../services/supabaseService';
import { refreshAccessToken } from '../services/mercadopagoService';
import { logger } from '../utils/logger';

export const checkMercadoPagoAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Assuming you have user authentication in place
    const userId = req.user!.id;

    // Fetch the user's MercadoPago token from the database
    const { data: tokenData, error } = await supabase
      .from('mercadopago_tokens')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !tokenData) {
      return res.status(401).json({ error: 'MercadoPago authorization required' });
    }

    // Check if the token is expired
    const now = new Date();
    const tokenExpiration = new Date(tokenData.created_at);
    tokenExpiration.setSeconds(tokenExpiration.getSeconds() + tokenData.expires_in);

    if (now > tokenExpiration) {
      // Token is expired, refresh it
      const newTokenData = await refreshAccessToken(tokenData.refresh_token);

      // Update the token in the database
      const { error: updateError } = await supabase
        .from('mercadopago_tokens')
        .update({
          access_token: newTokenData.access_token,
          refresh_token: newTokenData.refresh_token,
          expires_in: newTokenData.expires_in,
          created_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (updateError) {
        throw updateError;
      }

      // Set the new access token for use in the request
      req.mercadopagoToken = newTokenData.access_token;
    } else {
      // Token is still valid
      req.mercadopagoToken = tokenData.access_token;
    }

    next();
  } catch (error) {
    logger.error('Error checking MercadoPago authorization:', error);
    res.status(500).json({ error: 'Error checking MercadoPago authorization' });
  }
};