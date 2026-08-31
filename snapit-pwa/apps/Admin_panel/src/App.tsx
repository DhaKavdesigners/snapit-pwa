import React, { useEffect } from "react";
import { AdminLayout } from "./components/layout/AdminLayout";
import { useAdminStore } from "./store/useAdminStore";

export function App() {
  const { fetchInitialData, initRealtimeSubscription } = useAdminStore();

  useEffect(() => {
    fetchInitialData();
    const cleanupRealtime = initRealtimeSubscription();
    return () => {
      cleanupRealtime();
    };
  }, [fetchInitialData, initRealtimeSubscription]);

  return <AdminLayout />;
}

export default App;
