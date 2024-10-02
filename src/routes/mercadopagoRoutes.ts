import { Router } from 'express';
import { createPaymentPreference, getAuthorizationURL, getPayment, handleOAuthCallback } from '../controllers/mercadopagoController';
import { handleWebhook } from '../controllers/webhookController';
import { checkMercadoPagoAuth } from '../middleware/checkMercadoPagoAuth';

const router = Router();

// ** Esto esta en orden jerarquico de desarrollo **

router.get('/auth', getAuthorizationURL);
router.get('/oauth-callback', handleOAuthCallback);
router.post('/create-preference', checkMercadoPagoAuth, createPaymentPreference);
router.post('/webhook', handleWebhook);
router.get('/payment/:id', getPayment);

export const mercadopagoRoutes = router;