import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { SidebarProvider } from './context/SidebarContext.jsx'
import { I18nProvider } from './context/I18nContext.jsx'
import './index.css'

if ('serviceWorker' in navigator) {
  if (import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    })
  } else {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => registration.unregister())
    })
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
  <I18nProvider>
  <AuthProvider>
    <SidebarProvider>
      <App />
    </SidebarProvider>
  </AuthProvider>
  </I18nProvider>
</StrictMode>,
)
