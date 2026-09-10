import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { preloadAllMascotImages } from './utils/mascotPreloader'

// Eagerly preload all baby mascots into memory cache
preloadAllMascotImages()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
