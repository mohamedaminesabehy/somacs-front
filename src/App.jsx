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
// DashboardTechnicien removed; techniciens redirected to EmployeeMissions
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

  return (
    <Routes>
      <Route
        path="/"
        element={
          isLoggedIn ? (
            normalizedRole === 'technicien' ? (
              <Navigate to="/missions/my" replace />
            ) : normalizedRole === 'commerciale' ? (
              <Navigate to="/devis" replace />
            ) : (
              <AppLayout
                isSidebarOpen={isSidebarOpen}
                onToggleSidebar={handleToggleSidebar}
                onCloseSidebar={handleCloseSidebar}
                currentUser={currentUser}
                onLogout={handleLogout}
              >
                <OperationsDashboard currentUser={currentUser} />
              </AppLayout>
            )
          ) : (
            <LoginForm onLoginSuccess={handleLoginSuccess} />
          )
        }
      />
      <Route
        path="/login"
        element={<Navigate to="/" replace />}
      />
      <Route
        path="/dashboard"
        element={
          isLoggedIn ? (
            normalizedRole === 'technicien' ? (
              <Navigate to="/missions/my" replace />
            ) : normalizedRole === 'commerciale' ? (
              <Navigate to="/devis" replace />
            ) : (
              <AppLayout
                isSidebarOpen={isSidebarOpen}
                onToggleSidebar={handleToggleSidebar}
                onCloseSidebar={handleCloseSidebar}
                currentUser={currentUser}
                onLogout={handleLogout}
              >
                <OperationsDashboard currentUser={currentUser} />
              </AppLayout>
            )
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      {/* DashboardTechnicien removed; no dedicated route for technicien */}
      <Route
        path="/users"
        element={
          isLoggedIn ? (
            <AppLayout
              isSidebarOpen={isSidebarOpen}
              onToggleSidebar={handleToggleSidebar}
              onCloseSidebar={handleCloseSidebar}
              currentUser={currentUser}
              onLogout={handleLogout}
            >
              <UserManagement currentUser={currentUser} />
            </AppLayout>
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
        path="/users/:id/details"
        element={
          isLoggedIn ? (
            <AppLayout
              isSidebarOpen={isSidebarOpen}
              onToggleSidebar={handleToggleSidebar}
              onCloseSidebar={handleCloseSidebar}
              currentUser={currentUser}
              onLogout={handleLogout}
            >
              <UserDetails currentUser={currentUser} />
            </AppLayout>
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
        path="/missions"
        element={
          isLoggedIn ? (
            <AppLayout
              isSidebarOpen={isSidebarOpen}
              onToggleSidebar={handleToggleSidebar}
              onCloseSidebar={handleCloseSidebar}
              currentUser={currentUser}
              onLogout={handleLogout}
            >
              <ListMission />
            </AppLayout>
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
        path="/missions/my"
        element={
          isLoggedIn ? (
            <AppLayout
              isSidebarOpen={isSidebarOpen}
              onToggleSidebar={handleToggleSidebar}
              onCloseSidebar={handleCloseSidebar}
              currentUser={currentUser}
              onLogout={handleLogout}
            >
              <EmployeeMissions />
            </AppLayout>
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
        path="/missions/assign"
        element={
          isLoggedIn ? (
            <AppLayout
              isSidebarOpen={isSidebarOpen}
              onToggleSidebar={handleToggleSidebar}
              onCloseSidebar={handleCloseSidebar}
              currentUser={currentUser}
              onLogout={handleLogout}
            >
              <AssignMission />
            </AppLayout>
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
        path="/missions/:id"
        element={
          isLoggedIn ? (
            <AppLayout
              isSidebarOpen={isSidebarOpen}
              onToggleSidebar={handleToggleSidebar}
              onCloseSidebar={handleCloseSidebar}
              currentUser={currentUser}
              onLogout={handleLogout}
            >
              <MissionDetails />
            </AppLayout>
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
        path="/interventions"
        element={
          isLoggedIn ? (
            <AppLayout
              isSidebarOpen={isSidebarOpen}
              onToggleSidebar={handleToggleSidebar}
              onCloseSidebar={handleCloseSidebar}
              currentUser={currentUser}
              onLogout={handleLogout}
            >
              <InterventionList />
            </AppLayout>
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
        path="/interventions/create"
        element={
          isLoggedIn ? (
            <AppLayout
              isSidebarOpen={isSidebarOpen}
              onToggleSidebar={handleToggleSidebar}
              onCloseSidebar={handleCloseSidebar}
              currentUser={currentUser}
              onLogout={handleLogout}
            >
              <CreateIntervention />
            </AppLayout>
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
        path="/interventions/:id"
        element={
          isLoggedIn ? (
            <AppLayout
              isSidebarOpen={isSidebarOpen}
              onToggleSidebar={handleToggleSidebar}
              onCloseSidebar={handleCloseSidebar}
              currentUser={currentUser}
              onLogout={handleLogout}
            >
              <InterventionDetails />
            </AppLayout>
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
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
      <Route
        path="/devis"
        element={
          isLoggedIn ? (
            <AppLayout
              isSidebarOpen={isSidebarOpen}
              onToggleSidebar={handleToggleSidebar}
              onCloseSidebar={handleCloseSidebar}
              currentUser={currentUser}
              onLogout={handleLogout}
            >
              <DevisList />
            </AppLayout>
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
        path="/devis/create"
        element={
          isLoggedIn ? (
            <AppLayout
              isSidebarOpen={isSidebarOpen}
              onToggleSidebar={handleToggleSidebar}
              onCloseSidebar={handleCloseSidebar}
              currentUser={currentUser}
              onLogout={handleLogout}
            >
              <CreateDevis />
            </AppLayout>
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
        path="/devis-suivi"
        element={
          isLoggedIn ? (
            (normalizedRole === 'administrateur' || normalizedRole === 'commerciale' || normalizedRole === 'commercial') ? (
              <AppLayout
                isSidebarOpen={isSidebarOpen}
                onToggleSidebar={handleToggleSidebar}
                onCloseSidebar={handleCloseSidebar}
                currentUser={currentUser}
                onLogout={handleLogout}
              >
                <DevisSuiviDashboard />
              </AppLayout>
            ) : (
              <Navigate to="/dashboard" replace />
            )
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
        path="/devis-suivi/relance"
        element={
          isLoggedIn ? (
            (normalizedRole === 'administrateur' || normalizedRole === 'commerciale' || normalizedRole === 'commercial') ? (
              <AppLayout
                isSidebarOpen={isSidebarOpen}
                onToggleSidebar={handleToggleSidebar}
                onCloseSidebar={handleCloseSidebar}
                currentUser={currentUser}
                onLogout={handleLogout}
              >
                <DevisSuiviRelance />
              </AppLayout>
            ) : (
              <Navigate to="/dashboard" replace />
            )
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
        path="/devis/*"
        element={
          isLoggedIn ? (
            <AppLayout
              isSidebarOpen={isSidebarOpen}
              onToggleSidebar={handleToggleSidebar}
              onCloseSidebar={handleCloseSidebar}
              currentUser={currentUser}
              onLogout={handleLogout}
            >
              <DevisDetails />
            </AppLayout>
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
        path="/machines"
        element={
          isLoggedIn ? (
            <AppLayout
              isSidebarOpen={isSidebarOpen}
              onToggleSidebar={handleToggleSidebar}
              onCloseSidebar={handleCloseSidebar}
              currentUser={currentUser}
              onLogout={handleLogout}
            >
              <MachineList currentUser={currentUser} />
            </AppLayout>
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
        path="/machines/create"
        element={
          isLoggedIn ? (
            <AppLayout
              isSidebarOpen={isSidebarOpen}
              onToggleSidebar={handleToggleSidebar}
              onCloseSidebar={handleCloseSidebar}
              currentUser={currentUser}
              onLogout={handleLogout}
            >
              <MachineForm />
            </AppLayout>
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
        path="/machines/:id/edit"
        element={
          isLoggedIn ? (
            <AppLayout
              isSidebarOpen={isSidebarOpen}
              onToggleSidebar={handleToggleSidebar}
              onCloseSidebar={handleCloseSidebar}
              currentUser={currentUser}
              onLogout={handleLogout}
            >
              <MachineForm />
            </AppLayout>
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
        path="/machines/:id"
        element={
          isLoggedIn ? (
            <AppLayout
              isSidebarOpen={isSidebarOpen}
              onToggleSidebar={handleToggleSidebar}
              onCloseSidebar={handleCloseSidebar}
              currentUser={currentUser}
              onLogout={handleLogout}
            >
              <MachineDetails currentUser={currentUser} />
            </AppLayout>
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
        path="/vehicles"
        element={
          isLoggedIn ? (
            <AppLayout
              isSidebarOpen={isSidebarOpen}
              onToggleSidebar={handleToggleSidebar}
              onCloseSidebar={handleCloseSidebar}
              currentUser={currentUser}
              onLogout={handleLogout}
            >
              <VehicleList />
            </AppLayout>
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
        path="/vehicles/create"
        element={
          isLoggedIn ? (
            <AppLayout
              isSidebarOpen={isSidebarOpen}
              onToggleSidebar={handleToggleSidebar}
              onCloseSidebar={handleCloseSidebar}
              currentUser={currentUser}
              onLogout={handleLogout}
            >
              <CreateVehicle />
            </AppLayout>
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
        path="/vehicles/:id"
        element={
          isLoggedIn ? (
            <AppLayout
              isSidebarOpen={isSidebarOpen}
              onToggleSidebar={handleToggleSidebar}
              onCloseSidebar={handleCloseSidebar}
              currentUser={currentUser}
              onLogout={handleLogout}
            >
              <VehicleDetails />
            </AppLayout>
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
        path="/vehicles/:id/edit"
        element={
          isLoggedIn ? (
            <AppLayout
              isSidebarOpen={isSidebarOpen}
              onToggleSidebar={handleToggleSidebar}
              onCloseSidebar={handleCloseSidebar}
              currentUser={currentUser}
              onLogout={handleLogout}
            >
              <EditVehicle />
            </AppLayout>
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
        path="/employees/:employeeId/history"
        element={
          isLoggedIn ? (
            <AppLayout
              isSidebarOpen={isSidebarOpen}
              onToggleSidebar={handleToggleSidebar}
              onCloseSidebar={handleCloseSidebar}
              currentUser={currentUser}
              onLogout={handleLogout}
            >
              <EmployeeHistory />
            </AppLayout>
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
        path="*"
        element={
          isLoggedIn ? (
            normalizedRole === 'technicien' ? (
              <Navigate to="/missions/my" replace />
            ) : normalizedRole === 'commerciale' ? (
              <Navigate to="/devis" replace />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
    </Routes>
  )
}
