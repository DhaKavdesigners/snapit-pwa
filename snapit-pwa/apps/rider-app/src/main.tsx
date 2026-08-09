import React from 'react'
import ReactDOM from 'react-dom/client'

// Suresh: Your full rider logistics dashboard will be built here.
// See shared/types/snapit-types.ts for the Order, Rider, OrderStatus interfaces.

const App = () => (
  <div style={{ fontFamily: 'Inter, sans-serif', padding: '2rem', textAlign: 'center' }}>
    <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>🛵 SnapIt Rider Dashboard</h1>
    <p style={{ color: '#6B7280', marginTop: '0.5rem' }}>
      [Suresh] — Your delivery logistics app will live here.
    </p>
  </div>
)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
