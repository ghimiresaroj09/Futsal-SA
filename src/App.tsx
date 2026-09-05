import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { hasAuthTokens, migrateLegacyTokens } from './lib/auth'
import { AppShell } from './components/layout/AppShell'
import { DashboardPage } from './pages/DashboardPage'
import { PlaceholderPage } from './pages/PlaceholderPage'
import { ProfilePage } from './pages/ProfilePage'
import { LoginPage } from './pages/LoginPage'
import { SettingsPage } from './pages/SettingsPage'
import { UpdateSettingsPage } from './pages/UpdateSettingsPage'
import { ChangePasswordPage } from './pages/ChangePasswordPage'
import { ContactUsPage } from './pages/ContactUsPage'
import { UsersPage } from './pages/UsersPage'
import { BookingsPage } from './pages/BookingsPage'
import { NotificationsPage } from './pages/NotificationsPage'
import { UpdateProfilePage } from './pages/UpdateProfilePage'
import { ClosurePage } from './pages/ClosurePage'
import { ManageSlotsPage } from './pages/ManageSlotsPage'
import { BulkSlotsPage } from './pages/BulkSlotsPage'
import { AvailabilityPage } from './pages/AvailabilityPage'
import { AnalyticsPage } from './pages/AnalyticsPage'
import { ToastProvider } from './components/ui/Toast'

function ProtectedRoute() {
  const location = useLocation()
  const [hasSession, setHasSession] = useState(hasAuthTokens)

  useEffect(() => {
    const updateSession = () => setHasSession(hasAuthTokens())
    window.addEventListener('auth:unauthorized', updateSession)
    window.addEventListener('auth:logout', updateSession)
    return () => {
      window.removeEventListener('auth:unauthorized', updateSession)
      window.removeEventListener('auth:logout', updateSession)
    }
  }, [])

  if (!hasSession) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}

export default function App() {
  migrateLegacyTokens()
  return <ToastProvider><BrowserRouter><Routes><Route path="/login" element={<LoginPage />} /><Route element={<ProtectedRoute />}><Route element={<AppShell />}><Route path="/" element={<DashboardPage />} /><Route path="/users" element={<UsersPage />} /><Route path="/bookings" element={<BookingsPage />} /><Route path="/bookings/:id" element={<BookingsPage />} /><Route path="/notifications" element={<NotificationsPage />} /><Route path="/slot-management" element={<PlaceholderPage title="Slot Management" />} /><Route path="/manage-slots" element={<ManageSlotsPage />} /><Route path="/slot-availability" element={<AvailabilityPage />} /><Route path="/bulk-slots" element={<BulkSlotsPage />} /><Route path="/closure" element={<ClosurePage />} /><Route path="/analytics" element={<AnalyticsPage />} /><Route path="/change-password" element={<ChangePasswordPage />} /><Route path="/contact" element={<ContactUsPage />} /><Route path="/settings" element={<SettingsPage />} /><Route path="/settings/edit" element={<UpdateSettingsPage />} /><Route path="/profile" element={<ProfilePage />} /><Route path="/profile/edit" element={<UpdateProfilePage />} /></Route></Route><Route path="*" element={<Navigate to="/login" replace />} /></Routes></BrowserRouter></ToastProvider>
}
