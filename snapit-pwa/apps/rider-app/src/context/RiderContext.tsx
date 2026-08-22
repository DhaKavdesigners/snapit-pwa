'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  ReactNode,
} from 'react';
import {
  RiderProfile,
  Order,
  EarningsSummary,
  DeliveryZone,
  AlertNotification,
  DeliveryStatus,
  NavigationStage,
  // New types
  AdminConfig,
  RiderSlot,
  RiderBreak,
  OrderAcceptanceEvent,
  OrderAcceptanceResponse,
  OrderAcceptanceExceptionReason,
  ZoneStatus,
} from '@/types';
import { DEFAULT_ADMIN_CONFIG } from '@/services/adminConfig';
import {
  generateDailySlots,
  getTodayDateString,
  findNextSlot,
  buildExtendedSlot,
  isSlotOnlineReady,
  timeToTodayMs,
} from '@/services/slotService';
import {
  checkZoneStatus,
  startWatchingZone,
  stopWatchingZone,
  setMockLocationConfig,
  getMockLocationConfig,
} from '@/services/zoneService';
import {
  getNow,
  getNowDate,
  setMockTimeConfig,
  getMockTimeConfig,
  resetMockEnvironment as resetMockEnv,
  TestAppMode,
  setTestMode as setTestModeService,
  getTestMode,
} from '@/services/mockService';
import {
  createSlotBookedAlert,
  createSlotReminderAlert,
  createSlotActiveAlert,
  createSlotEndingAlert,
  createSlotEndedAlert,
  createSlotExtendedAlert,
  createSlotCancelledAlert,
  createZoneEnteredAlert,
  createZoneExitedAlert,
  createBreakStartedAlert,
  createBreakEndingAlert,
  createBreakExceededAlert,
  createBreakEmergencyAlert,
  createAcceptanceWarningAlert,
  createWaitlistAvailableAlert,
} from '@/services/notificationService';

// ─── Context Type ─────────────────────────────────────────────────────────────

interface CanGoOnlineResult {
  canGo: boolean;
  reason: string;
}

interface RiderContextType {
  // ── Existing ──
  rider: RiderProfile;
  isOnline: boolean;
  activeOrder: Order | null;
  incomingOrder: Order | null;
  ordersHistory: Order[];
  earnings: EarningsSummary;
  zones: DeliveryZone[];
  alerts: AlertNotification[];
  desktopFrame: boolean;
  toggleOnline: () => void;
  toggleDesktopFrame: () => void;
  setOnlineStatus: (status: boolean) => void;
  acceptIncomingOrder: () => void;
  declineIncomingOrder: () => void;
  advanceActiveOrderStatus: () => void;
  setActiveOrderStatus: (status: DeliveryStatus) => void;
  startNavigation: () => void;
  markOrderPickedUp: () => void;
  setNavStage: (stage: NavigationStage) => void;
  completeDeliveryWithOtp: (otp: string) => boolean;
  triggerMockOrder: () => void;
  updateRiderProfile: (updates: Partial<RiderProfile>) => void;
  simulateApproval: () => void;
  resetOnboarding: () => void;
  transferWalletToBank: (amount: number) => boolean;
  markAlertAsRead: (id: string) => void;
  // ── New ──
  adminConfig: AdminConfig;
  slots: RiderSlot[];
  activeSlot: RiderSlot | null;
  upcomingSlot: RiderSlot | null;
  riderBreak: RiderBreak | null;
  zoneStatus: ZoneStatus;
  gpsCoords: { lat: number; lng: number } | null;
  orderAcceptanceEvents: OrderAcceptanceEvent[];
  nonAcceptanceCount: number;
  bookSlot: (slotId: string, zoneId: string, zoneName: string) => void;
  cancelSlot: (slotId: string) => void;
  extendSlot: (currentSlotId: string, nextSlotId: string) => void;
  addSlotToWaitlist: (slotId: string) => void;
  startBreak: () => void;
  endBreak: () => void;
  startEmergencyBreak: (reason: string) => void;
  canGoOnline: () => CanGoOnlineResult;
  recordOrderAcceptance: (
    orderId: string,
    response: OrderAcceptanceResponse,
    exceptionReason?: OrderAcceptanceExceptionReason
  ) => void;
  refreshZoneStatus: () => void;
  refreshSlots: () => void;
  // Dev Mock Location & Time & Mode
  testMode: TestAppMode;
  setTestMode: (mode: TestAppMode) => void;
  isMockLocationEnabled: boolean;
  mockZoneId: string | null;
  enableMockLocation: (zoneId?: string, customCoords?: { lat: number; lng: number }) => void;
  disableMockLocation: () => void;
  setMockZone: (zoneId: string) => void;
  isMockTimeEnabled: boolean;
  mockTimestamp: number | null;
  enableMockTime: (timeStr: string, dateStr?: string) => void;
  disableMockTime: () => void;
  setMockTimePreset: (preset: 'booked_slot_start' | 'active_slot' | 'slot_expiry' | 'cutoff_passed' | 'morning_10am') => void;
  resetTestEnvironment: () => void;
}

// ─── Default Data ─────────────────────────────────────────────────────────────

const defaultRider: RiderProfile = {
  name: 'Rahul Sharma',
  dob: '1998-05-14',
  phone: '+91 98765 43210',
  altPhone: '+91 98111 22334',
  email: 'rahul.sharma@snapit.in',
  address: 'Flat 302, Green Meadows, 4th Cross, Indiranagar, Bengaluru, 560038',
  avatarUrl:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuC-PEiTgWViD1ovXWhH1B1TQbMaWamoTZBv9VbCDabgGy61BlhUVTtyCaQqeI5WbDHOFao2v1A6tBhc7gUUm_4Kw7IjE4g7U93BvPxpBCwFcpkL3WKodfrio1p1RyKPuUw3qMZ3ehzSz5_NUemOI3BVvFqRDj3EdyCQfpGH2eWP1FbJCAvX16Yy7ZGqOdSYHx44o2sVTKEs0VZ56ZU7EjUIFOEJHw_qX6azzfjVcPoCJ7EDvRR1lx43EA',
  selfieCapturedUrl: '',
  aadhaarNumber: '4829-1029-8921',
  aadhaarDoc: 'aadhaar_front_back.pdf',
  panNumber: 'ABCDE1234F',
  panDoc: 'pan_card.jpg',
  dlNumber: 'KA03-2020-0089124',
  dlDoc: 'driving_license.jpg',
  walletBalance: 2450,
  upiId: 'rahul.k@okicici',
  bankName: 'HDFC Bank Ltd',
  accountNumber: '50100492819281',
  ifscCode: 'HDFC0001234',
  rating: 4.9,
  totalDeliveries: 1420,
  acceptanceRate: 98,
  completionRate: 97,
  slotReliability: 96,
  onTimeRate: 94,
  vehicleType: 'Electric Scooter (Ather 450X)',
  vehicleNumber: 'KA 03 EQ 8821',
  selectedZone: 'Downtown Central',
  selectedZoneId: 'zone-1',
  isVerified: true,
  verificationStep: 4,
};

