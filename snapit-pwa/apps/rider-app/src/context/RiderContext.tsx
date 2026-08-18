'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { RiderProfile, Order, EarningsSummary, DeliveryZone, AlertNotification, DeliveryStatus } from '@/types';

interface RiderContextType {
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
  completeDeliveryWithOtp: (otp: string) => boolean;
  triggerMockOrder: () => void;
  updateRiderProfile: (updates: Partial<RiderProfile>) => void;
  simulateApproval: () => void;
  cashoutEarnings: (amount: number) => boolean;
  markAlertAsRead: (id: string) => void;
}

const defaultRider: RiderProfile = {
  name: "Rahul Sharma",
  phone: "+91 98765 43210",
  email: "rahul.sharma@snapit.in",
  avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuC-PEiTgWViD1ovXWhH1B1TQbMaWamoTZBv9VbCDabgGy61BlhUVTtyCaQqeI5WbDHOFao2v1A6tBhc7gUUm_4Kw7IjE4g7U93BvPxpBCwFcpkL3WKodfrio1p1RyKPuUw3qMZ3ehzSz5_NUemOI3BVvFqRDj3EdyCQfpGH2eWP1FbJCAvX16Yy7ZGqOdSYHx44o2sVTKEs0VZ56ZU7EjUIFOEJHw_qX6azzfjVcPoCJ7EDvRR1lx43EA",
  upiId: "rahul.k@okicici",
  rating: 4.9,
  totalDeliveries: 1420,
  acceptanceRate: 98,
  vehicleType: "Electric Scooter (Ather 450X)",
  vehicleNumber: "MH 02 EQ 8821",
  selectedZone: "Downtown Central",
  isVerified: true,
  verificationStep: 4,
};

const initialIncomingOrder: Order = {
  id: "req-101",
  orderNumber: "SN12345",
  customerName: "Rahul Sharma",
  customerPhone: "+91 91234 56789",
  customerAvatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuBQm3F-EF8KMdfUn1CQ9_0AUu0c5Anids2usYM_zIsXx7e0kAQfYRu8ya1d-UFWak5O28XmbayOqGMxNHtc59lxyiIwhncjrY8XDG12i2tRQ5ZZnKkH5mEp0s_f52f09hRiNQGIcV2D4704CLIlRGfnLt7iMMRjWFYILDYbh8oZVpMKr6lbRp4SFioMcFer9PvsJgqi85zB3_zM1EKPWzOuaozxNddoYAjVKl88_tl8Ka9Dcu8_200q0w",
  restaurantName: "Spice Route Restaurant",
  restaurantAddress: "124 Culinary Blvd, Food District",
  deliveryAddress: "Apt 4B, Serenity Towers, Park View",
  distanceKm: 2.5,
  estimatedMinutes: 8,
  earnings: 45,
  items: [
    { name: "Chicken Tikka Masala", quantity: 1, price: 280 },
    { name: "Garlic Naan", quantity: 2, price: 90 },
    { name: "Mango Lassi", quantity: 1, price: 80 },
  ],
  status: "pending",
  otp: "1234",
  timestamp: "Just now",
  paymentMethod: "Prepaid UPI",
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
    { day: "Monday", dayShort: "M", amount: 1650, deliveries: 10 },
    { day: "Tuesday", dayShort: "T", amount: 2100, deliveries: 12 },
    { day: "Wednesday", dayShort: "W", amount: 2300, deliveries: 13 },
    { day: "Thursday", dayShort: "T", amount: 2450, deliveries: 14, isToday: true },
    { day: "Friday", dayShort: "F", amount: 0, deliveries: 0 },
    { day: "Saturday", dayShort: "S", amount: 0, deliveries: 0 },
    { day: "Sunday", dayShort: "S", amount: 0, deliveries: 0 },
  ],
};

const availableZones: DeliveryZone[] = [
  {
    id: "zone-1",
    name: "Downtown Central",
    radius: "5km radius",
    demand: "HIGH",
    estDailyEarnings: "₹800 - ₹1,200/day",
    activeRiders: 18,
  },
  {
    id: "zone-2",
    name: "North Tech Park",
    radius: "8km radius",
    demand: "HIGH",
    estDailyEarnings: "₹600 - ₹900/day",
    activeRiders: 12,
  },
  {
    id: "zone-3",
    name: "South Suburbs",
    radius: "12km radius",
    demand: "NORMAL",
    estDailyEarnings: "₹500 - ₹800/day",
    activeRiders: 8,
  },
];

