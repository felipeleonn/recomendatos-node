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

    // TODO: al PROVEEDOR si el pago es exitoso avisarle de alguna manera. Para pensar...

    // `https://app.recomendatos.com/redirect?paymentResult=${status.toString()}&usuario_id=${usuario_id}`,
    // res.redirect(`https://app.recomendatos.com/redirect?mode=valorar&id=${updatedOrder.clerk_id}`);
    res.redirect(`exp://192.168.1.107:8081?mode=valorar&id=${updatedOrder.clerk_id}`);
  } catch (error) {
    logger.error('Error handling payment:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
