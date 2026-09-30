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
  const iconColorMap = {
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-200",
    blue: "bg-blue-50 text-blue-600 border-blue-200",
    amber: "bg-amber-50 text-amber-600 border-amber-200",
    purple: "bg-purple-50 text-purple-600 border-purple-200",
    rose: "bg-rose-50 text-rose-600 border-rose-200",
  };

  return (
    <div
      className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/90 p-5 shadow-xs transition-all hover:shadow-md hover:border-slate-300"
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{title}</p>
          <p className="text-3xl font-black tracking-tight text-slate-900">{value}</p>
        </div>
        <div className={`rounded-xl p-2.5 border shadow-2xs ${iconColorMap[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {(subtitle || trend) && (
        <div className="mt-3 flex items-center justify-between text-xs">
          {subtitle && <span className="text-slate-500 font-medium">{subtitle}</span>}
          {trend && (
            <span
              className={`font-bold font-mono px-2 py-0.5 rounded text-[11px] border ${
                trendPositive
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-rose-50 text-rose-700 border-rose-200"
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
