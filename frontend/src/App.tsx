import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { lazy, Suspense } from 'react'

// Layout
import Layout from './components/Layout'

// Loading 组件
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
  </div>
)

// 懒加载页面组件
const LoginPage = lazy(() => import('./pages/LoginPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const TipsPage = lazy(() => import('./pages/TipsPage'))
const UserPage = lazy(() => import('./pages/UserPage'))
const CalendarPage = lazy(() => import('./pages/CalendarPage'))

function App() {
  return (
    <Router>
      <Toaster position="top-right" />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected routes */}
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/tips" element={<TipsPage />} />
            <Route path="/user" element={<UserPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<div className="flex items-center justify-center min-h-screen text-gray-500">404 - 页面不存在</div>} />
        </Routes>
      </Suspense>
    </Router>
  )
}

export default App