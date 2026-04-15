import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { TicketsProvider } from './context/TicketsContext'

createRoot(document.getElementById('root')!).render(
  <TicketsProvider>
    <App />
  </TicketsProvider>,
)