const initialIncomingOrder: Order = {
  id: 'req-101',
  orderNumber: 'SN12345',
  customerName: 'Rahul Sharma',
  customerPhone: '+91 91234 56789',
  customerAvatar:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBQm3F-EF8KMdfUn1CQ9_0AUu0c5Anids2usYM_zIsXx7e0kAQfYRu8ya1d-UFWak5O28XmbayOqGMxNHtc59lxyiIwhncjrY8XDG12i2tRQ5ZZnKkH5mEp0s_f52f09hRiNQGIcV2D4704CLIlRGfnLt7iMMRjWFYILDYbh8oZVpMKr6lbRp4SFioMcFer9PvsJgqi85zB3_zM1EKPWzOuaozxNddoYAjVKl88_tl8Ka9Dcu8_200q0w',
  restaurantName: 'Spice Route Restaurant',
  restaurantAddress: '124 Culinary Blvd, Indiranagar, Bengaluru',
  deliveryAddress: 'Apt 4B, Serenity Towers, Domlur, Bengaluru',
  distanceKm: 2.5,
  estimatedMinutes: 8,
  earnings: 45,
  items: [
    { name: 'Chicken Tikka Masala', quantity: 1, price: 280 },
    { name: 'Garlic Naan', quantity: 2, price: 90 },
    { name: 'Mango Lassi', quantity: 1, price: 80 },
  ],
  status: 'pending',
  otp: '1234',
  timestamp: 'Just now',
  paymentMethod: 'Prepaid UPI',
  shopLocation: { lat: 12.9785, lng: 77.645, name: 'Spice Route Restaurant', address: '124 Culinary Blvd, Indiranagar, Bengaluru' },
  customerLocation: { lat: 12.963, lng: 77.638, name: 'Rahul Sharma', address: 'Apt 4B, Serenity Towers, Domlur, Bengaluru' },
  riderStartLocation: { lat: 12.9716, lng: 77.6412 },
  navStage: 'idle',
};

const initialEarnings: EarningsSummary = {
  today: 2450,
  todayTarget: 3000,
  todayDeliveries: 14,
  todayTargetDeliveries: 20,
  thisWeek: 14200,
  weekDeliveries: 42,
  thisMonth: 45800,
  monthDeliveries: 128,
  baseFare: 1850,
  incentives: 450,
  tips: 150,
  dailyTrend: [
    { day: 'Monday', dayShort: 'M', amount: 1650, deliveries: 10 },
    { day: 'Tuesday', dayShort: 'T', amount: 2100, deliveries: 12 },
    { day: 'Wednesday', dayShort: 'W', amount: 2300, deliveries: 13 },
    { day: 'Thursday', dayShort: 'T', amount: 2450, deliveries: 14, isToday: true },
    { day: 'Friday', dayShort: 'F', amount: 0, deliveries: 0 },
    { day: 'Saturday', dayShort: 'S', amount: 0, deliveries: 0 },
    { day: 'Sunday', dayShort: 'S', amount: 0, deliveries: 0 },
  ],
};

const availableZones: DeliveryZone[] = [
  {
    id: 'zone-1',
    name: 'Downtown Central',
    radius: '5km radius',
    demand: 'HIGH',
    estDailyEarnings: '₹800 - ₹1,200/day',
    activeRiders: 18,
    centerLat: 12.9716,
    centerLng: 77.6412,
    radiusMeters: 5000,
    capacity: 20,
    booked: 16,
  },
  {
    id: 'zone-2',
    name: 'North Tech Park',
    radius: '8km radius',
    demand: 'HIGH',
    estDailyEarnings: '₹600 - ₹900/day',
    activeRiders: 12,
    centerLat: 12.9698,
    centerLng: 77.7499,
    radiusMeters: 8000,
    capacity: 15,
    booked: 10,
  },
  {
    id: 'zone-3',
    name: 'South Suburbs',
    radius: '12km radius',
    demand: 'NORMAL',
    estDailyEarnings: '₹500 - ₹800/day',
    activeRiders: 8,
    centerLat: 12.9289,
    centerLng: 77.5838,
    radiusMeters: 12000,
    capacity: 12,
    booked: 5,
  },
];

const initialAlerts: AlertNotification[] = [
  {
    id: 'alert-1',
    title: '⚡ Surge Bonus Active!',
    message: 'High demand in Downtown Central! Earn +₹30 extra per delivery until 10:00 PM.',
    time: '5m ago',
    type: 'surge',
    read: false,
    amount: 30,
  },
  {
    id: 'alert-2',
    title: '🎉 Customer Tip Received',
    message: 'Customer Rahul Sharma added a ₹50 tip for on-time delivery.',
    time: '32m ago',
    type: 'tip',
    read: false,
    amount: 50,
  },
  {
    id: 'alert-3',
    title: '🎯 Weekly Milestone Reached',
    message: 'Completed 40 deliveries this week. ₹500 incentive bonus unlocked!',
    time: '2h ago',
    type: 'system',
    read: true,
    amount: 500,
  },
];

