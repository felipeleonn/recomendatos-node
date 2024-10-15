import { supabase } from './supabaseService';
import { logger } from '../utils/logger';

// TODO: Armar tabla en supabase para las ordenes
export const updateOrderStatus = async (preference_id: string, status: string) => {
  try {
    const { data, error } = await supabase
      .from('payments')
      .update({ status: status })
      .eq('payment_id', preference_id);

    if (error) throw error;

    logger.info(`Updated order ${preference_id} status to ${status}`);
    return data;
  } catch (error) {
    logger.error(`Error updating order status: ${error}`);
    throw error;
  }
};