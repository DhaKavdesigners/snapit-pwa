import {
  WeeklyBarData,
  PayoutRecord,
  WalletSummary,
  EarningsSummaryStats,
  MonthOption,
} from '@/types/earnings';

export const initialEarningsSummary: EarningsSummaryStats = {
  today: 620,
  thisWeek: 3240,
  thisMonth: 8450,
};

export const initialWeeklyEarnings: WeeklyBarData[] = [
  { day: 'Mon', dayFull: 'Monday', amount: 420 },
  { day: 'Tue', dayFull: 'Tuesday', amount: 580 },
  { day: 'Wed', dayFull: 'Wednesday', amount: 350 },
  { day: 'Thu', dayFull: 'Thursday', amount: 620 },
  { day: 'Fri', dayFull: 'Friday', amount: 740 },
  { day: 'Sat', dayFull: 'Saturday', amount: 890 },
  { day: 'Sun', dayFull: 'Sunday', amount: 620, isToday: true },
];

export const initialWalletData: WalletSummary = {
  balance: 2450,
  nextPayoutAmount: 620,
  nextPayoutDate: '09 Sep',
};

export const MONTH_OPTIONS: MonthOption[] = [
  { key: '2026-09', label: 'September 2026' },
  { key: '2026-08', label: 'August 2026' },
  { key: '2026-07', label: 'July 2026' },
  { key: '2026-06', label: 'June 2026' },
];

export const MONTHLY_PAYOUTS: Record<string, PayoutRecord[]> = {
  '2026-09': [
    { id: 'sep-1', date: '09 Sep', amount: 620, status: 'Paid', monthKey: '2026-09' },
    { id: 'sep-2', date: '02 Sep', amount: 1240, status: 'Paid', monthKey: '2026-09' },
    { id: 'sep-3', date: '26 Aug', amount: 980, status: 'Paid', monthKey: '2026-09' },
    { id: 'sep-4', date: '19 Aug', amount: 760, status: 'Paid', monthKey: '2026-09' },
  ],
  '2026-08': [
    { id: 'aug-1', date: '26 Aug', amount: 980, status: 'Paid', monthKey: '2026-08' },
    { id: 'aug-2', date: '19 Aug', amount: 760, status: 'Paid', monthKey: '2026-08' },
    { id: 'aug-3', date: '12 Aug', amount: 1450, status: 'Paid', monthKey: '2026-08' },
    { id: 'aug-4', date: '05 Aug', amount: 1120, status: 'Paid', monthKey: '2026-08' },
  ],
  '2026-07': [
    { id: 'jul-1', date: '29 Jul', amount: 1320, status: 'Paid', monthKey: '2026-07' },
    { id: 'jul-2', date: '22 Jul', amount: 1180, status: 'Paid', monthKey: '2026-07' },
    { id: 'jul-3', date: '15 Jul', amount: 950, status: 'Paid', monthKey: '2026-07' },
    { id: 'jul-4', date: '08 Jul', amount: 1400, status: 'Paid', monthKey: '2026-07' },
  ],
  '2026-06': [
    { id: 'jun-1', date: '30 Jun', amount: 1050, status: 'Paid', monthKey: '2026-06' },
    { id: 'jun-2', date: '23 Jun', amount: 1280, status: 'Paid', monthKey: '2026-06' },
    { id: 'jun-3', date: '16 Jun', amount: 890, status: 'Paid', monthKey: '2026-06' },
    { id: 'jun-4', date: '09 Jun', amount: 1160, status: 'Paid', monthKey: '2026-06' },
  ],
};

export const allPayoutHistory: PayoutRecord[] = [
  ...MONTHLY_PAYOUTS['2026-09'],
  ...MONTHLY_PAYOUTS['2026-08'].slice(2),
  ...MONTHLY_PAYOUTS['2026-07'],
  ...MONTHLY_PAYOUTS['2026-06'],
];
