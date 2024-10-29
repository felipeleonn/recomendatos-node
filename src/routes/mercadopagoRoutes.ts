import { Router } from 'express';
import {
  createPaymentPreference,
  initiateAuthorization,
  handleOAuthCallback,
  unlinkMercadoPago,
} from '../controllers/mercadopagoController';
import { handleWebhook } from '../controllers/webhookController';
import { checkMercadoPagoAuth } from '../middleware/checkMercadoPagoAuth';

const router = Router();
// mandamos el clerkId para crear en la db de supabase el token de mercado pago y saber a quien le pertenece (mercadopago_tokens)
router.get('/auth/:clerkId', initiateAuthorization);
router.get('/oauth-callback', handleOAuthCallback);
router.post('/create-preference', checkMercadoPagoAuth, createPaymentPreference);
router.post('/webhook', handleWebhook);

router.post('/unlink', unlinkMercadoPago);

export const mercadopagoRoutes = router;

// TODO: ver como avisamos al proveedor cuando el pago es exitoso / mail? telefono?
