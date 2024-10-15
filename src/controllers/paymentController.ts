import { Request, Response } from 'express';
import { updateOrderStatus } from '../services/orderService';
import { logger } from '../utils/logger';

export const handlePaymentResult = async (req: Request, res: Response) => {
  const { preference_id, status } = req.query;

  if (!preference_id || !status) {
    return res.status(400);
  }

  try {
    await updateOrderStatus(preference_id.toString(), status.toString());

    // TODO: pantalla en la app para mostrar el resultado del pago
    res.redirect(`https://app.recomendatos.com/redirect?paymentResult=${status.toString()}`);
  } catch (error) {
    logger.error('Error handling payment:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
