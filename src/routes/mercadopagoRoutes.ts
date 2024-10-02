import { Router } from 'express';
import { createPaymentPreference, getAuthorizationURL, getPayment } from '../controllers/mercadopagoController';
import { handleWebhook } from '../controllers/webhookController';

const router = Router();

// ** Esto esta en orden de desarrollo **

router.get('/auth', getAuthorizationURL);
// router.get('/oauth-callback', handleOAuthCallback);
router.post('/create-preference', createPaymentPreference);
//TODO: activar cuando funcion en middleware check de auth
// router.post('/create-preference', checkMercadoPagoAuth, createPaymentPreference);
router.post('/webhook', handleWebhook);
router.get('/payment/:id', getPayment);

export const mercadopagoRoutes = router;