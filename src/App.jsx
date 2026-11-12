import { lazy, Suspense, useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/layout/Sidebar'
import Header from './components/layout/Header'
import LoginForm from './components/user/LoginForm'
import { NotificationsProvider } from './notifications/NotificationsProvider'
import { getAuthToken, isAuthTokenUsable, logoutSession } from './api/apiClient'
import { consumePendingNotificationUrl } from './utils/pendingNotification'

const UserManagement = lazy(() => import('./pages/user/UserManagement'))
const UserDetails = lazy(() => import('./pages/user/UserDetails'))
const ListMission = lazy(() => import('./pages/mission/ListMission'))
const EmployeeMissions = lazy(() => import('./pages/mission/EmployeeMissions'))
const EmployeeHistory = lazy(() => import('./pages/mission/EmployeeHistory'))
const MissionDetails = lazy(() => import('./pages/mission/MissionDetails'))
const AssignMission = lazy(() => import('./pages/mission/AssignMission'))
const InterventionList = lazy(() => import('./pages/intervention/InterventionList'))
const CreateIntervention = lazy(() => import('./pages/intervention/CreateIntervention'))
const InterventionDetails = lazy(() => import('./pages/intervention/InterventionDetails'))
const OperationsDashboard = lazy(() => import('./pages/dashboard/OperationsDashboard'))
const MachineList = lazy(() => import('./pages/machines/MachineList'))
const MachineForm = lazy(() => import('./pages/machines/MachineForm'))
const MachineDetails = lazy(() => import('./pages/machines/MachineDetails'))
const VehicleList = lazy(() => import('./pages/VehicleList'))
const VehicleDetails = lazy(() => import('./pages/VehicleDetails'))
const CreateVehicle = lazy(() => import('./pages/CreateVehicle'))
const EditVehicle = lazy(() => import('./pages/EditVehicle'))
const ClientsList = lazy(() => import('./pages/clients/ClientsList'))
const ClientDetails360 = lazy(() => import('./pages/clients/ClientDetails360'))

function AppLayout({
  children,
  onToggleSidebar,
  onCloseSidebar,
  isSidebarOpen,
  currentUser,
  onLogout,
}) {
  return (
    <div className="flex flex-col min-h-screen bg-canvas lg:flex-row">
      <Sidebar
        isMobileOpen={isSidebarOpen}
        onClose={onCloseSidebar}
        currentUser={currentUser}
        onLogout={onLogout}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <NotificationsProvider>
          <Header onToggleSidebar={onToggleSidebar} currentUser={currentUser} onLogout={onLogout} />
          <main className="flex-1 overflow-y-auto scroll-smooth">
            <Suspense fallback={null}>{children}</Suspense>
          </main>
        </NotificationsProvider>
      </div>
    </div>
  )
}

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [pendingNotificationUrl, setPendingNotificationUrl] = useState(null)
  const [pendingChecked, setPendingChecked] = useState(false)
  const [pendingConsumed, setPendingConsumed] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (typeof window === 'undefined') {
      return false
    }
    return isAuthTokenUsable(getAuthToken())
  })
  const [currentUser, setCurrentUser] = useState(() => {
    if (typeof window === 'undefined') {
      return null
    }
    const stored = window.localStorage.getItem('auth_user')
    if (!stored) {
      return null
    }
    try {
      return JSON.parse(stored)
    } catch {
      return null
    }
  })

  const handleToggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev)
  }

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false)
  }

  // ── On cold start: check if a notification click stored a pending URL ───────
  useEffect(() => {
    consumePendingNotificationUrl().then((url) => {
      if (url) {
        setPendingNotificationUrl(url)
        setPendingConsumed(false) // Allow navigation
      }
      setPendingChecked(true)
    }).catch(() => {
      setPendingChecked(true)
    })
  }, [])

  const handleLoginSuccess = (token, user) => {
    window.localStorage.setItem('auth_token', token)
    if (user) {
      window.localStorage.setItem('auth_user', JSON.stringify(user))
      setCurrentUser(user)
    }

    // CRITICAL: Read the pending redirect SYNCHRONOUSLY before setting auth state.
    // This prevents the race condition where route re-evaluation happens before
    // the useEffect can read sessionStorage.
    let pendingRedirect = null
    try {
      pendingRedirect = window.sessionStorage.getItem('post_login_redirect')
      if (pendingRedirect) window.sessionStorage.removeItem('post_login_redirect')
    } catch { /* best-effort */ }
    if (!pendingRedirect) {
      try {
        const pendingMission = window.sessionStorage.getItem('pending_notification_mission')
        if (pendingMission) {
          window.sessionStorage.removeItem('pending_notification_mission')
          pendingRedirect = `/missions/${pendingMission}`
        }
      } catch { /* best-effort */ }
    }
    if (pendingRedirect) {
      setPostLoginRedirect(pendingRedirect)
    }

    setIsAuthenticated(true)
  }

  // Consume post-login redirect stored by LoginForm (survives the re-render race)
  const [postLoginRedirect, setPostLoginRedirect] = useState(null)

  // postLoginRedirect is now set synchronously in handleLoginSuccess — no useEffect needed

  const clearLocalAuth = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('auth_token')
      window.localStorage.removeItem('auth_user')
    }
    setIsAuthenticated(false)
    setCurrentUser(null)
  }

  const handleLogout = async () => {
    await logoutSession()
    clearLocalAuth()
  }

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const onAuthInvalid = () => {
      clearLocalAuth()
    }

    const onAuthLogin = (event) => {
      const { token, user } = event.detail || {}
      if (token) {
        setIsAuthenticated(true)
        if (user) setCurrentUser(user)
      }
    }

    window.addEventListener('auth:invalid', onAuthInvalid)
    window.addEventListener('auth:login', onAuthLogin)
    return () => {
      window.removeEventListener('auth:invalid', onAuthInvalid)
      window.removeEventListener('auth:login', onAuthLogin)
    }
  }, [])

  const isLoggedIn = isAuthenticated
  const normalizedRole = String(currentUser?.role || '').trim().toLowerCase()
  const layoutProps = {
    isSidebarOpen,
    onToggleSidebar: handleToggleSidebar,
    onCloseSidebar: handleCloseSidebar,
    currentUser,
    onLogout: handleLogout,
  }

  const renderInLayout = (children) => (
    <AppLayout {...layoutProps}>
      {children}
    </AppLayout>
  )

  const renderProtectedPage = (children) => (
    isLoggedIn ? renderInLayout(children) : <Navigate to="/" replace />
  )

  const renderHomePage = (loginFallback = false) => {
    if (!isLoggedIn) return loginFallback ? <LoginForm onLoginSuccess={handleLoginSuccess} /> : <Navigate to="/" replace />
    // If there's a pending post-login redirect, use it (one-shot)
    if (postLoginRedirect) {
      const target = postLoginRedirect
      setPostLoginRedirect(null)
      return <Navigate to={target} replace />
    }
    if (normalizedRole === 'technicien') return <Navigate to="/missions/my" replace />
    return renderInLayout(<OperationsDashboard currentUser={currentUser} />)
  }

  // ── Wait for pending notification check before rendering routes ──────────────
  if (!pendingChecked) {
    return <div className="min-h-screen bg-canvas" />
  }

  // ── If a pending notification URL was found, redirect immediately ────────────
  if (pendingNotificationUrl && !pendingConsumed) {
    // Mark as consumed before rendering Navigate to avoid re-renders
    setPendingConsumed(true)
    return <Navigate to={pendingNotificationUrl} replace />
  }

  return (
    <Routes>
      <Route
        path="/"
        element={renderHomePage(true)}
      />
      <Route
        path="/login"
        element={isLoggedIn
          ? (() => {
              if (postLoginRedirect) {
                const target = postLoginRedirect
                setPostLoginRedirect(null)
                return <Navigate to={target} replace />
              }
              return <Navigate to="/" replace />
            })()
          : <LoginForm onLoginSuccess={handleLoginSuccess} />
        }
      />
      <Route
        path="/dashboard"
        element={renderHomePage()}
      />
      <Route path="/users" element={renderProtectedPage(<UserManagement currentUser={currentUser} />)} />
      <Route path="/users/:id/details" element={renderProtectedPage(<UserDetails currentUser={currentUser} />)} />
      <Route path="/missions" element={renderProtectedPage(<ListMission />)} />
      <Route path="/missions/my" element={renderProtectedPage(<EmployeeMissions />)} />
      <Route path="/missions/assign" element={renderProtectedPage(<AssignMission />)} />
      <Route path="/missions/:id" element={renderProtectedPage(<MissionDetails />)} />
      <Route
        path="/missions/:id/notification"
        element={<Suspense fallback={null}><MissionDetails allowUnauthenticated /></Suspense>}
      />
      <Route path="/interventions" element={renderProtectedPage(<InterventionList />)} />
      <Route path="/interventions/create" element={renderProtectedPage(<CreateIntervention />)} />
      <Route path="/interventions/:id" element={renderProtectedPage(<InterventionDetails />)} />
      <Route
        path="/interventions/history"
        element={
          isLoggedIn ? (
            <Navigate to="/interventions" replace />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route path="/machines" element={renderProtectedPage(<MachineList currentUser={currentUser} />)} />
      <Route path="/machines/create" element={renderProtectedPage(<MachineForm />)} />
      <Route path="/machines/:id/edit" element={renderProtectedPage(<MachineForm />)} />
      <Route path="/machines/:id" element={renderProtectedPage(<MachineDetails currentUser={currentUser} />)} />
      <Route path="/vehicles" element={renderProtectedPage(<VehicleList />)} />
      <Route path="/vehicles/create" element={renderProtectedPage(<CreateVehicle />)} />
      <Route path="/vehicles/:id" element={renderProtectedPage(<VehicleDetails />)} />
      <Route path="/vehicles/:id/edit" element={renderProtectedPage(<EditVehicle />)} />
      <Route path="/employees/:employeeId/history" element={renderProtectedPage(<EmployeeHistory />)} />
      <Route path="/clients" element={renderProtectedPage(<ClientsList />)} />
      <Route path="/clients/:id/360" element={renderProtectedPage(<ClientDetails360 />)} />
      <Route
        path="*"
        element={(() => {
          if (!isLoggedIn) return <Navigate to="/" replace />
          if (postLoginRedirect) {
            const target = postLoginRedirect
            setPostLoginRedirect(null)
            return <Navigate to={target} replace />
          }
          if (normalizedRole === 'technicien') return <Navigate to="/missions/my" replace />
                return <Navigate to="/dashboard" replace />
        })()}
      />
    </Routes>
  )
}
