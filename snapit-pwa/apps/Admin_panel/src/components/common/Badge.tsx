import React from "react";
import { OrderStatus } from "../../types/admin";

interface BadgeProps {
  status?: OrderStatus | string;
  type?: "status" | "category" | "custom";
  className?: string;
  children?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ status, type = "status", className = "", children }) => {
  if (type === "custom") {
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${className}`}>
        {children}
      </span>
    );
  }

  if (type === "category") {
    const isFood = (status || "").toLowerCase() === "food";
    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider ${
          isFood
            ? "bg-amber-50 text-amber-800 border border-amber-300"
            : "bg-emerald-50 text-emerald-800 border border-emerald-300"
        } ${className}`}
      >
        <span>{isFood ? "🍽️" : "🛒"}</span>
        <span>{status}</span>
      </span>
    );
  }

  // Order status styling
  const getStatusColor = (s: string) => {
    switch (s?.toUpperCase()) {
      case "PLACED":
      case "PENDING":
        return "bg-amber-50 text-amber-800 border-amber-300 animate-pulse";
      case "ACCEPTED":
      case "PREPARING":
        return "bg-blue-50 text-blue-800 border-blue-300";
      case "READY":
      case "READY_FOR_PICKUP":
      case "OUT_OF_SHOP":
        return "bg-purple-50 text-purple-800 border-purple-300";
      case "OUT_FOR_DELIVERY":
      case "PICKED_UP":
      case "HANDED_OVER":
        return "bg-indigo-50 text-indigo-800 border-indigo-300";
      case "DELIVERED":
        return "bg-emerald-50 text-emerald-800 border-emerald-300 font-bold";
      case "CANCELLED":
      case "REJECTED":
        return "bg-rose-50 text-rose-800 border-rose-300";
      default:
        return "bg-slate-100 text-slate-700 border-slate-300";
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-bold tracking-wider uppercase border shadow-2xs ${getStatusColor(
        status || ""
      )} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      <span>{status || children}</span>
    </span>
  );
};
