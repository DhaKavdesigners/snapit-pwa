import React from "react";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: string;
  trendPositive?: boolean;
  color?: "emerald" | "blue" | "amber" | "purple" | "rose";
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendPositive = true,
  color = "emerald",
}) => {
  const colorMap = {
    emerald: "from-emerald-500/20 to-teal-500/5 border-emerald-500/30 text-emerald-400",
    blue: "from-blue-500/20 to-indigo-500/5 border-blue-500/30 text-blue-400",
    amber: "from-amber-500/20 to-yellow-500/5 border-amber-500/30 text-amber-400",
    purple: "from-purple-500/20 to-pink-500/5 border-purple-500/30 text-purple-400",
    rose: "from-rose-500/20 to-red-500/5 border-rose-500/30 text-rose-400",
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${colorMap[color]} border p-5 shadow-lg backdrop-blur-md transition-all hover:scale-[1.02] hover:shadow-xl`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{title}</p>
          <p className="text-3xl font-black tracking-tight text-white">{value}</p>
        </div>
        <div className="rounded-xl bg-slate-800/80 p-2.5 border border-slate-700/60 shadow-inner">
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {(subtitle || trend) && (
        <div className="mt-3 flex items-center justify-between text-xs">
          {subtitle && <span className="text-slate-400 font-medium">{subtitle}</span>}
          {trend && (
            <span
              className={`font-bold font-mono px-1.5 py-0.5 rounded ${
                trendPositive ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"
              }`}
            >
              {trend}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
