import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { supabase } from './lib/supabase'

// Baav: We'll implement the basic Shop Counter here.

const playPendingOrderAlarm = () => {
  console.log("ALARM! New pending order arrived!");
  // Play sound implementation here
}

const ShopCounter = () => {
  const [activeQueue, setActiveQueue] = useState<any[]>([])
  const merchantId = 'd4444444-4444-4444-4444-444444444444'

  useEffect(() => {
    // 1. Initial Fetch
    const fetchActiveOrders = async () => {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('merchant_id', merchantId)
        .eq('status', 'PLACED')
      
      if (data) {
        setActiveQueue(data)
      }
    }
    fetchActiveOrders()

    // 2. Realtime Subscription
    const channel = supabase
      .channel('merchant_active_queue')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `merchant_id=eq.${merchantId}`
        },
        (payload) => {
          const newOrder = payload.new;
          if (newOrder.status === 'PLACED') {
            setActiveQueue(prev => [...prev, newOrder])
            playPendingOrderAlarm()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', padding: '2rem' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>⚡ SnapIt Merchant Queue</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {activeQueue.length === 0 ? (
          <p style={{ color: '#6B7280' }}>No pending orders.</p>
        ) : (
          activeQueue.map(order => (
            <div key={order.id} style={{ border: '1px solid #E5E7EB', padding: '1rem', borderRadius: '0.5rem' }}>
              <h2 style={{ fontWeight: 600 }}>Order ID: {order.display_id}</h2>
              <p>Total: {order.grand_total_paise / 100} INR</p>
              <p style={{ color: 'red', fontWeight: 600 }}>Status: {order.status}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ShopCounter />
  </React.StrictMode>,
)
