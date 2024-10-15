import { Router } from 'express';
import { handlePaymentResult } from '../controllers/paymentController';

const router = Router();

// router.get('/success', handlePaymentResult);
// router.get('/failure', handlePaymentResult);
// router.get('/pending', handlePaymentResult);
//  same as:
router.get('/:status(success|failure|pending)', handlePaymentResult);

export const paymentRoutes = router;
