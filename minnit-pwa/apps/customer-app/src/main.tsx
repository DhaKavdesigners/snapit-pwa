import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { preloadAllMascotImages } from './utils/mascotPreloader'

// Eagerly preload all baby mascots into memory cache
preloadAllMascotImages()

// Register PWA Service Worker for offline support & Play Store APK / TWA compliance
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('Minnit SW registered with scope:', reg.scope);
      })
      .catch((err) => {
        console.warn('Minnit SW registration failed:', err);
      });
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
