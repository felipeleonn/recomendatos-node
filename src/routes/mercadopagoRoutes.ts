import { Router } from 'express';
import {
  createPaymentPreference,
  initiateAuthorization,
  getPayment,
  handleOAuthCallback,
} from '../controllers/mercadopagoController';
import { handleWebhook } from '../controllers/webhookController';
import { checkMercadoPagoAuth } from '../middleware/checkMercadoPagoAuth';

const router = Router();
// mandamos el clerkId para crear en la db de supabase el token de mercado pago y saber a quien le pertenece (mercadopago_tokens)
router.get('/auth/:clerkId', initiateAuthorization);
router.get('/oauth-callback', handleOAuthCallback);
router.post('/create-preference', checkMercadoPagoAuth, createPaymentPreference);
router.post('/webhook', handleWebhook);
router.get('/payment/:id', getPayment);

export const mercadopagoRoutes = router;

// TODO: no olvidarnos de poner el redirect_uri en la config de mercado pago
// TODO: ver como se va a hacer el split payment
// TODO: ver como se va a hacer el cobro de la comision de mercado pago

// TODO: configurar deeplink en la app para los redirects

// TODO: consultar acerca de si hay panel en mp para ver a los usuarios autenticados con mercado pago