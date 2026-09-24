// ── Unsettled Earnings Card ─────────────────────────────────────────────────
export interface UnsettledEarnings {
  amount: number;           // current pending balance (₹)
  nextPayoutDate: string;   // e.g. "Sunday, 21 Sep"
  payoutUpi: string;        // e.g. "918217649688@upi"
}

// ── Period Summary Card ──────────────────────────────────────────────────────
export type PeriodKey = 'today' | 'week' | 'month';

export interface PeriodBreakdown {
  deliveries: number;
  deliveryPay: number;
  incentives: number;
  total: number;
}

export interface PeriodSummary {
  today: PeriodBreakdown;
  week: PeriodBreakdown;
  month: PeriodBreakdown;
}

// ── Payout History Card ──────────────────────────────────────────────────────
export interface PayoutRecord {
  id: string;
  date: string;        // e.g. "15 Sep"
  amount: number;
  utrRef: string;      // e.g. "MIN20260915"
  status: 'Transferred';
  monthKey: string;    // e.g. "2026-09"
}

export interface MonthOption {
  key: string;         // e.g. "2026-09"
  label: string;       // e.g. "September 2026"
}
