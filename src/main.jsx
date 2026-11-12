import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import Preloader from './components/layout/Preloader.jsx'

function ignoreServiceWorkerRegistrationError() {
  // Push notifications are optional; the app still works if SW registration fails.
}

export function Root() {
  const [isLoading, setIsLoading] = useState(true)
  const [showPreloader, setShowPreloader] = useState(true)

  useEffect(() => {
    const loadingTimer = setTimeout(() => {
      setIsLoading(false)
    }, 1800)

    return () => {
      clearTimeout(loadingTimer)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return
    navigator.serviceWorker.register('/firebase-messaging-sw.js').catch(ignoreServiceWorkerRegistrationError)

    const onMessage = (event) => {
      const data = event?.data
      if (!data || data.type !== 'NAVIGATE') return
      const url = data.url
      if (typeof url !== 'string' || url.trim() === '') return
      window.location.assign(url)
    }
    navigator.serviceWorker.addEventListener('message', onMessage)
    return () => {
      navigator.serviceWorker.removeEventListener('message', onMessage)
    }
  }, [])

  useEffect(() => {
    if (!isLoading) {
      const hideTimer = setTimeout(() => {
        setShowPreloader(false)
      }, 400)

      return () => {
        clearTimeout(hideTimer)
      }
    }
  }, [isLoading])

  return (
    <>
      {showPreloader && <Preloader isDone={!isLoading} />}
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </>
  )
}

function renderApp() {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <Root />
    </StrictMode>,
  )
}

if (import.meta.env.DEV && import.meta.env.VITE_UI_DEMO === 'true') {
  import('./dev/demoApi.js')
    .then(({ installDemoApi }) => installDemoApi(import.meta.env.VITE_API_URL || 'http://localhost:3000'))
    .finally(renderApp)
} else {
  renderApp()
}
