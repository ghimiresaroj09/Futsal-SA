import { NavLink, Outlet } from 'react-router-dom'
import { BarChart3, Bell, CalendarDays, ChevronDown, Clock3, KeyRound, LayoutDashboard, LogOut, Menu, MessageCircle, Settings, UserCircle, Users, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { NotificationDrawer } from './NotificationDrawer'
import { useToast } from '../ui/Toast'
import { authFetch } from '../../lib/api'
import { clearAuthTokens, getAccessToken, getRefreshToken } from '../../lib/auth'
import '../../styles/avatar.css'

const navigation = [
  { label: 'Overview', to: '/', icon: LayoutDashboard },
  { label: 'Users', to: '/users', icon: Users },
  { label: 'Bookings', to: '/bookings', icon: CalendarDays },
  { label: 'Slot Management', to: '/slot-management', icon: Clock3 },
  { label: 'Analytics', to: '/analytics', icon: BarChart3 },
  { label: 'Change Password', to: '/change-password', icon: KeyRound },
  { label: 'Contact Us', to: '/contact', icon: MessageCircle },
  { label: 'Settings', to: '/settings', icon: Settings },
]

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [slotMenuOpen, setSlotMenuOpen] = useState(true)
  const [logoutConfirmationOpen, setLogoutConfirmationOpen] = useState(false)
  const [logoutPending, setLogoutPending] = useState(false)
  const logoutInProgress = useRef(false)
  const navigate = useNavigate()
  const { showToast } = useToast()
  const currentUser = (() => { try { return JSON.parse(localStorage.getItem('current_user') || 'null') as { full_name?: string; role?: string; profile_image?: string | null } | null } catch { return null } })()
  const displayName = currentUser?.full_name || 'Jane Doe'
  const profileImage = currentUser?.profile_image
  const initials = profileImage ? <img src={profileImage} alt={`${displayName}'s profile`} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%', display: 'block' }} /> : displayName.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()

  useEffect(() => {
    let active = true
    const apiBase = import.meta.env.DEV ? '/backend' : (import.meta.env.VITE_API_BASE_URL || '')
    const updateBadge = (count: number) => {
      const badge = document.querySelector<HTMLElement>('.notification-count')
      if (active && badge) badge.textContent = String(count)
    }
    const handleUnreadCount = (event: Event) => updateBadge((event as CustomEvent<number>).detail)
    authFetch(`${apiBase}/api/v1/admin/notifications/`)
      .then(async (response) => {
        const body = await response.json().catch(() => ({}))
        if (!response.ok || !body.success) return
        updateBadge(body.data?.unread_count || 0)
      })
      .catch(() => {})
    window.addEventListener('notifications:unread-count', handleUnreadCount)
    return () => { active = false; window.removeEventListener('notifications:unread-count', handleUnreadCount) }
  }, [])

  useEffect(() => {
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (event.target instanceof Element && !event.target.closest('.profile-wrapper')) setProfileOpen(false)
    }
    document.addEventListener('pointerdown', closeOnOutsideClick)
    return () => document.removeEventListener('pointerdown', closeOnOutsideClick)
  }, [])

  useEffect(() => {
    const normalizePageSizeOptions = () => {
      document.querySelectorAll<HTMLSelectElement>('.rows-select select, .booking-rows-select select').forEach((select) => {
        const expected = ['10', '20', '50']
        if (Array.from(select.options).map((option) => option.value).join(',') === expected.join(',')) return
        const selectedValue = expected.includes(select.value) ? select.value : '10'
        select.replaceChildren(...expected.map((value) => new Option(value, value, false, value === selectedValue)))
      })
    }
    normalizePageSizeOptions()
    const observer = new MutationObserver(normalizePageSizeOptions)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [])

  const handleLogout = async () => {
    if (logoutInProgress.current) return
    logoutInProgress.current = true
    setLogoutPending(true)
    const refresh = getRefreshToken()
    const access = getAccessToken()
    setProfileOpen(false)
    try {
      if (!access || !refresh) throw new Error('Your session has expired. Please sign in again.')
      const apiBase = import.meta.env.DEV ? '/backend' : (import.meta.env.VITE_API_BASE_URL || '')
      let response: Response | null = null
      let responseData: any = {}
      for (const scheme of ['Bearer', 'JWT']) {
        response = await authFetch(`${apiBase}/api/v1/auth/logout/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `${scheme} ${access}`,
          },
          body: JSON.stringify({ refresh }),
        })
        responseData = await response.json().catch(() => ({}))
        if (response.ok || response.status !== 401) break
      }
      if (!response?.ok) {
        const detail = responseData?.errors?.detail
        throw new Error(responseData?.message || (Array.isArray(detail) ? detail[0] : detail) || 'Logout failed. You have been signed out locally.')
      }
      showToast(responseData?.message || 'Logout successful.', 'success')
    } catch (requestError: any) {
      const responseData = requestError.response?.data
      const detail = responseData?.errors?.detail
      const message = responseData?.message || (Array.isArray(detail) ? detail[0] : detail) || requestError.message || 'Logout failed. You have been signed out locally.'
      showToast(message, 'error')
    } finally {
      clearAuthTokens()
      localStorage.removeItem('current_user')
      localStorage.removeItem('remember_me')
      window.dispatchEvent(new CustomEvent('auth:logout'))
      setLogoutPending(false)
      navigate('/login')
    }
  }

  const requestLogout = () => {
    setProfileOpen(false)
    setMobileOpen(false)
    setLogoutConfirmationOpen(true)
  }

  const handleSidebarToggle = () => {
    if (window.matchMedia('(max-width: 900px)').matches) {
      setMobileOpen(true)
      return
    }
    setSidebarCollapsed((collapsed) => !collapsed)
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileOpen ? 'sidebar--open' : ''} ${sidebarCollapsed ? 'sidebar--collapsed' : ''}`}>
        <div className="brand"><span className="brand-mark">N</span><span className="brand-name">Nexus FMS</span><button className="icon-button mobile-close" onClick={() => setMobileOpen(false)} aria-label="Close menu"><X size={18} /></button></div>
        <p className="nav-label">Workspace</p>
        <nav className="main-nav">
          {navigation.map(({ label, to, icon: Icon }) => label === 'Slot Management' ? <div key={to} className="slot-nav-group"><button className="nav-item slot-nav-toggle" onClick={() => setSlotMenuOpen((open) => !open)} aria-expanded={slotMenuOpen} title={sidebarCollapsed ? label : undefined}><Icon size={18} /><span>{label}</span><ChevronDown size={15} className={slotMenuOpen ? 'slot-chevron-open' : ''} /></button>{slotMenuOpen && <div className="slot-subnav"><NavLink to="/manage-slots" onClick={() => setMobileOpen(false)} className={({ isActive }) => isActive ? 'active' : ''}>Manage Slots</NavLink><NavLink to="/slot-availability" onClick={() => setMobileOpen(false)} className={({ isActive }) => isActive ? 'active' : ''}>Availability</NavLink><NavLink to="/bulk-slots" onClick={() => setMobileOpen(false)} className={({ isActive }) => isActive ? 'active' : ''}>Bulk Slots</NavLink><NavLink to="/closure" onClick={() => setMobileOpen(false)} className={({ isActive }) => isActive ? 'active' : ''}>Closure</NavLink></div>}</div> : <NavLink key={to} to={to} end={to === '/'} onClick={() => setMobileOpen(false)} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} title={sidebarCollapsed ? label : undefined}><Icon size={18} /><span>{label}</span></NavLink>)}
          <button className="nav-item nav-logout" onClick={requestLogout}><LogOut size={18} /><span>Logout</span></button>
        </nav>
      </aside>
      {mobileOpen && <button className="sidebar-backdrop" onClick={() => setMobileOpen(false)} aria-label="Close menu" />}
      <main className="main-content">
        <header className="topbar"><button className="icon-button mobile-menu" onClick={handleSidebarToggle} aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} aria-expanded={!sidebarCollapsed}><Menu size={21} /></button><div className="breadcrumbs"><span>Workspace</span><span>/</span><strong>Dashboard</strong></div><div className="topbar-actions"><button className="icon-button notification" onClick={() => setNotificationsOpen(true)} aria-label="Notifications"><Bell size={19} /><span className="notification-count">3</span></button>{notificationsOpen && <NotificationDrawer onClose={() => setNotificationsOpen(false)} onViewAll={() => { setNotificationsOpen(false); navigate('/notifications') }} onViewBooking={(redirectUrl) => { setNotificationsOpen(false); navigate(redirectUrl.replace(/^\/admin(?=\/|$)/, '')) }} />}<div className="profile-wrapper"><button className="user-menu" onClick={() => setProfileOpen((open) => !open)} aria-expanded={profileOpen} aria-haspopup="menu"><div className="avatar">{initials}</div><div className="user-copy"><strong>{displayName}</strong><span>{currentUser?.role || 'Administrator'}</span></div><ChevronDown size={16} className={profileOpen ? 'chevron-open' : ''} /></button>{profileOpen && <div className="profile-dropdown" role="menu"><button onClick={() => { setProfileOpen(false); navigate('/profile') }} role="menuitem"><UserCircle size={16} />Profile</button><button onClick={requestLogout} role="menuitem" className="logout-item"><LogOut size={16} />Logout</button></div>}</div></div></header>
        <div className="page-content"><Outlet /></div>
      </main>
      {logoutConfirmationOpen && <div className="modal-backdrop" onClick={() => !logoutPending && setLogoutConfirmationOpen(false)}><div className="confirmation-modal" role="dialog" aria-modal="true" aria-labelledby="logout-confirmation-title" onClick={(event) => event.stopPropagation()}><div className="confirmation-icon confirm-danger"><LogOut size={22} /></div><h2 id="logout-confirmation-title">Log out?</h2><p>You’ll need to sign in again to access your workspace.</p><div className="confirmation-actions"><button className="secondary-button" onClick={() => setLogoutConfirmationOpen(false)} disabled={logoutPending}>Cancel</button><button className="danger-button" onClick={() => void handleLogout()} disabled={logoutPending}>{logoutPending ? 'Logging out...' : 'Log out'}</button></div></div></div>}
    </div>
  )
}
