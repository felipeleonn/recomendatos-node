import { supabase } from './supabaseService';
import { logger } from '../utils/logger';

export const updateOrderStatus = async (preference_id: string, status: string) => {
  try {
    const { data, error } = await supabase
      .from('payments')
      .update({ status: status })
      .eq('payment_id', preference_id);

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error(`Error updating order status: ${error}`);
    throw error;
  }
};