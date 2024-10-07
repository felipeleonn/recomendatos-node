import { supabase } from './supabaseService';
import { logger } from '../utils/logger';

export const updateOrderStatus = async (orderId: string, status: string) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .update({ status: status })
      .eq('id', orderId);

    if (error) throw error;

    logger.info(`Updated order ${orderId} status to ${status}`);
    return data;
  } catch (error) {
    logger.error(`Error updating order status: ${error}`);
    throw error;
  }
};