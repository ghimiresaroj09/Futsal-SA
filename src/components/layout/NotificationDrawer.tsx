import { Bell, Check, CheckCheck, CircleAlert, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { authFetch } from '../../lib/api'
import { useToast } from '../ui/Toast'

type Notice = { id: string; booking: string; booking_reference: string; title: string; message: string; is_read: boolean; read_at: string | null; created_at: string; time_ago: string; redirect_url: string }
type Response = { success: boolean; message: string; data: { unread_count: number; results: Notice[] } }

export function NotificationDrawer({ onClose, onViewAll, onViewBooking }: { onClose: () => void; onViewAll: () => void; onViewBooking: (redirectUrl: string) => void }) {
  const [items, setItems] = useState<Notice[]>([])
  const [filter, setFilter] = useState<'ALL' | 'UNREAD' | 'READ'>('ALL')
  const [loading, setLoading] = useState(true)
  const [marking, setMarking] = useState<string | null>(null)
  const { showToast } = useToast()

  useEffect(() => {
    let active = true
    const base = import.meta.env.DEV ? '/backend' : (import.meta.env.VITE_API_BASE_URL || '')
    authFetch(`${base}/api/v1/admin/notifications/`)
      .then(async (response) => {
        const body = await response.json().catch(() => ({}))
        if (!response.ok || !body.success) throw Error(body.message || 'Unable to load notifications.')
        return body as Response
      })
      .then((response) => { if (active) setItems(response.data.results) })
      .catch(() => { if (active) setItems([]) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const visible = useMemo(() => items.filter((item) => filter === 'ALL' || (filter === 'UNREAD' ? !item.is_read : item.is_read)), [items, filter])
  const unread = items.filter((item) => !item.is_read).length
  const read = async (id: string) => {
    setMarking(id)
    const base = import.meta.env.DEV ? '/backend' : (import.meta.env.VITE_API_BASE_URL || '')
    try {
      const response = await authFetch(`${base}/api/v1/admin/notifications/${id}/mark-read/`, { method: 'POST' })
      const body = await response.json().catch(() => ({}))
      if (!response.ok || !body.success) throw Error(body.message || 'Unable to mark notification as read.')
      setItems((current) => current.map((item) => item.id === id ? { ...item, is_read: true, read_at: new Date().toISOString() } : item))
      window.dispatchEvent(new CustomEvent('notifications:unread-count', { detail: Math.max(unread - 1, 0) }))
    } finally { setMarking(null) }
  }

  const markAllRead = async () => {
    const unreadItems = items.filter((item) => !item.is_read)
    if (!unreadItems.length) return
    setMarking('all')
    try {
      const base = import.meta.env.DEV ? '/backend' : (import.meta.env.VITE_API_BASE_URL || '')
      const response = await authFetch(`${base}/api/v1/admin/notifications/mark-all-read/`, { method: 'POST' })
      const body = await response.json().catch(() => ({}))
      if (!response.ok || !body.success) throw new Error(body?.message || 'Unable to mark all notifications as read.')
      setItems((current) => current.map((item) => ({ ...item, is_read: true, read_at: item.read_at || new Date().toISOString() })))
      window.dispatchEvent(new CustomEvent('notifications:unread-count', { detail: 0 }))
      showToast(body?.message || 'All notifications marked as read.', 'success')
    } catch (error) { showToast(error instanceof Error ? error.message : 'Unable to mark all notifications as read.', 'error') } finally { setMarking(null) }
  }

  return <><div className="notification-drawer-backdrop" onClick={onClose} /><aside className="notification-drawer"><div className="drawer-header"><div><p className="eyebrow">Booking activity</p><h2>Notifications</h2></div><button className="modal-close" onClick={onClose}><X size={18} /></button></div><div className="drawer-toolbar"><div className="notification-tabs">{(['ALL', 'UNREAD', 'READ'] as const).map((value) => <button key={value} className={filter === value ? 'selected' : ''} onClick={() => setFilter(value)} disabled={loading || Boolean(marking)}>{value === 'ALL' ? 'All' : value === 'UNREAD' ? <>Unread <b>{unread}</b></> : 'Read'}</button>)}</div><button className="drawer-mark-all" disabled={!unread || loading || Boolean(marking)} onClick={() => void markAllRead()}><CheckCheck size={14} />{marking === 'all' ? 'Marking...' : 'Mark all read'}</button></div><div className="drawer-list">{loading ? <DrawerSkeleton /> : <>{visible.map((item) => <div className={`drawer-notice ${item.is_read ? '' : 'unread'}`} key={item.id}><div className={`notification-icon ${item.title.toLowerCase().includes('cancel') ? 'warning' : 'booking'}`}>{item.title.toLowerCase().includes('cancel') ? <CircleAlert size={16} /> : <Bell size={16} />}</div><div className="drawer-notice-content"><h3>{item.title}</h3><p>{item.message}</p><time>{item.time_ago}</time><button className="drawer-view-booking" onClick={() => onViewBooking(item.redirect_url)}>View booking →</button></div>{!item.is_read && <button className="drawer-read" disabled={Boolean(marking)} onClick={() => void read(item.id).catch((error) => showToast(error instanceof Error ? error.message : 'Unable to mark notification as read.', 'error'))}><Check size={14} /></button>}</div>)}{!visible.length && <div className="empty-notifications"><Bell size={22} /><p>No notifications here.</p></div>}</>}</div><button className="view-all-notifications" onClick={onViewAll}>View all notifications</button></aside></>
}

function DrawerSkeleton() {
  return <div className="notification-skeleton-list" aria-label="Loading notifications" aria-busy="true">{Array.from({ length: 5 }, (_, index) => <div className="drawer-notice notification-skeleton" key={index}><i className="notification-skeleton-icon" /><div className="drawer-notice-content"><i className="notification-skeleton-title" /><i className="notification-skeleton-copy" /><i className="notification-skeleton-time" /></div></div>)}</div>
}
