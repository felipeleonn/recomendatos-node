import { Request, Response } from 'express';
import { Payment, MercadoPagoConfig } from 'mercadopago';
import { logger } from '../utils/logger';
import { updateOrderStatus } from '../services/orderService';
import { MERCADOPAGO_ACCESS_TOKEN } from '../config/config';

const client = new MercadoPagoConfig({ accessToken: MERCADOPAGO_ACCESS_TOKEN! });

export const handleWebhook = async (req: Request, res: Response) => {
  try {
    const { action, data } = req.body;

    logger.info(`Received webhook: ${action}`);

    if (action === 'payment.created' || action === 'payment.updated') {
      const paymentId = data.id;
      const payment = new Payment(client);
      const result = await payment.get({ id: paymentId });

      logger.info('------ WEBHOOK ------');
      logger.info(`Payment ${paymentId} status: ${result.status}`);
      logger.info('---------------');

      // Update order status in your database
      // TODO: Implementar en la base de datos
      // await updateOrderStatus(result.external_reference!, result.status!);

      // Perform any additional actions based on the payment status
      if (result.status === 'approved') {
        // Handle approved payment
      } else if (result.status === 'rejected') {
        // Handle rejected payment
      }
    }

    res.sendStatus(200);
  } catch (error) {
    logger.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Error processing webhook' });
  }
};
