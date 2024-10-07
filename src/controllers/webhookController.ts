import { Request, Response } from 'express';
import { Payment, MercadoPagoConfig } from 'mercadopago';
import { logger } from '../utils/logger';

const client = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN! });

export const handleWebhook = async (req: Request, res: Response) => {
  try {
    const { type, data } = req.body;

    if (type === 'payment') {
      const paymentId = data.id;
      const payment = new Payment(client);
      const result = await payment.get({ id: paymentId });
      
      if (result.status === 'approved') {
        logger.info(`Payment ${paymentId} processed. Status: ${result.status}`);
        // Update your database or perform any other necessary actions
      } else {
        logger.warn(`Payment ${paymentId} not approved. Status: ${result.status}`);
      }
    }

    res.sendStatus(200);
  } catch (error) {
    logger.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Error processing webhook' });
  }
};