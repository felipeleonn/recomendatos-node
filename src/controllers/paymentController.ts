import { Request, Response } from 'express';
import { updateOrderStatus } from '../services/orderService';
import { logger } from '../utils/logger';

// TODO: Armar tabla en supabase para las ordenes
export const handlePaymentSuccess = async (req: Request, res: Response) => {
  try {
    const { external_reference } = req.body;
    await updateOrderStatus(external_reference, 'approved');

    res.status(200).json({ message: 'Payment approved and order updated.' });
  } catch (error) {
    logger.error('Error handling payment success:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const handlePaymentFailure = async (req: Request, res: Response) => {
  try {
    const { external_reference } = req.body;
    await updateOrderStatus(external_reference, 'rejected');

    res.status(200).json({ message: 'Payment failed and order updated.' });
  } catch (error) {
    logger.error('Error handling payment failure:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const handlePaymentPending = async (req: Request, res: Response) => {
  try {
    const { external_reference } = req.body;
    await updateOrderStatus(external_reference, 'pending');

    res.status(200).json({ message: 'Payment is pending and order updated.' });
  } catch (error) {
    logger.error('Error handling payment pending:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};