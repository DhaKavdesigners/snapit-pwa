export interface WeeklyBarData {
  day: string;
  dayFull: string;
  amount: number;
  isToday?: boolean;
  deliveries?: number;
}

export interface RecentEarning {
  id: string;
  orderId: string;
  amount: number;
  distanceKm: number;
  status: 'completed';
  timestamp: string;
  restaurantName?: string;
}

export interface PayoutRecord {
  id: string;
  date: string;
  amount: number;
  status: 'Paid';
  monthKey?: string;
}

export interface WalletSummary {
  balance: number;
  nextPayoutAmount: number;
  nextPayoutDate: string;
}

export interface EarningsSummaryStats {
  today: number;
  thisWeek: number;
  thisMonth: number;
  todayDeliveries?: number;
  weekDeliveries?: number;
  monthDeliveries?: number;
}

export interface MonthOption {
  key: string;
  label: string;
}
