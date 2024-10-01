import { Router } from 'express';
import { createPaymentPreference, getPayment } from '../controllers/mercadopagoController';
import { handleWebhook } from '../controllers/webhookController';

const router = Router();

router.post('/create-preference', createPaymentPreference);
router.get('/payment/:id', getPayment);
router.post('/webhook', handleWebhook);

export const mercadopagoRoutes = router;