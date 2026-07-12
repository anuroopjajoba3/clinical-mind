import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import LandingPage from './landing/LandingPage'
import './index.css'

const isAppRoute = window.location.pathname.startsWith('/app')

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {isAppRoute ? <App /> : <LandingPage />}
  </React.StrictMode>
)
