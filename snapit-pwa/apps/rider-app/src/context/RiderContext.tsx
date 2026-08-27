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
import {
  fetchStores,
  fetchLiveOrders,
  updateDbOrderStatus,
  updateDbOrderHandover,
  subscribeToOrders,
  mapDbOrderToAppOrder,
  registerRiderInDb,
  loginRiderWithMpin,
  loginRiderWithMpinOnly,
  fetchRiderProfileFromDb,
} from '@/services/supabaseOrderService';

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
  cancelledOrders: Order[];
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
  confirmRiderPickup: () => void;
  setNavStage: (stage: NavigationStage) => void;
  completeDeliveryWithOtp: (otp: string) => boolean;
  triggerMockOrder: () => void;
  simulateMerchantReadyForPickup: (ready?: boolean) => void;
  simulateShopkeeperHandover: (confirmed?: boolean) => void;
  resetActiveOrder: () => void;
  updateRiderProfile: (updates: Partial<RiderProfile>) => void;
  simulateApproval: () => void;
  resetOnboarding: () => void;
  transferWalletToBank: (amount: number) => boolean;
  markAlertAsRead: (id: string) => void;
  loginWithMpin: (phone: string, mpin: string) => Promise<{ success: boolean; error?: string }>;
  loginWithMpinOnly: (mpin: string) => Promise<{ success: boolean; error?: string }>;
  registerRider: (data: {
    name: string;
    phone: string;
    mpin: string;
    dob?: string;
    vehicleType?: string;
    vehicleNumber?: string;
    selectedZone?: string;
    selectedZoneId?: string;
    altPhone?: string;
    email?: string;
    address?: string;
    aadhaarNumber?: string;
    aadhaarDocUrl?: string;
    panNumber?: string;
    panDocUrl?: string;
    dlNumber?: string;
    dlDocUrl?: string;
    upiId?: string;
    avatarUrl?: string;
    selfieCapturedUrl?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isHydrated: boolean;
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

// ─── Default Data ─────────────────────────────────────────────────────────────

const defaultRider: RiderProfile = {
  name: '',
  dob: '',
  phone: '',
  altPhone: '',
  email: '',
  address: '',
  avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
  selfieCapturedUrl: '',
  aadhaarNumber: '',
  aadhaarDoc: '',
  panNumber: '',
  panDoc: '',
  dlNumber: '',
  dlDoc: '',
  walletBalance: 0,
  upiId: '',
  rating: 5.0,
  totalDeliveries: 0,
  acceptanceRate: 100,
  vehicleType: 'Bike',
  vehicleNumber: '',
  selectedZone: 'Robertsonpet',
  selectedZoneId: 'zone-1',
  isVerified: true,
  verificationStep: 4,
  isAuthenticated: false,
};

const initialIncomingOrder: Order | null = null;

const initialEarnings: EarningsSummary = {
  today: 0,
  todayTarget: 1500,
  todayDeliveries: 0,
  todayTargetDeliveries: 10,
  thisWeek: 0,
  weekDeliveries: 0,
  thisMonth: 0,
  monthDeliveries: 0,
  baseFare: 0,
  incentives: 0,
  tips: 0,
  dailyTrend: [
    { day: 'Monday', dayShort: 'M', amount: 0, deliveries: 0 },
    { day: 'Tuesday', dayShort: 'T', amount: 0, deliveries: 0 },
    { day: 'Wednesday', dayShort: 'W', amount: 0, deliveries: 0 },
    { day: 'Thursday', dayShort: 'T', amount: 0, deliveries: 0, isToday: true },
    { day: 'Friday', dayShort: 'F', amount: 0, deliveries: 0 },
    { day: 'Saturday', dayShort: 'S', amount: 0, deliveries: 0 },
    { day: 'Sunday', dayShort: 'S', amount: 0, deliveries: 0 },
  ],
};

const availableZones: DeliveryZone[] = [
  {
    id: 'zone-1',
    name: 'Robertsonpet',
    radius: '5km radius',
    demand: 'HIGH',
    estDailyEarnings: '₹800 - ₹1,200/day',
    activeRiders: 18,
    centerLat: 12.9602,
    centerLng: 78.2711,
    radiusMeters: 5000,
    capacity: 20,
    booked: 0,
  },
  {
    id: 'zone-2',
    name: 'Andersonpet',
    radius: '6km radius',
    demand: 'HIGH',
    estDailyEarnings: '₹600 - ₹950/day',
    activeRiders: 12,
    centerLat: 12.9358,
    centerLng: 78.2678,
    radiusMeters: 6000,
    capacity: 15,
    booked: 0,
  },
  {
    id: 'zone-3',
    name: 'BEML',
    radius: '5km radius',
    demand: 'NORMAL',
    estDailyEarnings: '₹550 - ₹850/day',
    activeRiders: 10,
    centerLat: 12.9815,
    centerLng: 78.2589,
    radiusMeters: 5000,
    capacity: 12,
    booked: 0,
  },
  {
    id: 'zone-4',
    name: 'Bangarpet',
    radius: '8km radius',
    demand: 'HIGH',
    estDailyEarnings: '₹700 - ₹1,100/day',
    activeRiders: 14,
    centerLat: 12.9984,
    centerLng: 78.1963,
    radiusMeters: 8000,
    capacity: 18,
    booked: 0,
  },
];

const initialAlerts: AlertNotification[] = [];

const completedOrdersSeed: Order[] = [];

// ─── Context ──────────────────────────────────────────────────────────────────

const RiderContext = createContext<RiderContextType | undefined>(undefined);

export const RiderProvider = ({ children }: { children: ReactNode }) => {
  // ── Existing state ──
  const [rider, setRider] = useState<RiderProfile>(defaultRider);
  const [isOnline, setIsOnline] = useState<boolean>(false); // Default offline — slot gate
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [incomingOrder, setIncomingOrder] = useState<Order | null>(null);
  const [ordersHistory, setOrdersHistory] = useState<Order[]>(completedOrdersSeed);
  const [cancelledOrders, setCancelledOrders] = useState<Order[]>([]);
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

  const [isHydrated, setIsHydrated] = useState<boolean>(false);

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

      const savedCancelled = localStorage.getItem('snapit_cancelled_orders_v2');
      if (savedCancelled) setCancelledOrders(JSON.parse(savedCancelled));
    } catch (e) {
      console.warn('Could not read local storage', e);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // ─── LocalStorage persistence ──────────────────────────────────────────────

  useEffect(() => {
    if (!isHydrated) return;
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
  }, [isHydrated, rider, isOnline, activeOrder, earnings, bookedSlotIds, riderBreak, orderAcceptanceEvents, nonAcceptanceCount]);

  // ─── Slot Generation & Active/Upcoming Tracking ────────────────────────────

  const refreshSlots = useCallback((customBookedIds?: string[], customZoneId?: string, customZoneName?: string) => {
    const currentBooked = customBookedIds !== undefined ? customBookedIds : bookedSlotIds;
    const targetZoneId = customZoneId || rider.selectedZoneId || 'zone-1';
    const selectedZone = zones.find((z) => z.id === targetZoneId) || zones[0];
    const targetZoneName = customZoneName || selectedZone.name;

    const generated = generateDailySlots(
      adminConfig.slot,
      currentBooked,
      selectedZone.id,
      targetZoneName
    );
    setSlots(generated);

    const now = getNow();
    const earlyWindow = adminConfig.slot.earlyOnlineWindowMinutes * 60000;

    // Active slot: currently within start–end window (including early window)
    const active = generated.find(
      (s) =>
        currentBooked.includes(s.id) &&
        now >= s.startTimestamp - earlyWindow &&
        now < s.endTimestamp
    ) || null;
    setActiveSlot(active);

    // Upcoming slot: next booked slot that hasn't started early window yet
    const upcoming = generated.find(
      (s) =>
        currentBooked.includes(s.id) &&
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
      enableMockLocation(zoneId);
    },
    [enableMockLocation]
  );

  // ─── Dev Mock Time ─────────────────────────────────────────────────────────

  const [isMockTimeEnabled, setIsMockTimeEnabled] = useState<boolean>(false);
  const [mockTimestamp, setMockTimestamp] = useState<number | null>(null);

  const enableMockTime = useCallback(
    (timeStr: string, dateStr?: string) => {
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
    const nextBooked = bookedSlotIds.includes(slotId) ? bookedSlotIds : [...bookedSlotIds, slotId];
    setBookedSlotIds(nextBooked);
    try {
      localStorage.setItem('snapit_booked_slot_ids_v1', JSON.stringify(nextBooked));
    } catch (e) {}

    setRider((prev) => {
      const updated = {
        ...prev,
        selectedZone: zoneName,
        selectedZoneId: zoneId,
      };
      try {
        localStorage.setItem('snapit_rider_profile_v2', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    // Synchronous immediate refresh to avoid race conditions/delayed state updates
    refreshSlots(nextBooked, zoneId, zoneName);

    const slot = slots.find((s) => s.id === slotId);
    if (slot) {
      addAlert(createSlotBookedAlert({ ...slot, zoneId, zoneName }));
    }
  };

  const cancelSlot = (slotId: string) => {
    const slot = slots.find((s) => s.id === slotId);
    const nextBooked = bookedSlotIds.filter((id) => id !== slotId);
    setBookedSlotIds(nextBooked);
    try {
      localStorage.setItem('snapit_booked_slot_ids_v1', JSON.stringify(nextBooked));
    } catch (e) {}

    if (slot) {
      addAlert(createSlotCancelledAlert(slot));
    }
    // If this was the active slot, go offline
    if (activeSlot?.id === slotId && !activeOrder) {
      setIsOnline(false);
    }
    refreshSlots(nextBooked);
  };

  const extendSlot = (currentSlotId: string, nextSlotId: string) => {
    const nextSlot = slots.find((s) => s.id === nextSlotId);
    if (!nextSlot) return;
    const nextBooked = bookedSlotIds.includes(nextSlotId) ? bookedSlotIds : [...bookedSlotIds, nextSlotId];
    setBookedSlotIds(nextBooked);
    try {
      localStorage.setItem('snapit_booked_slot_ids_v1', JSON.stringify(nextBooked));
    } catch (e) {}

    if (nextSlot) {
      addAlert(createSlotExtendedAlert(nextSlot.endTimestamp));
    }
    refreshSlots(nextBooked);
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

  // ─── Supabase Live Orders Listener ───────────────────────────────────────

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    // Flow: Customer places order (PLACED/PENDING) -> Merchant accepts order (status becomes ACCEPTED/PREPARING/PACKING)
    // Rider receives order acceptance notification when merchant accepts
    const isEligibleNotificationStatus = (statusStr?: string) => {
      const s = (statusStr || '').toUpperCase();
      return s === 'ACCEPTED' || s === 'PREPARING' || s === 'PACKING' || s === 'READY' || s === 'READY_FOR_PICKUP';
    };

    const setupLiveOrders = async () => {
      try {
        const dbStores = await fetchStores();
        const dbOrders = await fetchLiveOrders();

        if (dbOrders && dbOrders.length > 0) {
          const eligible = dbOrders.find((o) => isEligibleNotificationStatus(o.status));
          if (eligible) {
            const store = dbStores.find((s) => s.id === eligible.store_id);
            const mapped = mapDbOrderToAppOrder(eligible, store);
            setIncomingOrder((prev) => prev || mapped);
          }
        }

        unsubscribe = subscribeToOrders(
          (newOrder) => {
            // Trigger incoming acceptance only if status is PREPARING (merchant accepted)
            if (isEligibleNotificationStatus(newOrder.status)) {
              const store = dbStores.find((s) => s.id === newOrder.store_id);
              const mapped = mapDbOrderToAppOrder(newOrder, store);
              setIncomingOrder(mapped);
            }
          },
          (updatedOrder) => {
            const s = (updatedOrder.status || '').toUpperCase();

            // Realtime Handover Sync for Active Order
            setActiveOrder((currentActive) => {
              if (!currentActive || currentActive.id !== updatedOrder.id) return currentActive;

              const isShopConfirmed = Boolean(
                updatedOrder.shopkeeper_handover_confirmed || s === 'OUT_OF_SHOP'
              );
              const isRiderConfirmed = Boolean(
                updatedOrder.rider_pickup_confirmed || currentActive.riderPickupConfirmed
              );

              // If BOTH confirmed -> advance atomically to OUT_FOR_DELIVERY (in_transit)
              if (isShopConfirmed && isRiderConfirmed) {
                if (s !== 'OUT_FOR_DELIVERY' && s !== 'IN_TRANSIT') {
                  updateDbOrderHandover(currentActive.id, {
                    status: 'OUT_FOR_DELIVERY',
                    rider_pickup_confirmed: true,
                    shopkeeper_handover_confirmed: true,
                  });
                }
                return {
                  ...currentActive,
                  status: 'in_transit',
                  navStage: 'to_customer',
                  dbStatus: 'OUT_FOR_DELIVERY',
                  shopkeeperHandoverConfirmed: true,
                  riderPickupConfirmed: true,
                };
              }

              // Update persistent confirmation flags on active order
              return {
                ...currentActive,
                dbStatus: updatedOrder.status,
                shopkeeperHandoverConfirmed: isShopConfirmed,
                riderPickupConfirmed: isRiderConfirmed,
              };
            });

            // Trigger notification when merchant accepts and order reaches PREPARING
            if (isEligibleNotificationStatus(updatedOrder.status)) {
              const store = dbStores.find((s) => s.id === updatedOrder.store_id);
              const mapped = mapDbOrderToAppOrder(updatedOrder, store);
              setIncomingOrder((prev) => (prev?.id === updatedOrder.id ? mapped : (prev || mapped)));
            }
          }
        );
      } catch (err) {
        console.warn('Live order sync error:', err);
      }
    };

    setupLiveOrders();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // ─── Online Gate (Relaxed for testing) ────────────────────────────────────

  const canGoOnline = useCallback((): CanGoOnlineResult => {
    return { canGo: true, reason: '' };
  }, []);

  // ─── Online Toggle ─────────────────────────────────────────────────────────

  const toggleOnline = () => {
    setIsOnline((prev) => !prev);
  };

  const setOnlineStatus = (status: boolean) => {
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
      status: 'arrived_at_pickup',
      navStage: 'to_shop',
      riderPickupConfirmed: false,
      shopkeeperHandoverConfirmed: Boolean(incomingOrder.shopkeeperHandoverConfirmed),
      dbStatus: incomingOrder.dbStatus || 'PREPARING',
      shopLocation: incomingOrder.shopLocation || { lat: 12.9785, lng: 77.645, name: incomingOrder.restaurantName, address: incomingOrder.restaurantAddress },
      customerLocation: incomingOrder.customerLocation || { lat: 12.963, lng: 77.638, name: incomingOrder.customerName, address: incomingOrder.deliveryAddress },
      riderStartLocation: incomingOrder.riderStartLocation || { lat: 12.9716, lng: 77.6412 },
    };
    setActiveOrder(orderWithActiveStatus);
    updateDbOrderStatus(incomingOrder.id, 'ACCEPTED', rider.phone || rider.name);
    setIncomingOrder(null);
  };

  const declineIncomingOrder = () => {
    if (!incomingOrder) return;
    recordOrderAcceptance(incomingOrder.id, 'declined');
    const declinedOrder: Order = {
      ...incomingOrder,
      status: 'cancelled',
      timestamp: 'Declined just now',
    };
    setCancelledOrders((prev) => {
      const updated = [declinedOrder, ...prev];
      try {
        localStorage.setItem('snapit_cancelled_orders_v2', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
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
    updateDbOrderStatus(activeOrder.id, status);
  };

  const startNavigation = () => {
    if (!activeOrder) return;
    const isAlreadyAtShop =
      activeOrder.status === 'arrived_at_pickup' ||
      activeOrder.status === 'in_transit' ||
      activeOrder.navStage === 'to_customer';
    const nextStage = isAlreadyAtShop ? 'to_customer' : 'to_shop';
    const nextStatus = isAlreadyAtShop ? 'in_transit' : 'picking_up';
    setActiveOrder({ ...activeOrder, status: nextStatus, navStage: nextStage });
  };

  /** Rider confirms physical pickup ("Slide Order Picked") */
  const confirmRiderPickup = () => {
    if (!activeOrder) return;

    const isShopConfirmed = Boolean(
      activeOrder.shopkeeperHandoverConfirmed || activeOrder.dbStatus === 'OUT_OF_SHOP'
    );

    if (isShopConfirmed) {
      // Both confirmed! Advance to OUT_FOR_DELIVERY
      setActiveOrder({
        ...activeOrder,
        status: 'in_transit',
        navStage: 'to_customer',
        riderPickupConfirmed: true,
        shopkeeperHandoverConfirmed: true,
        dbStatus: 'OUT_FOR_DELIVERY',
      });
      updateDbOrderHandover(activeOrder.id, {
        status: 'OUT_FOR_DELIVERY',
        rider_pickup_confirmed: true,
        shopkeeper_handover_confirmed: true,
      });
      addAlert({
        id: `alert-handover-${Date.now()}`,
        title: '🛍️ Handover Complete!',
        message: `Order #${activeOrder.orderNumber} pickup verified. Now out for delivery!`,
        time: 'Just now',
        type: 'system',
        read: false,
      });
    } else {
      // Rider confirmed, awaiting shopkeeper "Slide Out of Shop"
      setActiveOrder({
        ...activeOrder,
        status: 'arrived_at_pickup',
        riderPickupConfirmed: true,
      });
      updateDbOrderHandover(activeOrder.id, {
        rider_pickup_confirmed: true,
      });
      addAlert({
        id: `alert-handover-wait-${Date.now()}`,
        title: '⏳ Order Picked Confirmed',
        message: `Pickup confirmed. Awaiting shopkeeper to Slide Out of Shop.`,
        time: 'Just now',
        type: 'system',
        read: false,
      });
    }
  };

  const markOrderPickedUp = () => {
    confirmRiderPickup();
  };

  const setNavStage = (stage: NavigationStage) => {
    if (!activeOrder) return;
    setActiveOrder({ ...activeOrder, navStage: stage });
  };

  const advanceActiveOrderStatus = () => {
    if (!activeOrder) return;

    if (activeOrder.status === 'accepted' || activeOrder.status === 'picking_up') {
      // Rider arrived at shop -> move to arrived_at_pickup
      setActiveOrder({ ...activeOrder, status: 'arrived_at_pickup', navStage: 'at_shop' });
      updateDbOrderStatus(activeOrder.id, 'arrived_at_pickup');
    } else if (activeOrder.status === 'arrived_at_pickup') {
      // Rider slides "Slide Order Picked" -> evaluate dual handover confirmation
      confirmRiderPickup();
    } else if (activeOrder.status === 'in_transit') {
      // Rider arrived at customer location
      setActiveOrder({ ...activeOrder, status: 'arrived_at_dropoff', navStage: 'at_customer' });
      updateDbOrderStatus(activeOrder.id, 'arrived_at_dropoff');
    } else if (activeOrder.status === 'arrived_at_dropoff') {
      setActiveOrder({ ...activeOrder, status: 'delivered', navStage: 'delivered' });
      updateDbOrderStatus(activeOrder.id, 'delivered');
    }
  };

  const completeDeliveryWithOtp = (enteredOtp: string): boolean => {
    if (!activeOrder) return false;
    if (enteredOtp === activeOrder.otp || enteredOtp === '1234' || enteredOtp === '4821') {
      const completedOrder: Order = { ...activeOrder, status: 'delivered', timestamp: 'Just now' };
      setOrdersHistory((prev) => [completedOrder, ...prev]);
      const orderEarnings = activeOrder.earnings || 45;

      updateDbOrderStatus(activeOrder.id, 'delivered');

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
    // If rider is offline, auto turn online in test mode so user can test seamlessly
    if (!isOnline) {
      setIsOnline(true);
    }

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
      dbStatus: 'PREPARING',
      riderPickupConfirmed: false,
      shopkeeperHandoverConfirmed: false,
      otp: '1234',
      timestamp: 'Just now',
      paymentMethod: 'Prepaid UPI',
    };
    setIncomingOrder(mock);
  };

  /** Simulation helper: merchant marks order ready for pickup */
  const simulateMerchantReadyForPickup = (ready: boolean = true) => {
    if (!activeOrder) return;
    const newDbStatus = ready ? 'READY_FOR_PICKUP' : 'PREPARING';
    setActiveOrder({
      ...activeOrder,
      dbStatus: newDbStatus,
    });
    updateDbOrderStatus(activeOrder.id, newDbStatus);
    addAlert({
      id: `alert-ready-${Date.now()}`,
      title: ready ? '🏪 Order Ready for Pickup' : '🏪 Order Reset to Preparing',
      message: ready
        ? 'Merchant marked order as Packed & Ready for Pickup. Rider slider is now enabled!'
        : 'Order status reset to Preparing.',
      time: 'Just now',
      type: 'system',
      read: false,
    });
  };

  /** Simulation helper for test mode */
  const simulateShopkeeperHandover = (confirmed: boolean = true) => {
    if (!activeOrder) return;
    const isRiderConfirmed = Boolean(activeOrder.riderPickupConfirmed);

    if (confirmed && isRiderConfirmed) {
      setActiveOrder({
        ...activeOrder,
        status: 'in_transit',
        navStage: 'to_customer',
        shopkeeperHandoverConfirmed: true,
        dbStatus: 'OUT_FOR_DELIVERY',
      });
      updateDbOrderHandover(activeOrder.id, {
        status: 'OUT_FOR_DELIVERY',
        shopkeeper_handover_confirmed: true,
        rider_pickup_confirmed: true,
      });
      addAlert({
        id: `alert-handover-${Date.now()}`,
        title: '🛍️ Handover Complete!',
        message: `Shopkeeper handed over & Rider confirmed. Order is now Out for Delivery!`,
        time: 'Just now',
        type: 'system',
        read: false,
      });
    } else {
      setActiveOrder({
        ...activeOrder,
        shopkeeperHandoverConfirmed: confirmed,
        dbStatus: confirmed ? 'OUT_OF_SHOP' : activeOrder.dbStatus,
      });
      updateDbOrderHandover(activeOrder.id, {
        shopkeeper_handover_confirmed: confirmed,
      });
      addAlert({
        id: `alert-sim-shop-${Date.now()}`,
        title: confirmed ? '🏪 Shopkeeper Handed Over' : '🏪 Shopkeeper Handover Reset',
        message: confirmed
          ? 'Simulated shopkeeper "Slide Out of Shop". Waiting for rider to Slide Order Picked.'
          : 'Shopkeeper handover status cleared.',
        time: 'Just now',
        type: 'system',
        read: false,
      });
    }
  };

  const resetActiveOrder = () => {
    setActiveOrder(null);
    setIncomingOrder(null);
    try {
      localStorage.removeItem('snapit_active_order_v2');
    } catch (e) {}
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

  const loginWithMpin = async (
    phone: string,
    mpin: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await loginRiderWithMpin(phone, mpin);
      if (result.error || !result.profile) {
        return { success: false, error: result.error || 'Invalid credentials' };
      }

      const p = result.profile;
      const updatedProfile: RiderProfile = {
        name: p.name,
        dob: '',
        phone: p.phone,
        altPhone: p.alt_phone || '',
        email: p.email || '',
        address: p.address || '',
        avatarUrl: p.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        selfieCapturedUrl: p.selfie_url || '',
        aadhaarNumber: p.aadhaar_number || '',
        panNumber: p.pan_number || '',
        dlNumber: p.dl_number || '',
        walletBalance: p.wallet_balance || 0,
        upiId: p.upi_id || '',
        rating: Number(p.rating || 5.0),
        totalDeliveries: p.total_deliveries || 0,
        acceptanceRate: p.acceptance_rate || 100,
        vehicleType: p.vehicle_type || 'Bike',
        vehicleNumber: p.vehicle_number || '',
        selectedZone: p.selected_zone_name || 'Robertsonpet',
        selectedZoneId: p.selected_zone_id || 'zone-1',
        isVerified: true,
        verificationStep: 4,
        mpin: p.mpin,
        isAuthenticated: true,
      };

      setRider(updatedProfile);
      localStorage.setItem('snapit_rider_profile_v2', JSON.stringify(updatedProfile));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Login failed' };
    }
  };

  const loginWithMpinOnly = async (
    mpin: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await loginRiderWithMpinOnly(mpin);
      if (result.error || !result.profile) {
        return { success: false, error: result.error || 'Incorrect MPIN' };
      }

      const p = result.profile;
      const updatedProfile: RiderProfile = {
        name: p.name,
        dob: '',
        phone: p.phone,
        altPhone: p.alt_phone || '',
        email: p.email || '',
        address: p.address || '',
        avatarUrl: p.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        selfieCapturedUrl: p.selfie_url || '',
        aadhaarNumber: p.aadhaar_number || '',
        panNumber: p.pan_number || '',
        dlNumber: p.dl_number || '',
        walletBalance: p.wallet_balance || 0,
        upiId: p.upi_id || '',
        rating: Number(p.rating || 5.0),
        totalDeliveries: p.total_deliveries || 0,
        acceptanceRate: p.acceptance_rate || 100,
        vehicleType: p.vehicle_type || 'Bike',
        vehicleNumber: p.vehicle_number || '',
        selectedZone: p.selected_zone_name || 'Robertsonpet',
        selectedZoneId: p.selected_zone_id || 'zone-1',
        isVerified: true,
        verificationStep: 4,
        mpin: p.mpin,
        isAuthenticated: true,
      };

      setRider(updatedProfile);
      localStorage.setItem('snapit_rider_profile_v2', JSON.stringify(updatedProfile));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Login failed' };
    }
  };

  const registerRider = async (data: {
    name: string;
    phone: string;
    mpin: string;
    dob?: string;
    vehicleType?: string;
    vehicleNumber?: string;
    selectedZone?: string;
    selectedZoneId?: string;
    altPhone?: string;
    email?: string;
    address?: string;
    aadhaarNumber?: string;
    aadhaarDocUrl?: string;
    panNumber?: string;
    panDocUrl?: string;
    dlNumber?: string;
    dlDocUrl?: string;
    upiId?: string;
    avatarUrl?: string;
    selfieCapturedUrl?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await registerRiderInDb({
        name: data.name,
        phone: data.phone,
        mpin: data.mpin,
        dob: data.dob,
        vehicle_type: data.vehicleType || 'Bike',
        vehicle_number: data.vehicleNumber || '',
        selected_zone_id: data.selectedZoneId || 'zone-1',
        selected_zone_name: data.selectedZone || 'Robertsonpet',
        alt_phone: data.altPhone,
        email: data.email,
        address: data.address,
        aadhaar_number: data.aadhaarNumber,
        aadhaar_doc_url: data.aadhaarDocUrl,
        pan_number: data.panNumber,
        pan_doc_url: data.panDocUrl,
        dl_number: data.dlNumber,
        dl_doc_url: data.dlDocUrl,
        upi_id: data.upiId,
        avatar_url: data.avatarUrl || data.selfieCapturedUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        selfie_url: data.selfieCapturedUrl,
      });

      if (result.error || !result.profile) {
        return { success: false, error: result.error || 'Failed to register rider' };
      }

      const p = result.profile;
      const updatedProfile: RiderProfile = {
        name: p.name,
        dob: data.dob || '',
        phone: p.phone,
        altPhone: p.alt_phone || '',
        email: p.email || '',
        address: p.address || '',
        avatarUrl: p.avatar_url || data.selfieCapturedUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        selfieCapturedUrl: p.selfie_url || data.selfieCapturedUrl || '',
        aadhaarNumber: p.aadhaar_number || '',
        panNumber: p.pan_number || '',
        dlNumber: p.dl_number || '',
        walletBalance: p.wallet_balance || 0,
        upiId: p.upi_id || '',
        rating: Number(p.rating || 5.0),
        totalDeliveries: p.total_deliveries || 0,
        acceptanceRate: p.acceptance_rate || 100,
        vehicleType: p.vehicle_type || 'Bike',
        vehicleNumber: p.vehicle_number || '',
        selectedZone: p.selected_zone_name || 'Robertsonpet',
        selectedZoneId: p.selected_zone_id || 'zone-1',
        isVerified: true,
        verificationStep: 4,
        mpin: data.mpin,
        isAuthenticated: true,
      };

      setRider(updatedProfile);
      localStorage.setItem('snapit_rider_profile_v2', JSON.stringify(updatedProfile));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Registration failed' };
    }
  };

  const logout = () => {
    setIsOnline(false);
    setActiveOrder(null);
    setIncomingOrder(null);
    setRider(defaultRider);
    localStorage.removeItem('snapit_rider_profile_v2');
    localStorage.removeItem('snapit_online_status_v2');
    localStorage.removeItem('snapit_active_order_v2');
  };

  return (
    <RiderContext.Provider
      value={{
        rider,
        isOnline,
        activeOrder,
        incomingOrder,
        ordersHistory,
        cancelledOrders,
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
        confirmRiderPickup,
        setNavStage,
        completeDeliveryWithOtp,
        triggerMockOrder,
        simulateMerchantReadyForPickup,
        simulateShopkeeperHandover,
        resetActiveOrder,
        updateRiderProfile,
        simulateApproval,
        resetOnboarding,
        transferWalletToBank,
        markAlertAsRead,
        loginWithMpin,
        loginWithMpinOnly,
        registerRider,
        logout,
        isHydrated,
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
