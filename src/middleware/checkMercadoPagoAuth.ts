import { Request, Response, NextFunction } from 'express';
import { supabase } from '../services/supabaseService';
import { refreshAccessToken } from '../services/mercadopagoService';
import { logger } from '../utils/logger';

// TODO: Hacer tabla de tokens de mercado pago en supabase
export const checkMercadoPagoAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const clerkId = req.body.clerkId;

    if (!clerkId) {
      return res.status(400).json({ error: 'Invalid clerkId' });
    }

    const { data: tokenData, error } = await supabase
      .from('mercadopago_tokens')
      .select('*')
      .eq('clerk_id', clerkId)
      .single();

    if (error || !tokenData) {
      return res.status(401).json({ error: 'MercadoPago authorization required' });
    }

    // Calcular la expiración con margen de seguridad de 160 días
    const now = new Date();
    const tokenExpiration = new Date(tokenData.created_at);
    tokenExpiration.setSeconds(tokenExpiration.getSeconds() + tokenData.expires_in);
    const safeRenewalTime = new Date(tokenExpiration);
    safeRenewalTime.setDate(safeRenewalTime.getDate() - 20); // Renueva 20 días antes del vencimiento que es 180

    if (now > safeRenewalTime) {
      // Si está dentro del margen de renovación segura, lo renovamos
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
        .eq('clerk_id', clerkId);

      if (updateError) {
        throw updateError;
      }

      // Setiar el nuevo token en el request
      req.mercadopagoToken = newTokenData.access_token;
    } else {
      // El token es válido y no necesita renovación
      req.mercadopagoToken = tokenData.access_token;
    }

    next();
  } catch (error) {
    logger.error('Error checking MercadoPago authorization:', error);
    res.status(500).json({ error: 'Error checking MercadoPago authorization' });
  }
};
