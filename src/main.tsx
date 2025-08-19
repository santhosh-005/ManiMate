import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import Studio from './Studio.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode >
    <App />
    {/* <Studio /> */}
  </StrictMode>,
)
