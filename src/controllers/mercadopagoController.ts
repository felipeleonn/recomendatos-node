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

export const initiateAuthorization = (req: Request, res: Response) => {
  const { clerkId } = req.params;

  if (!clerkId) {
    return res.status(400).json({ error: 'Invalid clerkId' });
  }
  const authUrl = generateAuthorizationURL(clerkId);
  res.redirect(authUrl);
};

export const handleOAuthCallback = async (req: Request, res: Response) => {
  try {
    // state es clerkId
    const { code, state } = req.query;
    // code es el codigo de autorizacion que nos manda mercado pago
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

    // TODO: pantalla en la app para mostrar el resultado de la autorizacion
    // TODO: cuando hagamos el redirect por succes al auth hay que invalidar la query "hasTokenInMercadoPago"
    // useEffect(() => {
    //   const handleRedirect = async () => {
    //     const { authResult } = searchParams;

    //     if (authResult === "approved") {
    //       await queryClient.invalidateQueries(["hasTokenInMercadopago", "clerkId"]);
    //       showToast("success", "Autenticación con MercadoPago exitosa");
    //       router.replace("/(tabs)/(perfil)/metodo-pago");
    //     } else if (authResult === "rejected") {
    //       showToast("error", "Autenticación con MercadoPago fallida, intente de nuevo en un rato.");
    //       router.replace("/(tabs)/(perfil)/metodo-pago");
    //     } else {
    //       router.replace("/(tabs)/(perfil)/metodo-pago");
    //     }
    //   };

    //   handleRedirect();
    // }, [searchParams, queryClient, router]);
    res.redirect(`https://app.recomendatos.com/redirect?authResult=approved`);
  } catch (error) {
    logger.error('Error handling OAuth callback:', error);
    res.status(500).json({ error: 'Error processing authorization' });

    // TODO: pantalla en la app para mostrar el resultado ERROR de la autorizacion
    res.redirect(`https://app.recomendatos.com/redirect?authResult=rejected`);
  }
};

export const createPaymentPreference = async (req: Request, res: Response) => {
  try {
    const payload: CreatePreferencePayload = req.body;

    const preference = await createPreference(payload);
    res.json({
      id: preference.id,
      init_point: preference.init_point, // url para que el cliente pague
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