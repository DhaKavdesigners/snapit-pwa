import {
  WeeklyBarData,
  RecentEarning,
  PayoutRecord,
  WalletSummary,
  EarningsSummaryStats,
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

export const initialPayoutHistory: PayoutRecord[] = [
  {
    id: 'payout-1',
    amount: 1850,
    date: '05 Sep',
    status: 'paid',
  },
  {
    id: 'payout-2',
    amount: 2100,
    date: '01 Sep',
    status: 'paid',
  },
  {
    id: 'payout-3',
    amount: 1620,
    date: '28 Aug',
    status: 'paid',
  },
];

export const initialRecentEarnings: RecentEarning[] = [
  {
    id: 'earning-1',
    orderId: 'SN48291',
    amount: 65,
    distanceKm: 4.8,
    status: 'completed',
    timestamp: 'Today, 04:30 PM',
    restaurantName: 'Biryani Kitchen',
  },
  {
    id: 'earning-2',
    orderId: 'SN48276',
    amount: 82,
    distanceKm: 6.2,
    status: 'completed',
    timestamp: 'Today, 02:15 PM',
    restaurantName: 'Burger Spot',
  },
  {
    id: 'earning-3',
    orderId: 'SN48261',
    amount: 55,
    distanceKm: 3.1,
    status: 'completed',
    timestamp: 'Today, 11:45 AM',
    restaurantName: 'Subway Fresh',
  },
];
