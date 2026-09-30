import React from "react";
import { RefreshCw, Radio, ShieldCheck, Menu } from "lucide-react";
import { useAdminStore } from "../../store/useAdminStore";
import { PushNotificationToggle } from "../common/PushNotificationToggle";

interface TopHeaderProps {
  title: string;
  subtitle?: string;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ title, subtitle }) => {
  const { isRealtimeConnected, lastSyncTime, fetchInitialData, isLoading } = useAdminStore();

  return (
    <header className="h-14 md:h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 md:px-6 flex items-center justify-between sticky top-0 z-20 shadow-2xs">
      <div className="flex items-center gap-2 md:gap-0">
        <button className="md:hidden p-1.5 -ml-1.5 text-slate-600 hover:bg-slate-100 rounded-lg">
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2 truncate max-w-[140px] sm:max-w-none">
            <span>{title}</span>
          </h1>
          {subtitle && <p className="text-xs text-slate-500 font-medium hidden sm:block">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Realtime Status Pill */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
            isRealtimeConnected
              ? "bg-emerald-50 text-emerald-700 border-emerald-300 font-black"
              : "bg-amber-50 text-amber-700 border-amber-300"
          }`}
        >
          <Radio className={`w-3 h-3 ${isRealtimeConnected ? "animate-pulse text-emerald-600" : "text-amber-600"}`} />
          <span>{isRealtimeConnected ? "LIVE SYNC" : "CONNECTING..."}</span>
        </div>

        {/* Push Notification Toggle */}
        <PushNotificationToggle />

        {/* Refresh button */}
        <button
          onClick={() => fetchInitialData()}
          disabled={isLoading}
          title="Force reload all data"
          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 transition-all cursor-pointer border border-slate-200 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-emerald-600" : ""}`} />
        </button>

        {lastSyncTime && (
          <span className="text-[11px] font-mono text-slate-400 hidden sm:inline font-medium">
            Sync: {lastSyncTime}
          </span>
        )}

        {/* Admin Badge */}
        <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
          <div className="w-8 h-8 rounded-xl bg-slate-950 text-emerald-400 border border-slate-900 flex items-center justify-center font-black text-xs shadow-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="hidden md:block">
            <p className="text-xs font-black text-slate-900 leading-tight">Master Admin</p>
            <p className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">Superuser</p>
          </div>
        </div>
      </div>
    </header>
  );
};