const completedOrdersSeed: Order[] = [
  {
    id: 'order-100',
    orderNumber: 'SN12340',
    customerName: 'Pooja Hegde',
    customerPhone: '+91 98888 11111',
    restaurantName: 'Urban Gourmet Bowl',
    restaurantAddress: 'Shop 12, High Street Galleria',
    deliveryAddress: 'Tower 3, Infinity Heights',
    distanceKm: 3.2,
    estimatedMinutes: 12,
    earnings: 55,
    items: [
      { name: 'Avocado Quinoa Bowl', quantity: 1, price: 320 },
      { name: 'Cold Pressed Orange Juice', quantity: 1, price: 120 },
    ],
    status: 'delivered',
    otp: '5678',
    timestamp: '1 hour ago',
    paymentMethod: 'Online Paid',
  },
  {
    id: 'order-99',
    orderNumber: 'SN12338',
    customerName: 'Vikram Malhotra',
    customerPhone: '+91 97777 22222',
    restaurantName: 'Burger Craft Co.',
    restaurantAddress: 'Corner Street, Bandra West',
    deliveryAddress: 'Bungalow 7, Pali Hill',
    distanceKm: 1.8,
    estimatedMinutes: 7,
    earnings: 40,
    items: [
      { name: 'Double Truffle Smash Burger', quantity: 2, price: 540 },
      { name: 'Peri Peri Fries', quantity: 1, price: 110 },
    ],
    status: 'delivered',
    otp: '9912',
    timestamp: '2 hours ago',
    paymentMethod: 'Prepaid Card',
  },
];

// ─── Context ──────────────────────────────────────────────────────────────────

const RiderContext = createContext<RiderContextType | undefined>(undefined);

