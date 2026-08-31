import { supabase, DbSupportTicket } from '@/lib/supabase';

export interface CreateTicketParams {
  riderPhone: string;
  category: string;
  message: string;
  orderId?: string | null;
}

/** Create a new support ticket in Supabase */
export async function createSupportTicket(
  params: CreateTicketParams
): Promise<{ success: boolean; ticket?: DbSupportTicket; error?: string }> {
  const cleanPhone = params.riderPhone.replace(/[^0-9]/g, '');
  if (!cleanPhone) return { success: false, error: 'Rider phone is required' };
  if (!params.message.trim()) return { success: false, error: 'Please enter your message/concern.' };

  const newTicket: DbSupportTicket = {
    id: `ticket-${Date.now()}`,
    rider_id: cleanPhone,
    order_id: params.orderId || null,
    category: params.category,
    message: params.message.trim(),
    status: 'OPEN',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  try {
    const { data, error } = await supabase
      .from('rider_support_tickets')
      .insert(newTicket)
      .select('*')
      .single();

    if (error) {
      console.warn('Error creating support ticket:', error);
      return { success: false, error: error.message };
    }

    return { success: true, ticket: data as DbSupportTicket };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to submit support ticket.' };
  }
}

/** Fetch support tickets for rider */
export async function fetchRiderTickets(riderPhone: string): Promise<DbSupportTicket[]> {
  const cleanPhone = riderPhone.replace(/[^0-9]/g, '');
  if (!cleanPhone) return [];

  try {
    const { data, error } = await supabase
      .from('rider_support_tickets')
      .select('*')
      .eq('rider_id', cleanPhone)
      .order('created_at', { ascending: false });

    if (error) return [];
    return (data || []) as DbSupportTicket[];
  } catch {
    return [];
  }
}
