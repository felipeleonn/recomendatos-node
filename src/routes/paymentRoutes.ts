import { Router } from 'express';
import { handlePaymentSuccess, handlePaymentFailure, handlePaymentPending } from '../controllers/paymentController';

const router = Router();

// router.post('/success', handlePaymentSuccess);
router.get('/success', handlePaymentSuccess);
router.post('/failure', handlePaymentFailure);
router.post('/pending', handlePaymentPending);

export const paymentRoutes = router;