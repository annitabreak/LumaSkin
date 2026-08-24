import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import '@fontsource-variable/inter'
import './index.css'

// Module-level root survives HMR re-execution within the same module instance.
// For full page reloads a new root is always created fresh.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const g = globalThis as any
if (!g.__lumaskin_root) {
  g.__lumaskin_root = ReactDOM.createRoot(document.getElementById('root')!)
}
const root: ReactDOM.Root = g.__lumaskin_root

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Service worker: production only, so `npm run dev` never serves a stale cache.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}
