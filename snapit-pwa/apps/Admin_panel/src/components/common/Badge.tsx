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
            ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
            : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
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
        return "bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse";
      case "ACCEPTED":
      case "PREPARING":
        return "bg-blue-500/20 text-blue-300 border-blue-500/40";
      case "READY":
      case "READY_FOR_PICKUP":
      case "OUT_OF_SHOP":
        return "bg-purple-500/20 text-purple-300 border-purple-500/40";
      case "OUT_FOR_DELIVERY":
      case "PICKED_UP":
      case "HANDED_OVER":
        return "bg-indigo-500/20 text-indigo-300 border-indigo-500/40";
      case "DELIVERED":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
      case "CANCELLED":
      case "REJECTED":
        return "bg-rose-500/20 text-rose-300 border-rose-500/40";
      default:
        return "bg-slate-700/50 text-slate-300 border-slate-600";
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
