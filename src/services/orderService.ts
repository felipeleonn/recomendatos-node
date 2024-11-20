import { supabase } from './supabaseService';
import { logger } from '../utils/logger';

interface Payment {
  payment_id: string;
  clerk_id: string;
  status: 'approved' | 'pending' | 'rejected';
  usuario_id: string | null;
  description: string;
  currency: string;
  quantity: number;
  created_at: Date;
  updated_at: Date;
  amount: number;
  payment_link: string;
  redirect_link: string;
}

export const updateOrderStatus = async (
  preference_id: string,
  status: string,
): Promise<Payment | null> => {
  try {
    const { data, error } = await supabase
      .from('payments')
      .update({ status: status })
      .eq('payment_id', preference_id)
      .select();

    if (error) {
      logger.error(`Error updating order status: ${error.message}`);
      throw error;
    }

    if (!data) {
      logger.warn(`No payment found with payment_id: ${preference_id}`);
      return null;
    }

    return data[0];
  } catch (error) {
    logger.error(`Error updating order status: ${error}`);
    throw error;
  }
};
