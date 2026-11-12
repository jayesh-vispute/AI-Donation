import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import './i18n/i18n.js';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { PWAProvider } from './contexts/PWAContext.jsx';
// In production, VitePWA automatically injects registerSW script via injectRegister: 'auto'
// Add safe fallback for environments supporting Service Workers
if ('serviceWorker' in navigator && typeof window !== 'undefined' && import.meta.env?.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {});
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <PWAProvider>
          <App />
        </PWAProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
