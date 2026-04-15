import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/layout/Sidebar'
import Header from './components/layout/Header'
import UserManagement from './pages/user/UserManagement'
import ListMission from './pages/mission/ListMission'
import EmployeeMissions from './pages/mission/EmployeeMissions'
import EmployeeHistory from './pages/mission/EmployeeHistory'
import MissionDetails from './pages/mission/MissionDetails'
import InterventionList from './pages/intervention/InterventionList'
import CreateIntervention from './pages/intervention/CreateIntervention'
import InterventionDetails from './pages/intervention/InterventionDetails'
import InterventionHistory from './pages/intervention/InterventionHistory'
import AssignMission from './pages/mission/AssignMission'
import LoginForm from './components/user/LoginForm'
import OperationsDashboard from './pages/dashboard/OperationsDashboard'
import DashboardTechnicien from './pages/dashboard/DashboardTechnicien'
import DevisList from './pages/devis/DevisList'
import DevisDetails from './pages/devis/DevisDetails'
import CreateDevis from './pages/devis/CreateDevis'
import MachineList from './pages/machines/MachineList'
import MachineForm from './pages/machines/MachineForm'
import MachineDetails from './pages/machines/MachineDetails'
import { NotificationsProvider } from './notifications/NotificationsProvider'
import { getAuthToken, isAuthTokenUsable } from './api/apiClient'

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

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('auth_token')
      window.localStorage.removeItem('auth_user')
    }
    setIsAuthenticated(false)
    setCurrentUser(null)
  }

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const onAuthInvalid = () => {
      handleLogout()
    }

    window.addEventListener('auth:invalid', onAuthInvalid)
    return () => window.removeEventListener('auth:invalid', onAuthInvalid)
  }, [])

  const isLoggedIn = isAuthenticated

  return (
    <Routes>
      <Route
        path="/"
        element={
          isLoggedIn ? (
            String(currentUser?.role || '').trim().toLowerCase() === 'technicien' ? (
              <Navigate to="/dashboard/technicien" replace />
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
            String(currentUser?.role || '').trim().toLowerCase() === 'technicien' ? (
              <Navigate to="/dashboard/technicien" replace />
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
      <Route
        path="/dashboard/technicien"
        element={
          isLoggedIn ? (
            String(currentUser?.role || '').trim().toLowerCase() === 'technicien' ? (
              <AppLayout
                isSidebarOpen={isSidebarOpen}
                onToggleSidebar={handleToggleSidebar}
                onCloseSidebar={handleCloseSidebar}
                currentUser={currentUser}
                onLogout={handleLogout}
              >
                <DashboardTechnicien currentUser={currentUser} />
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
            <AppLayout
              isSidebarOpen={isSidebarOpen}
              onToggleSidebar={handleToggleSidebar}
              onCloseSidebar={handleCloseSidebar}
              currentUser={currentUser}
              onLogout={handleLogout}
            >
              <InterventionHistory />
            </AppLayout>
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
            String(currentUser?.role || '').trim().toLowerCase() === 'technicien' ? (
              <Navigate to="/dashboard/technicien" replace />
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
