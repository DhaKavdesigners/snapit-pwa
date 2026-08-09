import React from 'react'
import ReactDOM from 'react-dom/client'

// Baav: Your full merchant dashboard will be built here.
// See shared/types/snapit-types.ts for the Order & OrderStatus interfaces.

const App = () => (
  <div style={{ fontFamily: 'Inter, sans-serif', padding: '2rem', textAlign: 'center' }}>
    <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>⚡ SnapIt Merchant Dashboard</h1>
    <p style={{ color: '#6B7280', marginTop: '0.5rem' }}>
      [Baav] — Your store counter app will live here.
    </p>
  </div>
)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
