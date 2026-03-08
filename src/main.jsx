import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import Preloader from './components/layout/Preloader.jsx'

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

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
