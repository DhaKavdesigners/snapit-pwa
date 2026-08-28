// ─── Delivery & Navigation Types ────────────────────────────────────────────
export type DeliveryStatus = 
  | 'pending'
  | 'accepted'
  | 'picking_up'
  | 'arrived_at_pickup'
  | 'in_transit'
  | 'arrived_at_dropoff'
  | 'delivered'
  | 'cancelled';

export type NavigationStage = 'idle' | 'to_shop' | 'at_shop' | 'to_customer' | 'at_customer' | 'delivered';

export interface LocationPoint {
  lat: number;
  lng: number;
  name?: string;
  address?: string;
}

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
  dbStatus?: string;
  shopkeeperHandoverConfirmed?: boolean;
  riderPickupConfirmed?: boolean;
  delivery_pin?: string | number;
  delivery_fee?: number;
  otp: string;
  timestamp: string;
  paymentMethod: string;
  shopLocation?: LocationPoint;
  customerLocation?: LocationPoint;
  riderStartLocation?: LocationPoint;
  navStage?: NavigationStage;
}

// ─── Rider Profile ───────────────────────────────────────────────────────────
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
  completionRate?: number;
  slotReliability?: number;
  onTimeRate?: number;
  vehicleType: string;
  vehicleNumber: string;
  selectedZone: string;
  selectedZoneId?: string;
  lastZoneSwitchTimestamp?: number;
  zoneSwitchHistory?: number[];
  isVerified: boolean;
  verificationStep: number; // 1: submitted, 2: reviewing, 3: admin check, 4: approved
  mpin?: string;
  isAuthenticated?: boolean;
}

// ─── Earnings ────────────────────────────────────────────────────────────────
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

// ─── Zone ────────────────────────────────────────────────────────────────────
export interface DeliveryZone {
  id: string;
  name: string;
  radius: string;
  demand: 'HIGH' | 'MEDIUM' | 'NORMAL';
  estDailyEarnings: string;
  activeRiders: number;
  // Geofence data
  centerLat?: number;
  centerLng?: number;
  radiusMeters?: number;
  // Capacity
  capacity?: number;
  booked?: number;
}

export type ZoneStatus =
  | 'unknown'
  | 'inside'
  | 'outside'
  | 'gps_error'
  | 'permission_denied'
  | 'gps_disabled'
  | 'low_accuracy';

// ─── Slots ───────────────────────────────────────────────────────────────────
export type SlotStatus =
  | 'available'
  | 'booked'
  | 'active'
  | 'completed'
  | 'cancelled'
  | 'missed'
  | 'full'
  | 'waitlisted'
  | 'booking_closed'
  | 'past'
  | 'expiring_soon';

export type DemandLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';

export interface RiderSlot {
  id: string;
  date: string;            // YYYY-MM-DD
  startTime: string;       // HH:mm (24h)
  endTime: string;         // HH:mm (24h)
  startTimestamp: number;  // epoch ms
  endTimestamp: number;    // epoch ms
  zoneId: string;
  zoneName: string;
  status: SlotStatus;
  bookedAt: number | null;
  startedAt: number | null;
  endedAt: number | null;
  extendedFromSlotId: string | null;
  demandLevel: DemandLevel;
  capacity: number;
  bookedCount: number;
  onWaitlist?: boolean;
  ordersFulfilled?: number;
  ordersMissed?: number;
  closesInMinutes?: number;
}

// ─── Break ───────────────────────────────────────────────────────────────────
export type BreakStatus = 'idle' | 'active' | 'grace' | 'completed' | 'emergency';

export interface RiderBreak {
  id: string;
  slotId: string;
  startedAt: number;           // epoch ms
  endedAt: number | null;
  allowedDurationMs: number;
  actualDurationMs: number | null;
  excessDurationMs: number | null;
  status: BreakStatus;
  isEmergency: boolean;
  emergencyReason: string | null;
  gracePeriodEndAt: number | null;
}

// ─── Order Acceptance ────────────────────────────────────────────────────────
export type OrderAcceptanceResponse = 'accepted' | 'declined' | 'timeout';

export type OrderAcceptanceExceptionReason =
  | 'customer_cancelled'
  | 'shop_cancelled'
  | 'duplicate_assignment'
  | 'system_error'
  | 'network_error'
  | 'admin_reassignment'
  | 'outside_zone'
  | 'active_delivery_conflict'
  | 'safety_emergency'
  | 'admin_approved';

export interface OrderAcceptanceEvent {
  id: string;
  orderId: string;
  slotId: string | null;
  assignedAt: number;
  respondedAt: number | null;
  response: OrderAcceptanceResponse;
  countedAsNonAcceptance: boolean;
  exceptionReason: OrderAcceptanceExceptionReason | null;
}

// ─── Slot History ────────────────────────────────────────────────────────────
export interface SlotHistoryEntry {
  slot: RiderSlot;
  onlineMinutes: number;
  breakMinutes: number;
  ordersCount: number;
  acceptanceRate: number;
  earnings: number;
}

// ─── Admin Config ─────────────────────────────────────────────────────────────
export interface AdminSlotConfig {
  slotDurationMinutes: number;
  operatingHourStart: number;   // hour 0–23
  operatingHourEnd: number;     // hour 0–23
  bookingCutoffMinutes: number;
  earlyOnlineWindowMinutes: number;
  maxConsecutiveSlots: number;
  extensionEnabled: boolean;
  waitlistEnabled: boolean;
}

export interface AdminBreakConfig {
  allowedBreakMinutes: number;
  gracePeriodMinutes: number;
  maxBreaksPerSlot: number;
  emergencyBreakEnabled: boolean;
  excessBreakPolicy: 'record_only' | 'warn' | 'charge';
}

export interface AdminOrderAcceptanceConfig {
  acceptanceTimeoutSeconds: number;
  warning1Threshold: number;
  warning2Threshold: number;
  maxNonAcceptances: number;
  policyOnThreshold: 'warn' | 'pause' | 'charge' | 'review';
  pauseDurationMinutes: number;
  validExceptionReasons: OrderAcceptanceExceptionReason[];
}

export interface AdminConfig {
  slot: AdminSlotConfig;
  break: AdminBreakConfig;
  orderAcceptance: AdminOrderAcceptanceConfig;
}

// ─── Alerts ──────────────────────────────────────────────────────────────────
export type AlertNotificationType =
  | 'surge'
  | 'tip'
  | 'payout'
  | 'system'
  | 'slot_booked'
  | 'slot_reminder'
  | 'slot_active'
  | 'slot_ending'
  | 'slot_ended'
  | 'slot_extended'
  | 'slot_cancelled'
  | 'zone_entered'
  | 'zone_exited'
  | 'zone_required'
  | 'break_started'
  | 'break_ending'
  | 'break_exceeded'
  | 'break_emergency'
  | 'acceptance_warning'
  | 'acceptance_threshold'
  | 'policy_action'
  | 'online_enabled'
  | 'online_disabled'
  | 'waitlist_available';

export interface AlertNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: AlertNotificationType;
  read: boolean;
  amount?: number;
  slotId?: string;
  priority?: 'low' | 'normal' | 'high' | 'critical';
  actionLabel?: string;
  actionRoute?: string;
}
