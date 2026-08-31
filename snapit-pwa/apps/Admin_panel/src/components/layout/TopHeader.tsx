import React from "react";
import { RefreshCw, Radio, Bell, ShieldCheck } from "lucide-react";
import { useAdminStore } from "../../store/useAdminStore";

interface TopHeaderProps {
  title: string;
  subtitle?: string;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ title, subtitle }) => {
  const { isRealtimeConnected, lastSyncTime, fetchInitialData, isLoading } = useAdminStore();

  return (
    <header className="h-16 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-20">
      <div>
        <h1 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
          <span>{title}</span>
        </h1>
        {subtitle && <p className="text-xs text-slate-400 font-medium">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {/* Realtime Status Pill */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
            isRealtimeConnected
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
              : "bg-amber-500/10 text-amber-400 border-amber-500/30"
          }`}
        >
          <Radio className={`w-3 h-3 ${isRealtimeConnected ? "animate-pulse text-emerald-400" : "text-amber-400"}`} />
          <span>{isRealtimeConnected ? "LIVE SYNC" : "CONNECTING..."}</span>
        </div>

        {/* Refresh button */}
        <button
          onClick={() => fetchInitialData()}
          disabled={isLoading}
          title="Force reload all data"
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer border border-slate-700/60 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-emerald-400" : ""}`} />
        </button>

        {lastSyncTime && (
          <span className="text-[11px] font-mono text-slate-500 hidden sm:inline">
            Sync: {lastSyncTime}
          </span>
        )}

        {/* Admin Badge */}
        <div className="flex items-center gap-2 pl-3 border-l border-slate-800">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-black text-xs">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="hidden md:block">
            <p className="text-xs font-bold text-white leading-tight">Master Admin</p>
            <p className="text-[10px] text-slate-400">Superuser</p>
          </div>
        </div>
      </div>
    </header>
  );
};
