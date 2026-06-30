import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/layout/Sidebar'
import Header from './components/layout/Header'
import UserManagement from './pages/user/UserManagement'
import UserDetails from './pages/user/UserDetails'
import ListMission from './pages/mission/ListMission'
import EmployeeMissions from './pages/mission/EmployeeMissions'
import EmployeeHistory from './pages/mission/EmployeeHistory'
import MissionDetails from './pages/mission/MissionDetails'
import InterventionList from './pages/intervention/InterventionList'
import CreateIntervention from './pages/intervention/CreateIntervention'
import InterventionDetails from './pages/intervention/InterventionDetails'
import AssignMission from './pages/mission/AssignMission'
import LoginForm from './components/user/LoginForm'
import OperationsDashboard from './pages/dashboard/OperationsDashboard'
import DevisList from './pages/devis/DevisList'
import DevisDetails from './pages/devis/DevisDetails'
import CreateDevis from './pages/devis/CreateDevis'
import DevisSuiviDashboard from './pages/devis-suivi/DevisSuiviDashboard'
import DevisSuiviRelance from './pages/devis-suivi/DevisSuiviRelance'
import MachineList from './pages/machines/MachineList'
import MachineForm from './pages/machines/MachineForm'
import MachineDetails from './pages/machines/MachineDetails'
import VehicleList from './pages/VehicleList'
import VehicleDetails from './pages/VehicleDetails'
import CreateVehicle from './pages/CreateVehicle'
import EditVehicle from './pages/EditVehicle'
import ClientsList from './pages/clients/ClientsList'
import ClientDetails360 from './pages/clients/ClientDetails360'
import { NotificationsProvider } from './notifications/NotificationsProvider'
import { getAuthToken, isAuthTokenUsable, logoutSession } from './api/apiClient'

function AppLayout({
  children,
  onToggleSidebar,
  onCloseSidebar,
  isSidebarOpen,
  currentUser,
  onLogout,
}) {
  return (
    <div className="flex flex-col min-h-screen bg-[#fafafc] lg:flex-row">
      <Sidebar
        isMobileOpen={isSidebarOpen}
        onClose={onCloseSidebar}
        currentUser={currentUser}
        onLogout={onLogout}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <NotificationsProvider>
          <Header onToggleSidebar={onToggleSidebar} currentUser={currentUser} onLogout={onLogout} />
          <main className="flex-1 overflow-y-auto scroll-smooth">{children}</main>
        </NotificationsProvider>
      </div>
    </div>
  )
}

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
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

  const handleLoginSuccess = (token, user) => {
    window.localStorage.setItem('auth_token', token)
    if (user) {
      window.localStorage.setItem('auth_user', JSON.stringify(user))
      setCurrentUser(user)
    }
    setIsAuthenticated(true)
  }

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

    window.addEventListener('auth:invalid', onAuthInvalid)
    return () => window.removeEventListener('auth:invalid', onAuthInvalid)
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
  const isCommercialRole = normalizedRole === 'commerciale' || normalizedRole === 'commercial'
  const canAccessDevisSuivi = normalizedRole === 'administrateur' || isCommercialRole

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
    if (normalizedRole === 'technicien') return <Navigate to="/missions/my" replace />
    if (normalizedRole === 'commerciale') return <Navigate to="/devis" replace />
    return renderInLayout(<OperationsDashboard currentUser={currentUser} />)
  }

  const renderDevisSuiviPage = (children) => {
    if (!isLoggedIn) return <Navigate to="/" replace />
    return canAccessDevisSuivi ? renderInLayout(children) : <Navigate to="/dashboard" replace />
  }

  return (
    <Routes>
      <Route
        path="/"
        element={renderHomePage(true)}
      />
      <Route
        path="/login"
        element={<Navigate to="/" replace />}
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
      <Route path="/devis" element={renderProtectedPage(<DevisList />)} />
      <Route path="/devis/create" element={renderProtectedPage(<CreateDevis />)} />
      <Route
        path="/devis-suivi"
        element={renderDevisSuiviPage(<DevisSuiviDashboard />)}
      />
      <Route
        path="/devis-suivi/relance"
        element={renderDevisSuiviPage(<DevisSuiviRelance />)}
      />
      <Route path="/devis/*" element={renderProtectedPage(<DevisDetails />)} />
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
          if (normalizedRole === 'technicien') return <Navigate to="/missions/my" replace />
          if (normalizedRole === 'commerciale') return <Navigate to="/devis" replace />
          return <Navigate to="/dashboard" replace />
        })()}
      />
    </Routes>
  )
}
