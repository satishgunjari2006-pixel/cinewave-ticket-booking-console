import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Purge legacy cached data containing encoding artifacts
try {
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (key && key.startsWith('cinewave_') && !key.includes('_v10')) {
      localStorage.removeItem(key);
    }
  }
} catch (e) {
  // Ignore storage access errors
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
