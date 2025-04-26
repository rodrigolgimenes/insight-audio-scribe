
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { DeviceManagerProvider } from './providers/DeviceManagerProvider'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <DeviceManagerProvider>
      <App />
    </DeviceManagerProvider>
  </React.StrictMode>,
)
