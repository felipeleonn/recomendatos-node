import { Request, Response } from 'express';
import { updateOrderStatus } from '../services/orderService';
import { logger } from '../utils/logger';

export const handlePaymentResult = async (req: Request, res: Response) => {
  //  TODO: necesitamos el userId del que paga, que mp lo mande con el back URL
  const { preference_id, status, state } = req.query;

  const usuario_id = state;

  logger.info(`Handling payment result: ${usuario_id}`);

  if (!preference_id || !status) {
    return res.status(400);
  }

  try {
    await updateOrderStatus(preference_id.toString(), status.toString());

    logger.info(
      `https://app.recomendatos.com/redirect?paymentResult=${status.toString()}&usuario_id=${usuario_id}`,
    );

    // TODO: pantalla en la app para mostrar el resultado del pago
    res.redirect(
      `https://app.recomendatos.com/redirect?paymentResult=${status.toString()}&usuario_id=${usuario_id}`,
    );
  } catch (error) {
    logger.error('Error handling payment:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
