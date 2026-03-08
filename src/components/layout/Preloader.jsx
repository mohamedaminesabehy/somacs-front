import { useEffect, useState } from 'react'
import logo from '../../assets/logo-removebg-preview.png'

const messages = [
  'Initialisation des modules...',
  'Connexion aux services...',
  'Chargement du tableau de bord...',
  'Préparation de l’espace de travail...',
]

export default function Preloader({ isDone }) {
  const [messageIndex, setMessageIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length)
    }, 450)

    return () => clearInterval(interval)
  }, [])

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-black transition-opacity duration-400 ${
        isDone ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="absolute inset-0 preloader-bg-gradient" aria-hidden="true">
        <div className="absolute inset-0 preloader-bg-overlay" />
        <div className="absolute left-0 right-0 top-1/2 preloader-neon-line" />
      </div>

      <div className="relative flex flex-col items-center gap-6 px-6">
        <div className="flex flex-col items-center gap-3">
          <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-full bg-white shadow-lg flex items-center justify-center">
            <img src={logo} alt="Logo SOMACS" className="h-16 w-16 sm:h-20 sm:w-20 object-contain preloader-logo-animate" />
          </div>
          <div className="text-center">
            <div className="text-xs sm:text-sm font-semibold tracking-[0.25em] text-slate-500 uppercase">SOMACS</div>
            <div className="text-[11px] sm:text-xs text-slate-400">Système de gestion interne</div>
          </div>
        </div>

        <div className="w-full max-w-xs sm:max-w-sm space-y-2">
          <div className="relative h-1.5 overflow-hidden rounded-full bg-slate-200">
            <div className="absolute left-0 top-0 h-full preloader-progress-bar" />
          </div>
          <div className="text-[11px] text-slate-500 font-medium tracking-wide text-center">
            {messages[messageIndex]}
          </div>
        </div>
      </div>
    </div>
  )
}

