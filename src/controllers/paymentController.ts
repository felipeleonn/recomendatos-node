import { Request, Response } from 'express';
import { updateOrderStatus } from '../services/orderService';
import { logger } from '../utils/logger';

export const handlePaymentResult = async (req: Request, res: Response) => {
  //  TODO: necesitamos el userId del que paga, que mp lo mande con el back URL
  const { preference_id, status, external_reference } = req.query;

  logger.info(`external_reference: ${external_reference}`);

  const usuario_id = external_reference;

  logger.info(`Handling payment result: ${usuario_id}`);

  if (!preference_id || !status) {
    return res.status(400);
  }

  try {
    await updateOrderStatus(preference_id.toString(), status.toString());

    logger.info(
      `https://app.recomendatos.com/redirect?paymentResult=${status.toString()}&usuario_id=${usuario_id}`,
    );

    // TODO: redireccionar en la app al USUARIO que paga pantalla valorar al proveedor si pago exitoso
    // TODO: al PROVEEDOR si el pago es exitoso avisarle de alguna manera. Para pensar...

    res.redirect(
      `https://app.recomendatos.com/redirect?paymentResult=${status.toString()}&usuario_id=${usuario_id}`,
    );
  } catch (error) {
    logger.error('Error handling payment:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
