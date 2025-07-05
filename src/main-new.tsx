import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
// import App from './App.tsx'  // Sistema anterior con localStorage
import AppNew from './AppNew.tsx'  // Nuevo sistema con backend

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppNew />
  </StrictMode>,
)