const initialAlerts: AlertNotification[] = [
  {
    id: "alert-1",
    title: "⚡ Surge Bonus Active!",
    message: "High demand in Downtown Central! Earn +₹30 extra per delivery until 10:00 PM.",
    time: "5m ago",
    type: "surge",
    read: false,
    amount: 30,
  },
  {
    id: "alert-2",
    title: "🎉 Customer Tip Received",
    message: "Customer Rahul Sharma added a ₹50 tip for on-time delivery.",
    time: "32m ago",
    type: "tip",
    read: false,
    amount: 50,
  },
  {
    id: "alert-3",
    title: "🎯 Weekly Milestone Reached",
    message: "Completed 40 deliveries this week. ₹500 incentive bonus unlocked!",
    time: "2h ago",
    type: "system",
    read: true,
    amount: 500,
  },
];

const completedOrdersSeed: Order[] = [
  {
    id: "order-100",
    orderNumber: "SN12340",
    customerName: "Pooja Hegde",
    customerPhone: "+91 98888 11111",
    restaurantName: "Urban Gourmet Bowl",
    restaurantAddress: "Shop 12, High Street Galleria",
    deliveryAddress: "Tower 3, Infinity Heights",
    distanceKm: 3.2,
    estimatedMinutes: 12,
    earnings: 55,
    items: [
      { name: "Avocado Quinoa Bowl", quantity: 1, price: 320 },
      { name: "Cold Pressed Orange Juice", quantity: 1, price: 120 },
    ],
    status: "delivered",
    otp: "5678",
    timestamp: "1 hour ago",
    paymentMethod: "Online Paid",
  },
  {
    id: "order-99",
    orderNumber: "SN12338",
    customerName: "Vikram Malhotra",
    customerPhone: "+91 97777 22222",
    restaurantName: "Burger Craft Co.",
    restaurantAddress: "Corner Street, Bandra West",
    deliveryAddress: "Bungalow 7, Pali Hill",
    distanceKm: 1.8,
    estimatedMinutes: 7,
    earnings: 40,
    items: [
      { name: "Double Truffle Smash Burger", quantity: 2, price: 540 },
      { name: "Peri Peri Fries", quantity: 1, price: 110 },
    ],
    status: "delivered",
    otp: "9912",
    timestamp: "2 hours ago",
    paymentMethod: "Prepaid Card",
  },
];

const RiderContext = createContext<RiderContextType | undefined>(undefined);

