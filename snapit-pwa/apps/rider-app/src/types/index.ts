export type DeliveryStatus = 
  | 'pending'
  | 'accepted'
  | 'picking_up'
  | 'arrived_at_pickup'
  | 'in_transit'
  | 'arrived_at_dropoff'
  | 'delivered'
  | 'cancelled';

export interface OrderItem {
  name: string;
  quantity: number;
  price?: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerAvatar?: string;
  restaurantName: string;
  restaurantAddress: string;
  deliveryAddress: string;
  distanceKm: number;
  estimatedMinutes: number;
  earnings: number;
  items: OrderItem[];
  status: DeliveryStatus;
  otp: string;
  timestamp: string;
  paymentMethod: string;
}

export interface RiderProfile {
  name: string;
  dob: string;
  phone: string;
  altPhone?: string;
  email: string;
  address?: string;
  avatarUrl: string;
  selfieCapturedUrl?: string;
  
  // KYC Documents & Numbers
  aadhaarNumber?: string;
  aadhaarDoc?: string;
  panNumber?: string;
  panDoc?: string;
  dlNumber?: string;
  dlDoc?: string;

  // Financials & Wallet
  walletBalance: number;
  upiId: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;

  // Performance & Status
  rating: number;
  totalDeliveries: number;
  acceptanceRate: number;
  vehicleType: string;
  vehicleNumber: string;
  selectedZone: string;
  isVerified: boolean;
  verificationStep: number; // 1: submitted, 2: reviewing, 3: admin check, 4: approved
}

export interface EarningsSummary {
  today: number;
  todayTarget: number;
  todayDeliveries: number;
  todayTargetDeliveries: number;
  thisWeek: number;
  weekDeliveries: number;
  thisMonth: number;
  monthDeliveries: number;
  baseFare: number;
  incentives: number;
  tips: number;
  dailyTrend: {
    day: string;
    dayShort: string;
    amount: number;
    deliveries: number;
    isToday?: boolean;
  }[];
}

export interface DeliveryZone {
  id: string;
  name: string;
  radius: string;
  demand: 'HIGH' | 'MEDIUM' | 'NORMAL';
  estDailyEarnings: string;
  activeRiders: number;
}

export interface AlertNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'surge' | 'tip' | 'payout' | 'system';
  read: boolean;
  amount?: number;
}
