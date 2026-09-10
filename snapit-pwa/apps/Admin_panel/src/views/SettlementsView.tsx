import React, { useState, useMemo } from "react";
import {
  Receipt,
  Search,
  Download,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowUpRight,
  CreditCard,
  Building,
  Store,
  DollarSign,
  TrendingUp,
  Calendar,
  Filter,
  Check,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  FileText,
} from "lucide-react";
import { useAdminStore } from "../store/useAdminStore";
import { AdminStore, AdminOrder, StoreSettlementRecord } from "../types/admin";
import { Modal } from "../components/common/Modal";

interface SettlementsViewProps {
  initialStoreId?: string;
}

export const SettlementsView: React.FC<SettlementsViewProps> = ({ initialStoreId }) => {
  const { stores, orders, settlements, recordStorePayout } = useAdminStore();

  const [selectedStoreId, setSelectedStoreId] = useState<string>(initialStoreId || "ALL");
  const [dateFilter, setDateFilter] = useState<string>("TODAY");
  const [paymentModeFilter, setPaymentModeFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Payout Execution Modal State
  const [payoutModalStore, setPayoutModalStore] = useState<AdminStore | null>(null);
  const [payoutForm, setPayoutForm] = useState({
    amount_rupees: 0,
    utr_reference: "",
    payment_method: "UPI",
    notes: "",
  });

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  // Helper to compute pure goods total for an order (in paise)
  const getOrderGoodsTotalPaise = (order: AdminOrder): number => {
    if (!order.items || order.items.length === 0) return order.estimated_total || 0;
    const subtotal = order.items.reduce((sum: number, it: any) => {
      const pricePaise = it.price_paise || it.price || 0;
      return sum + pricePaise * (it.quantity || 1);
    }, 0);
    return subtotal > 0 ? subtotal : order.estimated_total || 0;
  };

  // Date Filtering Logic
  const isOrderInDateRange = (orderDateStr: string, range: string): boolean => {
    if (range === "ALL_TIME") return true;
    const orderDate = new Date(orderDateStr);
    const now = new Date();

    if (range === "TODAY") {
      return (
        orderDate.getFullYear() === now.getFullYear() &&
        orderDate.getMonth() === now.getMonth() &&
        orderDate.getDate() === now.getDate()
      );
    }

    if (range === "YESTERDAY") {
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      return (
        orderDate.getFullYear() === yesterday.getFullYear() &&
        orderDate.getMonth() === yesterday.getMonth() &&
        orderDate.getDate() === yesterday.getDate()
      );
    }

    if (range === "LAST_7_DAYS") {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return orderDate >= sevenDaysAgo;
    }

    if (range === "THIS_MONTH") {
      return (
        orderDate.getFullYear() === now.getFullYear() &&
        orderDate.getMonth() === now.getMonth()
      );
    }

    return true;
  };

  // Filtered orders for ledger
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      // Store filter
      if (selectedStoreId !== "ALL" && o.store_id !== selectedStoreId) return false;

      // Date filter
      if (!isOrderInDateRange(o.created_at, dateFilter)) return false;

      // Payment mode filter
      if (paymentModeFilter !== "ALL") {
        const method = (o.payment_method || "UPI_NOW").toUpperCase();
        if (paymentModeFilter === "UPI" && !method.includes("UPI")) return false;
        if (paymentModeFilter === "COD" && !method.includes("COD") && !method.includes("CASH")) return false;
      }

      // Order status filter
      if (statusFilter === "DELIVERED" && o.status !== "DELIVERED") return false;
      if (statusFilter === "REJECTED" && !["REJECTED", "CANCELLED"].includes(o.status)) return false;

      // Search query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesId = o.id.toLowerCase().includes(q);
        const matchesCustomer = (o.recipient_name || "").toLowerCase().includes(q);
        const matchesPhone = (o.recipient_phone || "").includes(q);
        const matchesItem = (o.items || []).some((it: any) => (it.name || "").toLowerCase().includes(q));
        if (!matchesId && !matchesCustomer && !matchesPhone && !matchesItem) return false;
      }

      return true;
    });
  }, [orders, selectedStoreId, dateFilter, paymentModeFilter, statusFilter, searchQuery]);

  // Per-store financial calculations
  const storeFinancials = useMemo(() => {
    return stores.map((store) => {
      const storeAllOrders = orders.filter(
        (o) => o.store_id === store.id && isOrderInDateRange(o.created_at, dateFilter)
      );

      const fulfilledOrders = storeAllOrders.filter((o) => o.status === "DELIVERED");
      const rejectedOrders = storeAllOrders.filter((o) => ["REJECTED", "CANCELLED"].includes(o.status));

      const grossPaise = fulfilledOrders.reduce((sum, o) => sum + getOrderGoodsTotalPaise(o), 0);
      const lostPaise = rejectedOrders.reduce((sum, o) => sum + getOrderGoodsTotalPaise(o), 0);

      // Platform commission (0% default)
      const commissionPercent = 0;
      const commissionPaise = Math.round(grossPaise * (commissionPercent / 100));
      const netPayablePaise = grossPaise - commissionPaise;
      const netPayableRupees = Math.round(netPayablePaise / 100);

      // Check if settled in this period
      const storeSettlement = settlements.find(
        (s) => s.store_id === store.id && s.period_label === dateFilter
      );

      return {
        store,
        totalOrders: storeAllOrders.length,
        fulfilledOrdersCount: fulfilledOrders.length,
        rejectedOrdersCount: rejectedOrders.length,
        grossPaise,
        grossRupees: Math.round(grossPaise / 100),
        lostPaise,
        lostRupees: Math.round(lostPaise / 100),
        commissionRupees: Math.round(commissionPaise / 100),
        netPayableRupees,
        netPayablePaise,
        isSettled: !!storeSettlement,
        settlementRecord: storeSettlement,
      };
    });
  }, [stores, orders, settlements, dateFilter]);

  // Global KPIs across filtered stores
  const globalKPIs = useMemo(() => {
    const relevantStores =
      selectedStoreId === "ALL"
        ? storeFinancials
        : storeFinancials.filter((sf) => sf.store.id === selectedStoreId);

    const totalGMVRupees = relevantStores.reduce((sum, s) => sum + s.grossRupees, 0);
    const totalPayableRupees = relevantStores.reduce((sum, s) => sum + s.netPayableRupees, 0);
    const totalFulfilledCount = relevantStores.reduce((sum, s) => sum + s.fulfilledOrdersCount, 0);
    const totalSettledRupees = relevantStores
      .filter((s) => s.isSettled)
      .reduce((sum, s) => sum + s.netPayableRupees, 0);
    const pendingPayoutRupees = totalPayableRupees - totalSettledRupees;

    return {
      totalGMVRupees,
      totalPayableRupees,
      totalFulfilledCount,
      totalSettledRupees,
      pendingPayoutRupees: Math.max(0, pendingPayoutRupees),
    };
  }, [storeFinancials, selectedStoreId]);

  // Handle opening payout modal
  const handleOpenPayout = (storeData: typeof storeFinancials[0]) => {
    setPayoutModalStore(storeData.store);
    setPayoutForm({
      amount_rupees: storeData.netPayableRupees,
      utr_reference: `UPI/${Date.now().toString().slice(-8)}`,
      payment_method: "UPI",
      notes: `Settlement for ${dateFilter} (${storeData.fulfilledOrdersCount} orders)`,
    });
  };

  // Handle confirming payout
  const handleConfirmPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payoutModalStore) return;

    await recordStorePayout({
      store_id: payoutModalStore.id,
      store_name: payoutModalStore.name,
      amount_rupees: Number(payoutForm.amount_rupees),
      amount_paise: Number(payoutForm.amount_rupees) * 100,
      utr_reference: payoutForm.utr_reference.trim() || `REF-${Date.now()}`,
      payment_method: payoutForm.payment_method,
      settled_by: "Admin Command Center",
      period_label: dateFilter,
      orders_count: filteredOrders.filter((o) => o.store_id === payoutModalStore.id && o.status === "DELIVERED").length,
      notes: payoutForm.notes.trim(),
    });

    setPayoutModalStore(null);
  };

  // Export Ledger to CSV
  const handleExportCSV = () => {
    const headers = [
      "Order ID",
      "Store ID",
      "Store Name",
      "Date & Time",
      "Customer Name",
      "Phone",
      "Status",
      "Payment Mode",
      "Payment Status",
      "Gross Amount (Rupees)",
      "Net Store Share (Rupees)",
    ];

    const rows = filteredOrders.map((o) => {
      const storeObj = stores.find((s) => s.id === o.store_id);
      const grossPaise = getOrderGoodsTotalPaise(o);
      const grossRupees = (grossPaise / 100).toFixed(2);
      return [
        o.id,
        o.store_id,
        `"${storeObj?.name || o.store_id}"`,
        `"${new Date(o.created_at).toLocaleString()}"`,
        `"${o.recipient_name || "Customer"}"`,
        o.recipient_phone || "",
        o.status,
        o.payment_method || "UPI_NOW",
        o.payment_status || "PAID",
        grossRupees,
        grossRupees,
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `SnapIt_Store_Ledger_${dateFilter}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* 1. Global Financial Overview KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gross Sales (GMV)</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-white mt-2">₹{globalKPIs.totalGMVRupees.toLocaleString()}</p>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            {globalKPIs.totalFulfilledCount} fulfilled store orders
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Pending Payout Due</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-amber-400 mt-2">₹{globalKPIs.pendingPayoutRupees.toLocaleString()}</p>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            To be transferred via UPI / Bank
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Total Settled</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-blue-400 mt-2">₹{globalKPIs.totalSettledRupees.toLocaleString()}</p>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Verified payouts executed
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Platform Take Rate</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-purple-400 mt-2">0%</p>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Zero-commission merchant promo
          </p>
        </div>
      </div>

      {/* 2. Filter & Selection Toolbar */}
      <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Store Selector */}
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-emerald-400 shrink-0" />
            <select
              value={selectedStoreId}
              onChange={(e) => setSelectedStoreId(e.target.value)}
              className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-emerald-500 cursor-pointer min-w-[200px]"
            >
              <option value="ALL">🏪 All Partner Stores ({stores.length})</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.id}) • {s.category || "FOOD"}
                </option>
              ))}
            </select>
          </div>

          {/* Date Period Selector */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="TODAY">📅 Today (11:00 PM Settlement)</option>
              <option value="YESTERDAY">Yesterday</option>
              <option value="LAST_7_DAYS">Last 7 Days</option>
              <option value="THIS_MONTH">This Month</option>
              <option value="ALL_TIME">All Time History</option>
            </select>
          </div>

          {/* Payment Mode Selector */}
          <select
            value={paymentModeFilter}
            onChange={(e) => setPaymentModeFilter(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-slate-300 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="ALL">💳 All Payment Modes</option>
            <option value="UPI">Prepaid UPI Only</option>
            <option value="COD">Cash on Delivery (COD)</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-slate-300 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="ALL">📦 All Orders Status</option>
            <option value="DELIVERED">✅ Delivered Only</option>
            <option value="REJECTED">❌ Cancelled / Rejected Only</option>
          </select>
        </div>

        {/* Action: Export CSV */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-all cursor-pointer border border-slate-700"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 3. Individual Store Settlement & Payout Summary Cards */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="font-black text-sm text-white uppercase tracking-wider flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span>Store Settlement Summary & Payout Control</span>
          </h3>
          <span className="text-xs text-slate-400">
            Cycle: <strong className="text-white">{dateFilter}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {(selectedStoreId === "ALL"
            ? storeFinancials
            : storeFinancials.filter((sf) => sf.store.id === selectedStoreId)
          ).map((sf) => {
            const store = sf.store;
            const upiSuggested = store.phone ? `${store.phone}@upi` : "store@upi";

            return (
              <div
                key={store.id}
                className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg flex flex-col justify-between space-y-4 hover:border-slate-700 transition-all"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-white p-1 border border-slate-700 overflow-hidden shrink-0">
                        <img
                          src={store.logo_url || "https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=300"}
                          alt={store.name}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=300";
                          }}
                          className="w-full h-full object-cover rounded-xl"
                        />
                      </div>
                      <div>
                        <h4 className="font-black text-sm text-white leading-tight">{store.name}</h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono text-[10px] text-slate-400 font-bold">
                            {store.id}
                          </span>
                          <span className="text-[9px] uppercase font-black px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                            {store.category || "FOOD"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${
                        sf.isSettled
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                          : sf.netPayableRupees > 0
                          ? "bg-amber-500/20 text-amber-300 border-amber-500/30 animate-pulse"
                          : "bg-slate-800 text-slate-400 border-slate-700"
                      }`}
                    >
                      {sf.isSettled ? "✓ Settled" : sf.netPayableRupees > 0 ? "● Due for Payout" : "No Sales"}
                    </span>
                  </div>

                  {/* Financial Breakdown Box */}
                  <div className="mt-4 bg-slate-950 p-3 rounded-2xl border border-slate-800/80 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-400">Fulfilled Orders:</span>
                      <span className="font-bold text-white">{sf.fulfilledOrdersCount} orders</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-400">Gross Goods Sales:</span>
                      <span className="font-bold text-white">₹{sf.grossRupees.toLocaleString()}</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-400">Platform Fee (0%):</span>
                      <span className="font-bold text-slate-500">₹0</span>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                      <span className="font-bold text-slate-200">Net Amount to Store:</span>
                      <span className="font-black text-emerald-400 text-base">
                        ₹{sf.netPayableRupees.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Bank / UPI Payout Info */}
                  <div className="mt-3 text-xs text-slate-400 space-y-1">
                    <div className="flex items-center justify-between">
                      <span>UPI ID / Transfer Account:</span>
                      <div className="flex items-center gap-1 font-mono font-bold text-white">
                        <span>{store.upi_id || upiSuggested}</span>
                        <button
                          onClick={() => handleCopy(store.upi_id || upiSuggested, `upi_${store.id}`)}
                          className="text-slate-500 hover:text-white cursor-pointer"
                          title="Copy UPI ID"
                        >
                          {copiedKey === `upi_${store.id}` ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <CreditCard className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Settlement Action Button */}
                <div className="pt-3 border-t border-slate-800 flex items-center gap-2">
                  <button
                    onClick={() => handleOpenPayout(sf)}
                    className={`w-full py-2 px-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm ${
                      sf.isSettled
                        ? "bg-slate-800 hover:bg-slate-700 text-slate-300"
                        : "bg-emerald-500 hover:bg-emerald-400 text-slate-950"
                    }`}
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>{sf.isSettled ? "View / Re-settle Payout" : `Settle ₹${sf.netPayableRupees}`}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Granular Itemized Transaction & Orders Ledger Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-black text-base text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>Itemized Order Transactions Ledger</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Live audit trail of all store sales, items ordered, and payment statuses
            </p>
          </div>

          <div className="relative max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search order ID, customer, item..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase font-black tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Order ID</th>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Store</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Items & Quantities</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Gross Total</th>
                <th className="px-4 py-3 text-right font-black text-emerald-400">Store Payout</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-500 text-xs">
                    No order transactions found matching the selected filters.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o) => {
                  const storeObj = stores.find((s) => s.id === o.store_id);
                  const goodsTotalPaise = getOrderGoodsTotalPaise(o);
                  const goodsTotalRupees = (goodsTotalPaise / 100).toFixed(0);

                  const isFulfilled = o.status === "DELIVERED";
                  const isRejected = ["REJECTED", "CANCELLED"].includes(o.status);

                  return (
                    <tr key={o.id} className="hover:bg-slate-950/40 transition-colors">
                      <td className="px-4 py-3 font-mono font-black text-white">{o.id}</td>
                      <td className="px-4 py-3 text-slate-400 text-[11px] whitespace-nowrap">
                        {new Date(o.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        <span className="block text-[10px] text-slate-500">
                          {new Date(o.created_at).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-white block truncate max-w-[140px]">
                          {storeObj?.name || o.store_id}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">{o.store_id}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-slate-200 block truncate max-w-[130px]">
                          {o.recipient_name || "Registered Customer"}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {o.recipient_phone || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <div className="space-y-0.5">
                          {(o.items || []).map((it: any, idx: number) => (
                            <div key={idx} className="text-[11px] text-slate-300 truncate">
                              <span className="font-bold text-white">{it.quantity}x</span> {it.name}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300">
                          {o.payment_method || "UPI_NOW"}
                        </span>
                        <span className="block text-[9px] text-emerald-400 mt-0.5 font-bold">
                          {o.payment_status || "PAID"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                            isFulfilled
                              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                              : isRejected
                              ? "bg-rose-500/15 text-rose-400 border-rose-500/30"
                              : "bg-blue-500/15 text-blue-400 border-blue-500/30"
                          }`}
                        >
                          {o.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-300">
                        ₹{goodsTotalRupees}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-black text-emerald-400 text-sm">
                        {isFulfilled ? `₹${goodsTotalRupees}` : <span className="text-slate-500 text-xs">₹0</span>}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Settlement Payout History Audit Log */}
      {settlements.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-3">
          <h3 className="font-black text-sm text-white uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Completed Payout Audit History</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase font-black tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-4 py-2.5">Date & Time</th>
                  <th className="px-4 py-2.5">Store</th>
                  <th className="px-4 py-2.5">Amount Paid</th>
                  <th className="px-4 py-2.5">UTR / Reference ID</th>
                  <th className="px-4 py-2.5">Payment Method</th>
                  <th className="px-4 py-2.5">Period Label</th>
                  <th className="px-4 py-2.5">Settled By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {settlements.map((setRecord) => (
                  <tr key={setRecord.id} className="hover:bg-slate-950/40">
                    <td className="px-4 py-2.5 text-slate-400 font-mono text-[11px]">
                      {new Date(setRecord.settled_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5 font-bold text-white">{setRecord.store_name}</td>
                    <td className="px-4 py-2.5 font-black text-emerald-400 font-mono text-sm">
                      ₹{setRecord.amount_rupees.toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-amber-300 font-bold">
                      {setRecord.utr_reference}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 text-[10px] font-bold">
                        {setRecord.payment_method}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-400">{setRecord.period_label}</td>
                    <td className="px-4 py-2.5 text-slate-500">{setRecord.settled_by}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Record Payout / Settlement */}
      <Modal
        isOpen={!!payoutModalStore}
        onClose={() => setPayoutModalStore(null)}
        title={`Execute Payout — ${payoutModalStore?.name}`}
        subtitle="Confirm and record payment transfer to the merchant partner"
        maxWidth="md"
      >
        <form onSubmit={handleConfirmPayout} className="space-y-4">
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Merchant Store:</span>
              <span className="font-bold text-white">{payoutModalStore?.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Store Phone:</span>
              <span className="font-mono text-white">{payoutModalStore?.phone || "—"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Reconciliation Period:</span>
              <span className="font-bold text-amber-400">{dateFilter}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Payout Amount in Rupees (₹) *
            </label>
            <input
              type="number"
              required
              min="1"
              value={payoutForm.amount_rupees}
              onChange={(e) => setPayoutForm({ ...payoutForm, amount_rupees: Number(e.target.value) })}
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm font-black text-emerald-400 focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Payment Method</label>
              <select
                value={payoutForm.payment_method}
                onChange={(e) => setPayoutForm({ ...payoutForm, payment_method: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="UPI">Direct UPI (GPay / PhonePe)</option>
                <option value="IMPS">Bank Transfer (IMPS)</option>
                <option value="NEFT">Bank Transfer (NEFT)</option>
                <option value="CASH">Cash Over Counter</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">UTR / Ref Number *</label>
              <input
                type="text"
                required
                value={payoutForm.utr_reference}
                onChange={(e) => setPayoutForm({ ...payoutForm, utr_reference: e.target.value })}
                placeholder="e.g. UPI/425619873421"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Notes / Audit Memo</label>
            <input
              type="text"
              value={payoutForm.notes}
              onChange={(e) => setPayoutForm({ ...payoutForm, notes: e.target.value })}
              placeholder="e.g. Settled after 11:00 PM reconciliation"
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setPayoutModalStore(null)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all cursor-pointer"
            >
              Confirm Settlement & Save Record →
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
