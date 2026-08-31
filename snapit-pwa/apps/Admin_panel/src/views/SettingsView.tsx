import React, { useState } from "react";
import {
  Settings,
  Database,
  Radio,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Server,
  Zap,
  ShieldCheck,
} from "lucide-react";
import { useAdminStore } from "../store/useAdminStore";
import { supabase } from "../lib/supabase";

export const SettingsView: React.FC = () => {
  const {
    isRealtimeConnected,
    lastSyncTime,
    orders,
    stores,
    riders,
    products,
    customers,
    fetchInitialData,
    isLoading,
  } = useAdminStore();

  const [pingStatus, setPingStatus] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const testSupabaseConnection = async () => {
    setIsTesting(true);
    const start = performance.now();
    try {
      const { data, error } = await supabase.from("stores").select("id").limit(1);
      const elapsed = Math.round(performance.now() - start);
      if (error) throw error;
      setPingStatus(`🟢 Connected successfully! Latency: ${elapsed}ms`);
    } catch (err: any) {
      setPingStatus(`🔴 Connection error: ${err.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* System Health Status */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl space-y-4">
        <h2 className="text-base font-black text-white flex items-center gap-2">
          <Server className="w-5 h-5 text-emerald-400" />
          <span>Supabase Realtime & Database Engine</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2">
            <p className="text-xs text-slate-400 font-bold uppercase">Realtime WebSockets</p>
            <div className="flex items-center gap-2">
              <span
                className={`w-3 h-3 rounded-full ${
                  isRealtimeConnected ? "bg-emerald-400 animate-ping" : "bg-amber-400"
                }`}
              />
              <span className="font-mono font-black text-sm text-white">
                {isRealtimeConnected ? "CONNECTED (SUBSCRIBED)" : "CONNECTING / RECONNECTING"}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-mono">
              Listening on public.orders, public.stores, public.rider_profiles, public.products
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2">
            <p className="text-xs text-slate-400 font-bold uppercase">Last Sync Timestamp</p>
            <p className="font-mono font-black text-sm text-emerald-400">
              {lastSyncTime || "Initializing..."}
            </p>
            <button
              onClick={() => fetchInitialData()}
              disabled={isLoading}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              <span>Force Full Sync</span>
            </button>
          </div>
        </div>

        {/* Connection Diagnostics Test */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-xs font-bold text-white">Postgres Query Latency Test</p>
            <p className="text-[11px] text-slate-400">
              Ping the live Supabase cluster to check response speed.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {pingStatus && <span className="text-xs font-mono text-slate-300">{pingStatus}</span>}
            <button
              onClick={testSupabaseConnection}
              disabled={isTesting}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-all cursor-pointer border border-slate-700 disabled:opacity-50"
            >
              {isTesting ? "Testing..." : "Test Connection"}
            </button>
          </div>
        </div>
      </div>

      {/* Database Entity Row Counts */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl space-y-4">
        <h2 className="text-base font-black text-white flex items-center gap-2">
          <Database className="w-5 h-5 text-purple-400" />
          <span>Synchronized Database Tables</span>
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-1">
            <p className="text-slate-400 font-bold">orders</p>
            <p className="text-xl font-black font-mono text-emerald-400">{orders.length}</p>
            <p className="text-[10px] text-slate-500">Live records</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-1">
            <p className="text-slate-400 font-bold">stores</p>
            <p className="text-xl font-black font-mono text-purple-400">{stores.length}</p>
            <p className="text-[10px] text-slate-500">Partners</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-1">
            <p className="text-slate-400 font-bold">rider_profiles</p>
            <p className="text-xl font-black font-mono text-blue-400">{riders.length}</p>
            <p className="text-[10px] text-slate-500">Fleet partners</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-1">
            <p className="text-slate-400 font-bold">products</p>
            <p className="text-xl font-black font-mono text-amber-400">{products.length}</p>
            <p className="text-[10px] text-slate-500">Catalog items</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-1">
            <p className="text-slate-400 font-bold">profiles</p>
            <p className="text-xl font-black font-mono text-rose-400">{customers.length}</p>
            <p className="text-[10px] text-slate-500">Customers</p>
          </div>
        </div>
      </div>

      {/* Admin App Metadata */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl space-y-2 text-xs text-slate-400">
        <h3 className="font-black text-sm text-white">Minnit Hyperlocal Architecture</h3>
        <p>• Operational Hub: Kolar Gold Fields (KGF), Karnataka, India</p>
        <p>• Built by Dhakav Designers</p>
        <p>• Realtime updates powered by PostgreSQL Change-Data-Capture (CDC) via Supabase Realtime Channels</p>
      </div>
    </div>
  );
};
