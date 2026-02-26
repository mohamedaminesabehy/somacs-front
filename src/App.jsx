import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import UserManagement from './pages/UserManagement'
import Dashboard from './pages/Dashboard'
import EmployeeTasks from './pages/EmployeeTasks'
import EmployeeHistory from './pages/EmployeeHistory'
import LoginForm from './components/LoginForm'
import loginBackground from './assets/login.jpg'

function AppLayout({
  children,
  onToggleSidebar,
  onCloseSidebar,
  isSidebarOpen,
  currentUser,
  onLogout,
}) {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 lg:flex-row">
      <Sidebar
        isMobileOpen={isSidebarOpen}
        onClose={onCloseSidebar}
        currentUser={currentUser}
        onLogout={onLogout}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onToggleSidebar={onToggleSidebar} currentUser={currentUser} onLogout={onLogout} />
        <main className="flex-1 overflow-y-auto">{children}</main>
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
    return Boolean(window.localStorage.getItem('auth_token'))
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

  const isLoggedIn = isAuthenticated

  return (
    <Routes>
      <Route
        path="/login"
        element={
          isLoggedIn ? (
            <Navigate to="/users" replace />
          ) : (
            <div
              className="min-h-screen w-full flex items-center justify-center px-4 sm:px-6 py-8 sm:py-10"
              style={{
                backgroundImage: `url(${loginBackground})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <div className="w-full max-w-md mx-auto bg-black/70 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-700/60 px-5 sm:px-8 py-7 sm:py-9">
                <LoginForm onLoginSuccess={handleLoginSuccess} />
              </div>
            </div>
          )
        }
      />
      <Route
        path="/"
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
            <Navigate to="/login" replace />
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
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/tasks"
        element={
          isLoggedIn ? (
            <AppLayout
              isSidebarOpen={isSidebarOpen}
              onToggleSidebar={handleToggleSidebar}
              onCloseSidebar={handleCloseSidebar}
              currentUser={currentUser}
              onLogout={handleLogout}
            >
              <Dashboard />
            </AppLayout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/tasks/my"
        element={
          isLoggedIn ? (
            <AppLayout
              isSidebarOpen={isSidebarOpen}
              onToggleSidebar={handleToggleSidebar}
              onCloseSidebar={handleCloseSidebar}
              currentUser={currentUser}
              onLogout={handleLogout}
            >
              <EmployeeTasks />
            </AppLayout>
          ) : (
            <Navigate to="/login" replace />
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
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="*"
        element={<Navigate to={isLoggedIn ? '/users' : '/login'} replace />}
      />
    </Routes>
  )
}
