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

      const updateOrder = await updateOrderStatus(paymentId, result.status!);
      logger.info('Updated order in handleWebhook:', updateOrder);
    }

    res.sendStatus(200);
  } catch (error) {
    logger.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Error processing webhook' });
  }
};
