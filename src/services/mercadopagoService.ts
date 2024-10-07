import { MercadoPagoConfig, Preference } from 'mercadopago';
import dotenv from 'dotenv';

dotenv.config();


// export const mercadopagoClient = new MercadoPagoConfig({
//   accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
// });

export interface CreatePreferencePayload {
  items: Array<{
    title: string;
    unit_price: number;
    quantity: number;
  }>;
  payer: {
    email: string;
  };
}

export const createPreference = async (payload: CreatePreferencePayload) => {
  const client = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!  });
  try {
  const preference = new Preference(client);
  const result = await preference.create({
      body: {
        items: payload.items.map((item, index) => ({
          id: `item-${index}`,
          ...item
        })),
        payer: payload.payer,
        back_urls: {
          success: `${process.env.FRONTEND_URL}/success`,
          failure: `${process.env.FRONTEND_URL}/failure`,
          pending: `${process.env.FRONTEND_URL}/pending`,
        },
        auto_return: 'approved',
      },
    });
    return result;
  } catch (error) {
    console.error('Error creating MercadoPago preference:', error);
    throw error;
  }
};

// export const getPaymentById = async (paymentId: string) => {
//   try {
//     const payment = await mercadopago.payment.get(paymentId);
//     return payment.body;
//   } catch (error) {
//     console.error('Error fetching MercadoPago payment:', error);
//     throw error;
//   }
// };
