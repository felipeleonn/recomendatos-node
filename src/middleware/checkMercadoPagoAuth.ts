import { Request, Response, NextFunction } from 'express';
import { supabase } from '../services/supabaseService';
import { refreshAccessToken } from '../services/mercadopagoService';
import { logger } from '../utils/logger';

// TODO: Hacer tabla de tokens de mercado pago en supabase
export const checkMercadoPagoAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    const { data: tokenData, error } = await supabase
      .from('mercadopago_tokens')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !tokenData) {
      return res.status(401).json({ error: 'MercadoPago authorization required' });
    }

    // Chequiamos si el token esta vencido
    const now = new Date();
    const tokenExpiration = new Date(tokenData.created_at);
    tokenExpiration.setSeconds(tokenExpiration.getSeconds() + tokenData.expires_in);

    if (now > tokenExpiration) {
      // Si esta expirado, lo renovamos
      const newTokenData = await refreshAccessToken(tokenData.refresh_token);

      // Actualizamos el token en la base de datos
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

      // Setiar el nuevo token en el request
      req.mercadopagoToken = newTokenData.access_token;
    } else {
      // El token es valido
      req.mercadopagoToken = tokenData.access_token;
    }

    next();
  } catch (error) {
    logger.error('Error checking MercadoPago authorization:', error);
    res.status(500).json({ error: 'Error checking MercadoPago authorization' });
  }
};