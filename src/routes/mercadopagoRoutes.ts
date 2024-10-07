import { Router } from 'express';
import { createPaymentPreference } from '../controllers/mercadopagoController';
import { handleWebhook } from '../controllers/webhookController';

const router = Router();

router.post('/create-preference', createPaymentPreference);
router.post('/webhook', handleWebhook);

export const mercadopagoRoutes = router;