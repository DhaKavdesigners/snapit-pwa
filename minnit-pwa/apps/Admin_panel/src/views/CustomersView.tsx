import React, { useState } from "react";
import {
  Users,
  Search,
  Phone,
  MessageCircle,
  MapPin,
  ShieldCheck,
  ShieldAlert,
  Package,
  Calendar,
} from "lucide-react";
import { useAdminStore } from "../store/useAdminStore";

export const CustomersView: React.FC = () => {
  const { customers, orders, updateCustomerVerification } = useAdminStore();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      c.address_line1?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.landmark?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search customers by name, phone, address, or landmark..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white"
          />
        </div>

        <div className="text-xs text-slate-500 font-bold">
          Total Registered Users: <span className="text-emerald-700 font-mono">{customers.length}</span>
        </div>
      </div>

      {/* Customers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filteredCustomers.map((cust) => {
          const userOrders = orders.filter(
            (o) => o.customer_id === cust.id || o.recipient_phone === cust.phone
          );
          const isVerified = cust.delivery_verified !== false;

          return (
            <div
              key={cust.id}
              className="rounded-3xl bg-white border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-300 transition-all"
            >
              {/* Customer Header */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-300 flex items-center justify-center font-black text-emerald-700 text-sm">
                      {cust.name ? cust.name.slice(0, 2).toUpperCase() : "VK"}
                    </div>
                    <div>
                      <h3 className="font-black text-sm text-slate-900 leading-tight">
                        {cust.name || "Minnit Customer"}
                      </h3>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">{cust.phone}</p>
                    </div>
                  </div>

                  {/* Verification Toggle */}
                  <button
                    onClick={() => updateCustomerVerification(cust.id, !isVerified)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-black transition-all cursor-pointer border ${
                      isVerified
                        ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                        : "bg-amber-50 text-amber-700 border-amber-300"
                    }`}
                  >
                    {isVerified ? "✓ Verified" : "Unverified"}
                  </button>
                </div>

                {/* Delivery Address Details */}
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1.5 text-xs text-slate-700">
                  <div className="flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-slate-900 leading-tight">
                        {cust.address_line1 || "No primary address recorded"}
                      </p>
                      {cust.address_line2 && (
                        <p className="text-[11px] text-slate-500 mt-0.5">{cust.address_line2}</p>
                      )}
                      {cust.landmark && (
                        <p className="text-[10px] text-amber-700 font-medium mt-0.5">
                          Landmark: {cust.landmark}
                        </p>
                      )}
                      {cust.pincode && (
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                          PIN: {cust.pincode}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-slate-500">
                    <span>Lifetime Orders:</span>
                    <span className="font-mono font-bold text-emerald-600">
                      {userOrders.length} Orders
                    </span>
                  </div>
                </div>
              </div>

              {/* Direct Actions */}
              <div className="pt-3 border-t border-slate-200 flex items-center gap-2">
                <a
                  href={`https://wa.me/91${cust.phone.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-xl transition-all border border-emerald-200"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>

                <a
                  href={`tel:${cust.phone}`}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all border border-slate-200"
                >
                  <Phone className="w-3.5 h-3.5 text-slate-600" />
                  <span>Call User</span>
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
