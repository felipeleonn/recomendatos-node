import { Request, Response } from 'express';
import { updateOrderStatus } from '../services/orderService';
import { logger } from '../utils/logger';

export const handlePaymentResult = async (req: Request, res: Response) => {
  const { preference_id, status } = req.query;
  if (!preference_id || !status) {
    return res.status(400);
  }
  try {
    const updatedOrder = await updateOrderStatus(preference_id.toString(), status.toString());

    if (!updatedOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    logger.info(`https://app.recomendatos.com/redirect?mode=valorar&id=${updatedOrder.clerk_id}`);

    res.redirect(`https://app.recomendatos.com/redirect?mode=valorar&id=${updatedOrder.clerk_id}`);
  } catch (error) {
    // TODO: Manejar redireccion
    logger.error('Error handling payment:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
