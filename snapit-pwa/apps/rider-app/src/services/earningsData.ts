import {
  UnsettledEarnings,
  PeriodSummary,
  PayoutRecord,
  MonthOption,
} from '@/types/earnings';

export const initialUnsettledEarnings: UnsettledEarnings = {
  amount: 0,
  nextPayoutDate: 'Upcoming Sunday',
  payoutUpi: '—',
};

export const initialPeriodSummary: PeriodSummary = {
  today: { deliveries: 0, deliveryPay: 0, incentives: 0, total: 0 },
  week:  { deliveries: 0, deliveryPay: 0, incentives: 0, total: 0 },
  month: { deliveries: 0, deliveryPay: 0, incentives: 0, total: 0 },
};

export const MONTH_OPTIONS: MonthOption[] = [
  { key: '2026-09', label: 'September 2026' },
  { key: '2026-08', label: 'August 2026' },
];

export const MONTHLY_PAYOUTS: Record<string, PayoutRecord[]> = {
  '2026-09': [],
  '2026-08': [],
};
