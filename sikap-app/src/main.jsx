import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Hapus StrictMode agar tidak ada double-mount yang mengganggu Supabase auth
createRoot(document.getElementById('root')).render(
  <App />
)