export const RiderProvider = ({ children }: { children: ReactNode }) => {
  const [rider, setRider] = useState<RiderProfile>(defaultRider);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [incomingOrder, setIncomingOrder] = useState<Order | null>(initialIncomingOrder);
  const [ordersHistory, setOrdersHistory] = useState<Order[]>(completedOrdersSeed);
  const [earnings, setEarnings] = useState<EarningsSummary>(initialEarnings);
  const [zones] = useState<DeliveryZone[]>(availableZones);
  const [alerts, setAlerts] = useState<AlertNotification[]>(initialAlerts);
  const [desktopFrame, setDesktopFrame] = useState<boolean>(false);

  // Initialize from LocalStorage
  useEffect(() => {
    try {
      const savedRider = localStorage.getItem('snapit_rider_profile');
      if (savedRider) setRider(JSON.parse(savedRider));

      const savedOnline = localStorage.getItem('snapit_online_status');
      if (savedOnline !== null) setIsOnline(JSON.parse(savedOnline));

      const savedActive = localStorage.getItem('snapit_active_order');
      if (savedActive) setActiveOrder(JSON.parse(savedActive));

      const savedEarnings = localStorage.getItem('snapit_earnings');
      if (savedEarnings) setEarnings(JSON.parse(savedEarnings));
    } catch (e) {
      console.warn("Could not read local storage", e);
    }
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('snapit_rider_profile', JSON.stringify(rider));
      localStorage.setItem('snapit_online_status', JSON.stringify(isOnline));
      localStorage.setItem('snapit_active_order', JSON.stringify(activeOrder));
      localStorage.setItem('snapit_earnings', JSON.stringify(earnings));
    } catch (e) {
      console.warn("Could not write local storage", e);
    }
  }, [rider, isOnline, activeOrder, earnings]);

  const toggleOnline = () => {
    setIsOnline((prev) => {
      const next = !prev;
      if (!next) {
        setIncomingOrder(null);
      } else if (!activeOrder) {
        // Automatically trigger an order after 3 seconds when turning online
        setTimeout(() => {
          setIncomingOrder(initialIncomingOrder);
        }, 3000);
      }
      return next;
    });
  };

  const setOnlineStatus = (status: boolean) => {
    setIsOnline(status);
    if (!status) setIncomingOrder(null);
  };

  const toggleDesktopFrame = () => {
    setDesktopFrame((prev) => !prev);
  };

  const acceptIncomingOrder = () => {
    if (!incomingOrder) return;
    const orderWithActiveStatus: Order = {
      ...incomingOrder,
      status: "picking_up",
    };
    setActiveOrder(orderWithActiveStatus);
    setIncomingOrder(null);
  };

  const declineIncomingOrder = () => {
    setIncomingOrder(null);
  };

  const setActiveOrderStatus = (status: DeliveryStatus) => {
    if (!activeOrder) return;
    setActiveOrder({
      ...activeOrder,
      status,
    });
  };

  const advanceActiveOrderStatus = () => {
    if (!activeOrder) return;
    const flow: Record<DeliveryStatus, DeliveryStatus> = {
      pending: 'accepted',
      accepted: 'picking_up',
      picking_up: 'arrived_at_pickup',
      arrived_at_pickup: 'in_transit',
      in_transit: 'arrived_at_dropoff',
      arrived_at_dropoff: 'delivered',
      delivered: 'delivered',
      cancelled: 'cancelled',
    };

    const nextStatus = flow[activeOrder.status] || activeOrder.status;
    setActiveOrder({
      ...activeOrder,
      status: nextStatus,
    });
  };

  const completeDeliveryWithOtp = (enteredOtp: string): boolean => {
    if (!activeOrder) return false;
    // Accept valid OTP or default '1234'
    if (enteredOtp === activeOrder.otp || enteredOtp === '1234') {
      const completedOrder: Order = {
        ...activeOrder,
        status: 'delivered',
        timestamp: 'Just now',
      };

      // Add to completed orders
      setOrdersHistory((prev) => [completedOrder, ...prev]);

      // Update earnings
      const orderEarnings = activeOrder.earnings || 45;
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

      // Add notification alert
      const newAlert: AlertNotification = {
        id: `alert-${Date.now()}`,
        title: "✅ Delivery Complete",
        message: `Order #${activeOrder.orderNumber} delivered. ₹${orderEarnings} added to wallet!`,
        time: "Just now",
        type: "payout",
        read: false,
        amount: orderEarnings,
      };
      setAlerts((prev) => [newAlert, ...prev]);

      setActiveOrder(null);
      return true;
    }
    return false;
  };

  const triggerMockOrder = () => {
    const randomEarn = Math.floor(Math.random() * 35) + 40;
    const randomDistance = (Math.random() * 2 + 1.2).toFixed(1);
    const mock: Order = {
      id: `req-${Date.now()}`,
      orderNumber: `SN${Math.floor(10000 + Math.random() * 90000)}`,
      customerName: ["Rahul Sharma", "Ananya Verma", "Karthik Iyer", "Sneha Patel"][Math.floor(Math.random() * 4)],
      customerPhone: "+91 98765 00000",
      customerAvatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuBQm3F-EF8KMdfUn1CQ9_0AUu0c5Anids2usYM_zIsXx7e0kAQfYRu8ya1d-UFWak5O28XmbayOqGMxNHtc59lxyiIwhncjrY8XDG12i2tRQ5ZZnKkH5mEp0s_f52f09hRiNQGIcV2D4704CLIlRGfnLt7iMMRjWFYILDYbh8oZVpMKr6lbRp4SFioMcFer9PvsJgqi85zB3_zM1EKPWzOuaozxNddoYAjVKl88_tl8Ka9Dcu8_200q0w",
      restaurantName: "Spice Route Restaurant",
      restaurantAddress: "124 Culinary Blvd, Food District",
      deliveryAddress: "Apt 4B, Serenity Towers, Park View",
      distanceKm: parseFloat(randomDistance),
      estimatedMinutes: Math.floor(parseFloat(randomDistance) * 3) + 4,
      earnings: randomEarn,
      items: [
        { name: "Chicken Tikka Masala", quantity: 1, price: 280 },
        { name: "Garlic Naan", quantity: 2, price: 90 },
      ],
      status: "pending",
      otp: "1234",
      timestamp: "Just now",
      paymentMethod: "Prepaid UPI",
    };
    setIncomingOrder(mock);
  };

  const updateRiderProfile = (updates: Partial<RiderProfile>) => {
    setRider((prev) => ({ ...prev, ...updates }));
  };

  const simulateApproval = () => {
    setRider((prev) => ({
      ...prev,
      isVerified: true,
      verificationStep: 4,
    }));
  };

  const cashoutEarnings = (amount: number): boolean => {
    if (amount <= 0 || amount > earnings.today) return false;
    setEarnings((prev) => ({
      ...prev,
      today: prev.today - amount,
    }));
    const newAlert: AlertNotification = {
      id: `alert-cashout-${Date.now()}`,
      title: "💸 Instant Cashout Successful",
      message: `₹${amount} transferred to UPI ${rider.upiId}`,
      time: "Just now",
      type: "payout",
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
        completeDeliveryWithOtp,
        triggerMockOrder,
        updateRiderProfile,
        simulateApproval,
        cashoutEarnings,
        markAlertAsRead,
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
