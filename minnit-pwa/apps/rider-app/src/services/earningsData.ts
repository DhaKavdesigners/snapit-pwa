import {
  WeeklyBarData,
  PayoutRecord,
  WalletSummary,
  EarningsSummaryStats,
  MonthOption,
} from '@/types/earnings';

export const initialEarningsSummary: EarningsSummaryStats = {
  today: 0,
  thisWeek: 0,
  thisMonth: 0,
};

export const getNextSundayDate = (): string => {
  const now = new Date();
  const day = now.getDay(); // 0 is Sunday
  const daysUntilSunday = (7 - day) % 7 || 7;
  const nextSunday = new Date(now);
  nextSunday.setDate(now.getDate() + daysUntilSunday);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${String(nextSunday.getDate()).padStart(2, '0')} ${months[nextSunday.getMonth()]}`;
};

export const getRealWeeklyEarnings = (
  todayEarnings: number = 0,
  ordersHistory: any[] = []
): WeeklyBarData[] => {
  const days: { day: string; dayFull: string; dayIndex: number }[] = [
    { day: 'Mon', dayFull: 'Monday', dayIndex: 1 },
    { day: 'Tue', dayFull: 'Tuesday', dayIndex: 2 },
    { day: 'Wed', dayFull: 'Wednesday', dayIndex: 3 },
    { day: 'Thu', dayFull: 'Thursday', dayIndex: 4 },
    { day: 'Fri', dayFull: 'Friday', dayIndex: 5 },
    { day: 'Sat', dayFull: 'Saturday', dayIndex: 6 },
    { day: 'Sun', dayFull: 'Sunday', dayIndex: 0 },
  ];

  const currentDayIndex = new Date().getDay();

  // Aggregate orders by day of week
  const dayEarningsMap: Record<number, { amount: number; deliveries: number }> = {};
  days.forEach((d) => {
    dayEarningsMap[d.dayIndex] = { amount: 0, deliveries: 0 };
  });

  if (ordersHistory && ordersHistory.length > 0) {
    ordersHistory.forEach((o) => {
      const timeStr = o.completedAt || o.timestamp || o.createdAt || o.updatedAt;
      const earning = Number(o.earnings || o.delivery_fee || 30);
      if (timeStr) {
        const d = new Date(timeStr);
        if (!isNaN(d.getTime())) {
          const dayIdx = d.getDay();
          if (dayEarningsMap[dayIdx]) {
            dayEarningsMap[dayIdx].amount += earning;
            dayEarningsMap[dayIdx].deliveries += 1;
          }
        }
      }
    });
  }

  // Ensure current day has at least todayEarnings
  if (dayEarningsMap[currentDayIndex]) {
    dayEarningsMap[currentDayIndex].amount = Math.max(
      dayEarningsMap[currentDayIndex].amount,
      todayEarnings
    );
  }

  return days.map((d) => {
    const isToday = d.dayIndex === currentDayIndex;
    const stat = dayEarningsMap[d.dayIndex] || { amount: 0, deliveries: 0 };
    return {
      day: d.day,
      dayFull: d.dayFull,
      amount: stat.amount,
      deliveries: stat.deliveries,
      isToday,
    };
  });
};

export const initialWeeklyEarnings: WeeklyBarData[] = getRealWeeklyEarnings(0);

export const initialWalletData: WalletSummary = {
  balance: 0,
  nextPayoutAmount: 0,
  nextPayoutDate: getNextSundayDate(),
};

export const MONTH_OPTIONS: MonthOption[] = [
  { key: '2026-09', label: 'September 2026' },
  { key: '2026-08', label: 'August 2026' },
];

export const MONTHLY_PAYOUTS: Record<string, PayoutRecord[]> = {
  '2026-09': [],
  '2026-08': [],
};

export const allPayoutHistory: PayoutRecord[] = [];
