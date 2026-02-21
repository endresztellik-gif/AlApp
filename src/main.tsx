import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from '@/app/App'
import '@/i18n'
import './index.css'
import { supabase } from '@/lib/supabase'

// Debugging: Expose supabase to window
(window as Window & { supabase?: typeof supabase }).supabase = supabase

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
