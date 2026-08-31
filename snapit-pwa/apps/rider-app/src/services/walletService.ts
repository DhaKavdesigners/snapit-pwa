import { supabase, DbWalletTransaction } from '@/lib/supabase';

export interface WalletSummary {
  availableBalance: number;
  pendingEarnings: number;
  withdrawableBalance: number;
  transactions: DbWalletTransaction[];
}

/** Fetch wallet summary & recent transactions from Supabase */
export async function fetchWalletSummary(riderPhone: string): Promise<WalletSummary> {
  const cleanPhone = riderPhone.replace(/[^0-9]/g, '');
  if (!cleanPhone) {
    return { availableBalance: 0, pendingEarnings: 0, withdrawableBalance: 0, transactions: [] };
  }

  try {
    const { data: profile } = await supabase
      .from('rider_profiles')
      .select('wallet_balance')
      .eq('phone', cleanPhone)
      .maybeSingle();

    const balance = Number(profile?.wallet_balance) || 0;

    const { data: txns } = await supabase
      .from('rider_wallet_transactions')
      .select('*')
      .eq('rider_id', cleanPhone)
      .order('created_at', { ascending: false })
      .limit(30);

    return {
      availableBalance: balance,
      pendingEarnings: 0,
      withdrawableBalance: balance,
      transactions: (txns || []) as DbWalletTransaction[],
    };
  } catch {
    return { availableBalance: 0, pendingEarnings: 0, withdrawableBalance: 0, transactions: [] };
  }
}

/** Request Cashout / Bank Transfer */
export async function requestCashout(
  riderPhone: string,
  amount: number,
  upiId: string
): Promise<{ success: boolean; error?: string }> {
  const cleanPhone = riderPhone.replace(/[^0-9]/g, '');
  if (!cleanPhone) return { success: false, error: 'Rider phone is required' };

  try {
    const { data: profile } = await supabase
      .from('rider_profiles')
      .select('wallet_balance')
      .eq('phone', cleanPhone)
      .single();

    const currentBalance = Number(profile?.wallet_balance) || 0;
    if (amount > currentBalance) {
      return { success: false, error: 'Insufficient wallet balance' };
    }

    const newBalance = currentBalance - amount;

    // Deduct wallet balance
    await supabase
      .from('rider_profiles')
      .update({ wallet_balance: newBalance, updated_at: new Date().toISOString() })
      .eq('phone', cleanPhone);

    // Record cashout transaction
    await supabase.from('rider_wallet_transactions').insert({
      id: `txn-${Date.now()}`,
      rider_id: cleanPhone,
      amount: -amount,
      type: 'CASHOUT',
      status: 'TRANSFERRED',
      description: `Transfer to UPI ${upiId}`,
      created_at: new Date().toISOString(),
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Cashout request failed.' };
  }
}