export const RiderProvider = ({ children }: { children: ReactNode }) => {
  // ── Existing state ──
  const [rider, setRider] = useState<RiderProfile>(defaultRider);
  const [isOnline, setIsOnline] = useState<boolean>(false); // Default offline — slot gate
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [incomingOrder, setIncomingOrder] = useState<Order | null>(null);
  const [ordersHistory, setOrdersHistory] = useState<Order[]>(completedOrdersSeed);
  const [earnings, setEarnings] = useState<EarningsSummary>(initialEarnings);
  const [zones] = useState<DeliveryZone[]>(availableZones);
  const [alerts, setAlerts] = useState<AlertNotification[]>(initialAlerts);
  const [desktopFrame, setDesktopFrame] = useState<boolean>(false);

  // ── New state ──
  const [adminConfig] = useState<AdminConfig>(DEFAULT_ADMIN_CONFIG);
  const [bookedSlotIds, setBookedSlotIds] = useState<string[]>([]);
  const [slots, setSlots] = useState<RiderSlot[]>([]);
  const [activeSlot, setActiveSlot] = useState<RiderSlot | null>(null);
  const [upcomingSlot, setUpcomingSlot] = useState<RiderSlot | null>(null);
  const [riderBreak, setRiderBreak] = useState<RiderBreak | null>(null);
  const [zoneStatus, setZoneStatus] = useState<ZoneStatus>('unknown');
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [orderAcceptanceEvents, setOrderAcceptanceEvents] = useState<OrderAcceptanceEvent[]>([]);
  const [nonAcceptanceCount, setNonAcceptanceCount] = useState<number>(0);

  // ── Refs for notification de-duplication ──
  const sentReminderRef = useRef<Set<string>>(new Set());
  const sentEndingRef = useRef<Set<string>>(new Set());
  const sentActiveRef = useRef<Set<string>>(new Set());
  const breakWarn5Ref = useRef<Set<string>>(new Set());
  const breakWarn1Ref = useRef<Set<string>>(new Set());
  const breakExceededRef = useRef<Set<string>>(new Set());
  const prevZoneStatusRef = useRef<ZoneStatus>('unknown');

  // ─── LocalStorage hydration ────────────────────────────────────────────────

  useEffect(() => {
    try {
      const savedRider = localStorage.getItem('snapit_rider_profile_v2');
      if (savedRider) setRider(JSON.parse(savedRider));

      const savedOnline = localStorage.getItem('snapit_online_status_v2');
      if (savedOnline !== null) setIsOnline(JSON.parse(savedOnline));

      const savedActive = localStorage.getItem('snapit_active_order_v2');
      if (savedActive) setActiveOrder(JSON.parse(savedActive));

      const savedEarnings = localStorage.getItem('snapit_earnings_v2');
      if (savedEarnings) setEarnings(JSON.parse(savedEarnings));

      const savedBookedIds = localStorage.getItem('snapit_booked_slot_ids_v1');
      if (savedBookedIds) setBookedSlotIds(JSON.parse(savedBookedIds));

      const savedBreak = localStorage.getItem('snapit_rider_break_v1');
      if (savedBreak) setRiderBreak(JSON.parse(savedBreak));

      const savedAcceptance = localStorage.getItem('snapit_acceptance_events_v1');
      if (savedAcceptance) setOrderAcceptanceEvents(JSON.parse(savedAcceptance));

      const savedNonAcceptance = localStorage.getItem('snapit_non_acceptance_count_v1');
      if (savedNonAcceptance) setNonAcceptanceCount(JSON.parse(savedNonAcceptance));
    } catch (e) {
      console.warn('Could not read local storage', e);
    }
  }, []);

  // ─── LocalStorage persistence ──────────────────────────────────────────────

  useEffect(() => {
    try {
      localStorage.setItem('snapit_rider_profile_v2', JSON.stringify(rider));
      localStorage.setItem('snapit_online_status_v2', JSON.stringify(isOnline));
      localStorage.setItem('snapit_active_order_v2', JSON.stringify(activeOrder));
      localStorage.setItem('snapit_earnings_v2', JSON.stringify(earnings));
      localStorage.setItem('snapit_booked_slot_ids_v1', JSON.stringify(bookedSlotIds));
      localStorage.setItem('snapit_rider_break_v1', JSON.stringify(riderBreak));
      localStorage.setItem('snapit_acceptance_events_v1', JSON.stringify(orderAcceptanceEvents));
      localStorage.setItem('snapit_non_acceptance_count_v1', JSON.stringify(nonAcceptanceCount));
    } catch (e) {
      console.warn('Could not write local storage', e);
    }
  }, [rider, isOnline, activeOrder, earnings, bookedSlotIds, riderBreak, orderAcceptanceEvents, nonAcceptanceCount]);

  // ─── Slot Generation & Active/Upcoming Tracking ────────────────────────────

  const refreshSlots = useCallback(() => {
    const selectedZone = zones.find((z) => z.id === (rider.selectedZoneId || 'zone-1')) || zones[0];
    const generated = generateDailySlots(
      adminConfig.slot,
      bookedSlotIds,
      selectedZone.id,
      selectedZone.name
    );
    setSlots(generated);

    const now = getNow();
    const earlyWindow = adminConfig.slot.earlyOnlineWindowMinutes * 60000;

    // Active slot: currently within start–end window (including early window)
    const active = generated.find(
      (s) =>
        bookedSlotIds.includes(s.id) &&
        now >= s.startTimestamp - earlyWindow &&
        now < s.endTimestamp
    ) || null;
    setActiveSlot(active);

    // Upcoming slot: next booked slot that hasn't started early window yet
    const upcoming = generated.find(
      (s) =>
        bookedSlotIds.includes(s.id) &&
        now < s.startTimestamp - earlyWindow
    ) || null;
    setUpcomingSlot(upcoming);
  }, [bookedSlotIds, adminConfig.slot, zones, rider.selectedZoneId]);

  useEffect(() => {
    refreshSlots();
  }, [refreshSlots]);

  // ─── Slot Timer: Notifications + Auto-Offline ──────────────────────────────

  useEffect(() => {
    const interval = setInterval(() => {
      refreshSlots();

      const now = getNow();
      const selectedZone = zones.find((z) => z.id === (rider.selectedZoneId || 'zone-1')) || zones[0];
      const generated = generateDailySlots(adminConfig.slot, bookedSlotIds, selectedZone.id, selectedZone.name);

      for (const slot of generated) {
        if (!bookedSlotIds.includes(slot.id)) continue;

        const startsIn = slot.startTimestamp - now;
        const endsIn = slot.endTimestamp - now;

        // 10-min pre-slot reminder
        if (startsIn > 0 && startsIn <= 10 * 60000 && !sentReminderRef.current.has(slot.id)) {
          sentReminderRef.current.add(slot.id);
          addAlert(createSlotReminderAlert(slot));
        }

        // Slot became active
        if (
          startsIn <= 0 &&
          endsIn > 0 &&
          !sentActiveRef.current.has(slot.id)
        ) {
          sentActiveRef.current.add(slot.id);
          addAlert(createSlotActiveAlert(slot));
        }

        // 10-min slot ending warning
        if (endsIn > 0 && endsIn <= 10 * 60000 && !sentEndingRef.current.has(slot.id)) {
          sentEndingRef.current.add(slot.id);
          const nextSlot = findNextSlot(slot, generated);
          const nextAvailable = nextSlot !== null && nextSlot.status === 'available';
          addAlert(createSlotEndingAlert(slot, nextAvailable));
        }

        // Slot expired
        if (endsIn <= 0 && slot.status !== 'completed') {
          if (isOnline && !activeOrder) {
            setIsOnline(false);
            addAlert(createSlotEndedAlert(slot));
          } else if (isOnline && activeOrder) {
            // Has active order — stay online until complete, don't assign new
            // Mark slot as completed logic would happen on order completion
          }
        }
      }
    }, 30000); // poll every 30 seconds

    return () => clearInterval(interval);
  }, [bookedSlotIds, adminConfig.slot, isOnline, activeOrder, zones, rider.selectedZoneId]);

  // ─── Break Timer: Warnings ─────────────────────────────────────────────────

  useEffect(() => {
    if (!riderBreak || riderBreak.status === 'completed' || riderBreak.endedAt) return;

    const interval = setInterval(() => {
      const now = getNow();
      const elapsed = now - riderBreak.startedAt;
      const allowedMs = adminConfig.break.allowedBreakMinutes * 60000;
      const graceMs = adminConfig.break.gracePeriodMinutes * 60000;

      // 5-min remaining warning
      if (elapsed >= (allowedMs - 5 * 60000) && !breakWarn5Ref.current.has(riderBreak.id)) {
        breakWarn5Ref.current.add(riderBreak.id);
        addAlert(createBreakEndingAlert(5));
      }

      // 1-min remaining warning
      if (elapsed >= (allowedMs - 60000) && !breakWarn1Ref.current.has(riderBreak.id)) {
        breakWarn1Ref.current.add(riderBreak.id);
        addAlert(createBreakEndingAlert(1));
      }

      // Allowance ended
      if (elapsed >= allowedMs && !breakExceededRef.current.has(riderBreak.id)) {
        breakExceededRef.current.add(riderBreak.id);
        addAlert(createBreakExceededAlert());
        setRiderBreak((prev) =>
          prev ? { ...prev, status: 'grace', gracePeriodEndAt: riderBreak.startedAt + allowedMs + graceMs } : prev
        );
      }

      // Grace period ended — auto-resume
      if (elapsed >= allowedMs + graceMs) {
        setRiderBreak((prev) =>
          prev
            ? {
                ...prev,
                endedAt: riderBreak.startedAt + allowedMs + graceMs,
                actualDurationMs: allowedMs + graceMs,
                excessDurationMs: graceMs,
                status: 'completed',
              }
            : prev
        );
        setIsOnline(true);
        clearInterval(interval);
      }
    }, 10000); // check every 10s

    return () => clearInterval(interval);
  }, [riderBreak, adminConfig.break]);

  // ─── Zone Watching ─────────────────────────────────────────────────────────

  const refreshZoneStatus = useCallback(async () => {
    const selectedZone = zones.find((z) => z.id === (rider.selectedZoneId || 'zone-1')) || zones[0];
    const result = await checkZoneStatus(selectedZone);
    const newStatus = result.status;

    setZoneStatus(newStatus);

    // Zone transition alerts
    if (prevZoneStatusRef.current !== 'inside' && newStatus === 'inside') {
      addAlert(createZoneEnteredAlert(selectedZone.name));
    } else if (prevZoneStatusRef.current === 'inside' && newStatus === 'outside') {
      addAlert(createZoneExitedAlert(selectedZone.name));
      // Auto-offline if outside zone
      if (isOnline && !activeOrder) {
        setIsOnline(false);
      }
    }
    prevZoneStatusRef.current = newStatus;
  }, [zones, rider.selectedZoneId, isOnline, activeOrder]);

  useEffect(() => {
    const selectedZone = zones.find((z) => z.id === (rider.selectedZoneId || 'zone-1')) || zones[0];

    startWatchingZone(selectedZone, (result) => {
      const newStatus = result.status;
      if (result.status === 'inside') {
        setGpsCoords(null); // actual coords not stored for privacy but status is tracked
      }
      setZoneStatus((prev) => {
        if (prev !== 'inside' && newStatus === 'inside') {
          addAlert(createZoneEnteredAlert(selectedZone.name));
        } else if (prev === 'inside' && newStatus === 'outside') {
          addAlert(createZoneExitedAlert(selectedZone.name));
        }
        prevZoneStatusRef.current = newStatus;
        return newStatus;
      });
    });

    return () => {
      stopWatchingZone();
    };
  }, [rider.selectedZoneId, zones]);

  // ─── Dev Test Mode ─────────────────────────────────────────────────────────

  const [testMode, setTestModeState] = useState<TestAppMode>(getTestMode());

  const setTestMode = useCallback(
    (mode: TestAppMode) => {
      if (process.env.NODE_ENV !== 'development') return;
      setTestModeState(mode);
      setTestModeService(mode);
      if (mode === 'driver') {
        setIsMockLocationEnabled(false);
        setMockZoneId(null);
        setIsMockTimeEnabled(false);
        setMockTimestamp(null);
        setGpsCoords(null);
      }
      setTimeout(() => {
        refreshSlots();
        refreshZoneStatus();
      }, 50);
    },
    [refreshSlots, refreshZoneStatus]
  );

  // ─── Dev Mock Location ─────────────────────────────────────────────────────

  const [isMockLocationEnabled, setIsMockLocationEnabled] = useState<boolean>(false);
  const [mockZoneId, setMockZoneId] = useState<string | null>(null);

  const enableMockLocation = useCallback(
    (zoneId?: string, customCoords?: { lat: number; lng: number }) => {
      if (process.env.NODE_ENV !== 'development') return;
      const targetZoneId = zoneId || rider.selectedZoneId || 'zone-1';
      const targetZone = zones.find((z) => z.id === targetZoneId) || zones[0];
      const coords = customCoords || {
        lat: targetZone.centerLat ?? 12.9716,
        lng: targetZone.centerLng ?? 77.6412,
      };
      setIsMockLocationEnabled(true);
      setMockZoneId(targetZoneId);
      setGpsCoords(coords);
      setMockLocationConfig({
        enabled: true,
        coords,
        zoneId: targetZoneId,
      });
    },
    [rider.selectedZoneId, zones]
  );

  const disableMockLocation = useCallback(() => {
    setIsMockLocationEnabled(false);
    setMockZoneId(null);
    setGpsCoords(null);
    setMockLocationConfig({
      enabled: false,
      coords: null,
    });
    refreshZoneStatus();
  }, [refreshZoneStatus]);

  const setMockZone = useCallback(
    (zoneId: string) => {
      if (process.env.NODE_ENV !== 'development') return;
      enableMockLocation(zoneId);
    },
    [enableMockLocation]
  );

  // ─── Dev Mock Time ─────────────────────────────────────────────────────────

  const [isMockTimeEnabled, setIsMockTimeEnabled] = useState<boolean>(false);
  const [mockTimestamp, setMockTimestamp] = useState<number | null>(null);

  const enableMockTime = useCallback(
    (timeStr: string, dateStr?: string) => {
      if (process.env.NODE_ENV !== 'development') return;
      const targetDate = dateStr || getTodayDateString();
      const ts = timeToTodayMs(timeStr, targetDate);
      setIsMockTimeEnabled(true);
      setMockTimestamp(ts);
      setMockTimeConfig({
        enabled: true,
        mockTimestamp: ts,
        simulatedTimeStr: timeStr,
        simulatedDateStr: targetDate,
      });
      setTimeout(refreshSlots, 50);
    },
    [refreshSlots]
  );

  const disableMockTime = useCallback(() => {
    setIsMockTimeEnabled(false);
    setMockTimestamp(null);
    setMockTimeConfig({
      enabled: false,
      mockTimestamp: null,
    });
    setTimeout(refreshSlots, 50);
  }, [refreshSlots]);

  const setMockTimePreset = useCallback(
    (preset: 'booked_slot_start' | 'active_slot' | 'slot_expiry' | 'cutoff_passed' | 'morning_10am') => {
      if (process.env.NODE_ENV !== 'development') return;
      const today = getTodayDateString();

      if (preset === 'morning_10am') {
        enableMockTime('10:00', today);
        return;
      }

      const selectedZone = zones.find((z) => z.id === (rider.selectedZoneId || 'zone-1')) || zones[0];
      const allSlots = generateDailySlots(adminConfig.slot, bookedSlotIds, selectedZone.id, selectedZone.name);
      const booked = allSlots.find((s) => bookedSlotIds.includes(s.id)) || allSlots[2] || allSlots[0];

      if (!booked) {
        enableMockTime('10:00', today);
        return;
      }

      if (preset === 'booked_slot_start') {
        const targetTs = booked.startTimestamp - 15 * 60000;
        const d = new Date(targetTs);
        const h = d.getHours().toString().padStart(2, '0');
        const m = d.getMinutes().toString().padStart(2, '0');
        enableMockTime(`${h}:${m}`, today);
      } else if (preset === 'active_slot') {
        const targetTs = booked.startTimestamp + 30 * 60000;
        const d = new Date(targetTs);
        const h = d.getHours().toString().padStart(2, '0');
        const m = d.getMinutes().toString().padStart(2, '0');
        enableMockTime(`${h}:${m}`, today);
      } else if (preset === 'slot_expiry') {
        const targetTs = booked.endTimestamp + 5 * 60000;
        const d = new Date(targetTs);
        const h = d.getHours().toString().padStart(2, '0');
        const m = d.getMinutes().toString().padStart(2, '0');
        enableMockTime(`${h}:${m}`, today);
      } else if (preset === 'cutoff_passed') {
        const targetTs = booked.startTimestamp - 15 * 60000;
        const d = new Date(targetTs);
        const h = d.getHours().toString().padStart(2, '0');
        const m = d.getMinutes().toString().padStart(2, '0');
        enableMockTime(`${h}:${m}`, today);
      }
    },
    [enableMockTime, zones, rider.selectedZoneId, adminConfig.slot, bookedSlotIds]
  );

  const resetTestEnvironment = useCallback(() => {
    disableMockTime();
    disableMockLocation();
    resetMockEnv();
    setTimeout(() => {
      refreshSlots();
      refreshZoneStatus();
    }, 100);
  }, [disableMockTime, disableMockLocation, refreshSlots, refreshZoneStatus]);

  // ─── Helpers ───────────────────────────────────────────────────────────────

  const addAlert = (alert: AlertNotification) => {
    setAlerts((prev) => [alert, ...prev]);
  };

  // ─── Slot Methods ──────────────────────────────────────────────────────────

  const bookSlot = (slotId: string, zoneId: string, zoneName: string) => {
    setBookedSlotIds((prev) => {
      if (prev.includes(slotId)) return prev;
      const updated = [...prev, slotId];
      return updated;
    });
    const slot = slots.find((s) => s.id === slotId);
    if (slot) {
      addAlert(createSlotBookedAlert({ ...slot, zoneId, zoneName }));
    }
    setTimeout(refreshSlots, 100);
  };

  const cancelSlot = (slotId: string) => {
    const slot = slots.find((s) => s.id === slotId);
    setBookedSlotIds((prev) => prev.filter((id) => id !== slotId));
    if (slot) {
      addAlert(createSlotCancelledAlert(slot));
    }
    // If this was the active slot, go offline
    if (activeSlot?.id === slotId && !activeOrder) {
      setIsOnline(false);
    }
    setTimeout(refreshSlots, 100);
  };

  const extendSlot = (currentSlotId: string, nextSlotId: string) => {
    const nextSlot = slots.find((s) => s.id === nextSlotId);
    if (!nextSlot) return;
    // Book the next slot (it becomes continuous with current)
    setBookedSlotIds((prev) => {
      if (prev.includes(nextSlotId)) return prev;
      return [...prev, nextSlotId];
    });
    if (nextSlot) {
      addAlert(createSlotExtendedAlert(nextSlot.endTimestamp));
    }
    setTimeout(refreshSlots, 100);
  };

  const addSlotToWaitlist = (slotId: string) => {
    // In a real backend this would add to waitlist
    // For now, mark in bookedSlotIds with a special prefix
    setSlots((prev) =>
      prev.map((s) =>
        s.id === slotId ? { ...s, onWaitlist: true } : s
      )
    );
  };

  // ─── Break Methods ─────────────────────────────────────────────────────────

  const startBreak = () => {
    if (riderBreak && !riderBreak.endedAt) return; // Already on break
    if (!activeSlot) return;

    const newBreak: RiderBreak = {
      id: `break-${Date.now()}`,
      slotId: activeSlot.id,
      startedAt: Date.now(),
      endedAt: null,
      allowedDurationMs: adminConfig.break.allowedBreakMinutes * 60000,
      actualDurationMs: null,
      excessDurationMs: null,
      status: 'active',
      isEmergency: false,
      emergencyReason: null,
      gracePeriodEndAt: null,
    };

    setRiderBreak(newBreak);
    setIsOnline(false); // Pause orders during break
    if (incomingOrder) setIncomingOrder(null); // Clear any pending incoming
    addAlert(createBreakStartedAlert());
  };

  const endBreak = () => {
    if (!riderBreak) return;

    const now = Date.now();
    const elapsed = now - riderBreak.startedAt;
    const excess = Math.max(0, elapsed - riderBreak.allowedDurationMs);

    setRiderBreak({
      ...riderBreak,
      endedAt: now,
      actualDurationMs: elapsed,
      excessDurationMs: excess > 0 ? excess : null,
      status: 'completed',
    });

    // Resume online if slot still active and inside zone
    const canResume =
      activeSlot &&
      Date.now() < activeSlot.endTimestamp &&
      (zoneStatus === 'inside' || zoneStatus === 'low_accuracy' || zoneStatus === 'unknown');

    if (canResume) {
      setIsOnline(true);
    }
  };

  const startEmergencyBreak = (reason: string) => {
    if (!activeSlot) return;

    const newBreak: RiderBreak = {
      id: `emergency-break-${Date.now()}`,
      slotId: activeSlot.id,
      startedAt: Date.now(),
      endedAt: null,
      allowedDurationMs: adminConfig.break.allowedBreakMinutes * 60000,
      actualDurationMs: null,
      excessDurationMs: null,
      status: 'emergency',
      isEmergency: true,
      emergencyReason: reason,
      gracePeriodEndAt: null,
    };

    setRiderBreak(newBreak);
    setIsOnline(false);
    addAlert(createBreakEmergencyAlert(reason));
  };

  // ─── Online Gate ───────────────────────────────────────────────────────────

  const canGoOnline = useCallback((): CanGoOnlineResult => {
    if (!rider.isVerified) {
      return { canGo: false, reason: 'Your account is not yet verified.' };
    }

    // Check if there's a valid booked slot active or about to start
    const now = getNow();
    const earlyWindow = adminConfig.slot.earlyOnlineWindowMinutes * 60000;
    const validSlot = slots.find(
      (s) =>
        bookedSlotIds.includes(s.id) &&
        now >= s.startTimestamp - earlyWindow &&
        now < s.endTimestamp
    );

    if (!validSlot) {
      // Check if there's an upcoming slot soon
      const upcoming = slots.find(
        (s) => bookedSlotIds.includes(s.id) && now < s.startTimestamp
      );
      if (upcoming) {
        const startsIn = upcoming.startTimestamp - now;
        if (startsIn > earlyWindow) {
          const mins = Math.ceil(startsIn / 60000);
          return {
            canGo: false,
            reason: `Your slot hasn't started yet. Online will be available in ~${mins} min.`,
          };
        }
      }
      return {
        canGo: false,
        reason: 'No active slot. Book a slot in the Slots tab to receive orders.',
      };
    }

    if (riderBreak && !riderBreak.endedAt) {
      return { canGo: false, reason: 'You are currently on break. Resume break to go online.' };
    }

    // Zone check — allow if inside, low_accuracy, or unknown (GPS not available)
    if (zoneStatus === 'outside') {
      const selectedZone = zones.find((z) => z.id === (rider.selectedZoneId || 'zone-1'));
      return {
        canGo: false,
        reason: `You're outside ${selectedZone?.name || 'your selected zone'}. Go to your zone to receive orders.`,
      };
    }

    if (zoneStatus === 'permission_denied') {
      return {
        canGo: false,
        reason: 'Location permission denied. Please enable GPS to go Online.',
      };
    }

    if (zoneStatus === 'gps_disabled') {
      return {
        canGo: false,
        reason: 'GPS is disabled. Please enable location services to go Online.',
      };
    }

    return { canGo: true, reason: '' };
  }, [
    rider.isVerified,
    rider.selectedZoneId,
    slots,
    bookedSlotIds,
    adminConfig.slot,
    riderBreak,
    zoneStatus,
    zones,
  ]);

  // ─── Online Toggle (with gate) ─────────────────────────────────────────────

  const toggleOnline = () => {
    setIsOnline((prev) => {
      if (prev) {
        // Going offline — always allowed
        setIncomingOrder(null);
        return false;
      } else {
        // Going online — check gate
        const result = canGoOnline();
        if (!result.canGo) {
          // Don't toggle — the UI will show the reason
          return false;
        }
        setTimeout(() => {
          if (!activeOrder) {
            setIncomingOrder(initialIncomingOrder);
          }
        }, 2500);
        return true;
      }
    });
  };

  const setOnlineStatus = (status: boolean) => {
    if (status) {
      const result = canGoOnline();
      if (!result.canGo) return;
    }
    setIsOnline(status);
    if (!status) setIncomingOrder(null);
  };

  const toggleDesktopFrame = () => {
    setDesktopFrame((prev) => !prev);
  };

  // ─── Order Methods ─────────────────────────────────────────────────────────

  const acceptIncomingOrder = () => {
    if (!incomingOrder) return;
    recordOrderAcceptance(incomingOrder.id, 'accepted');
    const orderWithActiveStatus: Order = {
      ...incomingOrder,
      status: 'accepted',
      navStage: 'to_shop',
      shopLocation: incomingOrder.shopLocation || { lat: 12.9785, lng: 77.645, name: incomingOrder.restaurantName, address: incomingOrder.restaurantAddress },
      customerLocation: incomingOrder.customerLocation || { lat: 12.963, lng: 77.638, name: incomingOrder.customerName, address: incomingOrder.deliveryAddress },
      riderStartLocation: incomingOrder.riderStartLocation || { lat: 12.9716, lng: 77.6412 },
    };
    setActiveOrder(orderWithActiveStatus);
    setIncomingOrder(null);
  };

  const declineIncomingOrder = () => {
    if (!incomingOrder) return;
    recordOrderAcceptance(incomingOrder.id, 'declined');
    setIncomingOrder(null);
  };

  const recordOrderAcceptance = (
    orderId: string,
    response: OrderAcceptanceResponse,
    exceptionReason?: OrderAcceptanceExceptionReason
  ) => {
    const validExceptions = adminConfig.orderAcceptance.validExceptionReasons;
    const isValidException = exceptionReason && validExceptions.includes(exceptionReason);
    const shouldCount =
      (response === 'declined' || response === 'timeout') && !isValidException;

    const event: OrderAcceptanceEvent = {
      id: `accept-${Date.now()}`,
      orderId,
      slotId: activeSlot?.id || null,
      assignedAt: Date.now() - 25000,
      respondedAt: Date.now(),
      response,
      countedAsNonAcceptance: shouldCount,
      exceptionReason: exceptionReason || null,
    };

    setOrderAcceptanceEvents((prev) => [event, ...prev]);

    if (shouldCount) {
      setNonAcceptanceCount((prev) => {
        const newCount = prev + 1;
        const { warning1Threshold, warning2Threshold, maxNonAcceptances } = adminConfig.orderAcceptance;

        if (newCount === warning1Threshold || newCount === warning2Threshold || newCount >= maxNonAcceptances) {
          addAlert(createAcceptanceWarningAlert(newCount, maxNonAcceptances));
        }
        return newCount;
      });
    }
  };

  const setActiveOrderStatus = (status: DeliveryStatus) => {
    if (!activeOrder) return;
    setActiveOrder({ ...activeOrder, status });
  };

  const startNavigation = () => {
    if (!activeOrder) return;
    const isAlreadyAtShop =
      activeOrder.status === 'arrived_at_pickup' ||
      activeOrder.status === 'in_transit' ||
      activeOrder.navStage === 'to_customer';
    const nextStage = isAlreadyAtShop ? 'to_customer' : 'to_shop';
    const nextStatus = isAlreadyAtShop ? 'in_transit' : 'accepted';
    setActiveOrder({ ...activeOrder, status: nextStatus, navStage: nextStage });
  };

  const markOrderPickedUp = () => {
    if (!activeOrder) return;
    setActiveOrder({ ...activeOrder, status: 'in_transit', navStage: 'to_customer' });
  };

  const setNavStage = (stage: NavigationStage) => {
    if (!activeOrder) return;
    setActiveOrder({ ...activeOrder, navStage: stage });
  };

  const advanceActiveOrderStatus = () => {
    if (!activeOrder) return;
    let nextStatus: DeliveryStatus = activeOrder.status;
    let nextNavStage: NavigationStage = activeOrder.navStage || 'to_shop';

    if (activeOrder.status === 'accepted' || activeOrder.status === 'picking_up') {
      nextStatus = 'arrived_at_pickup';
      nextNavStage = 'to_shop';
    } else if (activeOrder.status === 'arrived_at_pickup') {
      nextStatus = 'in_transit';
      nextNavStage = 'to_customer';
    } else if (activeOrder.status === 'in_transit') {
      nextStatus = 'arrived_at_dropoff';
      nextNavStage = 'at_customer';
    } else if (activeOrder.status === 'arrived_at_dropoff') {
      nextStatus = 'delivered';
      nextNavStage = 'delivered';
    }

    setActiveOrder({ ...activeOrder, status: nextStatus, navStage: nextNavStage });
  };

  const completeDeliveryWithOtp = (enteredOtp: string): boolean => {
    if (!activeOrder) return false;
    if (enteredOtp === activeOrder.otp || enteredOtp === '1234') {
      const completedOrder: Order = { ...activeOrder, status: 'delivered', timestamp: 'Just now' };
      setOrdersHistory((prev) => [completedOrder, ...prev]);
      const orderEarnings = activeOrder.earnings || 45;

      setRider((prev) => ({
        ...prev,
        walletBalance: prev.walletBalance + orderEarnings,
        totalDeliveries: prev.totalDeliveries + 1,
      }));
      setEarnings((prev) => ({
        ...prev,
        today: prev.today + orderEarnings,
        todayDeliveries: prev.todayDeliveries + 1,
        thisWeek: prev.thisWeek + orderEarnings,
        weekDeliveries: prev.weekDeliveries + 1,
        thisMonth: prev.thisMonth + orderEarnings,
        baseFare: prev.baseFare + orderEarnings,
        dailyTrend: prev.dailyTrend.map((d) =>
          d.isToday ? { ...d, amount: d.amount + orderEarnings, deliveries: d.deliveries + 1 } : d
        ),
      }));

      const newAlert: AlertNotification = {
        id: `alert-${Date.now()}`,
        title: '💰 Wallet Credited: ₹' + orderEarnings,
        message: `Order #${activeOrder.orderNumber} delivered. ₹${orderEarnings} added to your Snapit Wallet.`,
        time: 'Just now',
        type: 'payout',
        read: false,
        amount: orderEarnings,
      };
      setAlerts((prev) => [newAlert, ...prev]);
      setActiveOrder(null);

      // If slot ended during delivery, now go offline
      if (activeSlot && Date.now() >= activeSlot.endTimestamp) {
        setIsOnline(false);
        addAlert(createSlotEndedAlert(activeSlot));
      }

      return true;
    }
    return false;
  };

  const triggerMockOrder = () => {
    // Only trigger if rider is eligible
    if (!isOnline || riderBreak?.status === 'active' || riderBreak?.status === 'emergency') return;

    const randomEarn = Math.floor(Math.random() * 35) + 45;
    const randomDistance = (Math.random() * 2 + 1.2).toFixed(1);
    const mock: Order = {
      id: `req-${Date.now()}`,
      orderNumber: `SN${Math.floor(10000 + Math.random() * 90000)}`,
      customerName: ['Rahul Sharma', 'Ananya Verma', 'Karthik Iyer', 'Sneha Patel'][Math.floor(Math.random() * 4)],
      customerPhone: '+91 98765 00000',
      customerAvatar:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBQm3F-EF8KMdfUn1CQ9_0AUu0c5Anids2usYM_zIsXx7e0kAQfYRu8ya1d-UFWak5O28XmbayOqGMxNHtc59lxyiIwhncjrY8XDG12i2tRQ5ZZnKkH5mEp0s_f52f09hRiNQGIcV2D4704CLIlRGfnLt7iMMRjWFYILDYbh8oZVpMKr6lbRp4SFioMcFer9PvsJgqi85zB3_zM1EKPWzOuaozxNddoYAjVKl88_tl8Ka9Dcu8_200q0w',
      restaurantName: 'Spice Route Restaurant',
      restaurantAddress: '124 Culinary Blvd, Food District',
      deliveryAddress: 'Apt 4B, Serenity Towers, Park View',
      distanceKm: parseFloat(randomDistance),
      estimatedMinutes: Math.floor(parseFloat(randomDistance) * 3) + 4,
      earnings: randomEarn,
      items: [
        { name: 'Chicken Tikka Masala', quantity: 1, price: 280 },
        { name: 'Garlic Naan', quantity: 2, price: 90 },
      ],
      status: 'pending',
      otp: '1234',
      timestamp: 'Just now',
      paymentMethod: 'Prepaid UPI',
    };
    setIncomingOrder(mock);
  };

  const updateRiderProfile = (updates: Partial<RiderProfile>) => {
    setRider((prev) => ({ ...prev, ...updates }));
  };

  const simulateApproval = () => {
    setRider((prev) => ({ ...prev, isVerified: true, verificationStep: 4 }));
  };

  const resetOnboarding = () => {
    setRider((prev) => ({ ...prev, isVerified: false, verificationStep: 1 }));
    setActiveOrder(null);
    setIncomingOrder(null);
    setBookedSlotIds([]);
    setRiderBreak(null);
    setNonAcceptanceCount(0);
  };

  const transferWalletToBank = (amount: number): boolean => {
    if (amount <= 0 || amount > rider.walletBalance) return false;
    setRider((prev) => ({ ...prev, walletBalance: prev.walletBalance - amount }));
    const newAlert: AlertNotification = {
      id: `alert-cashout-${Date.now()}`,
      title: '🏦 Bank Transfer Initiated',
      message: `₹${amount} transferred from Wallet to primary bank/UPI account (${rider.upiId})`,
      time: 'Just now',
      type: 'payout',
      read: false,
      amount,
    };
    setAlerts((prev) => [newAlert, ...prev]);
    return true;
  };

  const markAlertAsRead = (id: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, read: true } : a)));
  };

  return (
    <RiderContext.Provider
      value={{
        rider,
        isOnline,
        activeOrder,
        incomingOrder,
        ordersHistory,
        earnings,
        zones,
        alerts,
        desktopFrame,
        toggleOnline,
        toggleDesktopFrame,
        setOnlineStatus,
        acceptIncomingOrder,
        declineIncomingOrder,
        advanceActiveOrderStatus,
        setActiveOrderStatus,
        startNavigation,
        markOrderPickedUp,
        setNavStage,
        completeDeliveryWithOtp,
        triggerMockOrder,
        updateRiderProfile,
        simulateApproval,
        resetOnboarding,
        transferWalletToBank,
        markAlertAsRead,
        // New
        adminConfig,
        slots,
        activeSlot,
        upcomingSlot,
        riderBreak,
        zoneStatus,
        gpsCoords,
        orderAcceptanceEvents,
        nonAcceptanceCount,
        bookSlot,
        cancelSlot,
        extendSlot,
        addSlotToWaitlist,
        startBreak,
        endBreak,
        startEmergencyBreak,
        canGoOnline,
        recordOrderAcceptance,
        refreshZoneStatus,
        refreshSlots,
        testMode,
        setTestMode,
        isMockLocationEnabled,
        mockZoneId,
        enableMockLocation,
        disableMockLocation,
        setMockZone,
        isMockTimeEnabled,
        mockTimestamp,
        enableMockTime,
        disableMockTime,
        setMockTimePreset,
        resetTestEnvironment,
      }}
    >
      {children}
    </RiderContext.Provider>
  );
};

export const useRider = () => {
  const context = useContext(RiderContext);
  if (!context) {
    throw new Error('useRider must be used within a RiderProvider');
  }
  return context;
};
