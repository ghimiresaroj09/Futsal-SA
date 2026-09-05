import { ChevronLeft, ChevronRight, Eye, LoaderCircle, Mail, MoreHorizontal, Pencil, Phone, Search, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useToast } from '../components/ui/Toast'
import { authFetch, authFetchAll } from '../lib/api'
import { PageSkeleton } from '../components/ui/PageSkeleton'

const statuses = ['NEW', 'IN_PROGRESS', 'RESOLVED'] as const
type ContactMessage = { id: string; name: string; email: string; phone_number: string; subject: string; message: string; status: string; admin_notes: string; created_at: string; updated_at: string }
type ContactResponse = { success: boolean; message: string; data: { count: number; next: string | null; previous: string | null; results: ContactMessage[] } }

const messages = [
  { name: 'Aarav Sharma', email: 'aarav.sharma@example.com', phone_number: '+977 9812345678', subject: 'Booking enquiry', message: 'I would like to know more about the available slots this weekend.' },
  { name: 'Mia Wilson', email: 'mia.wilson@example.com', phone_number: '+1 555 201 3490', subject: 'Pricing information', message: 'Could you please share the pricing details for recurring bookings?' },
  { name: 'Rohan Thapa', email: 'rohan.thapa@example.com', phone_number: '+977 9801122334', subject: 'Partnership proposal', message: 'We are interested in exploring a partnership with your facility.' },
  { name: 'Sophia Carter', email: 'sophia.carter@example.com', phone_number: '+1 555 310 8812', subject: 'Account support', message: 'I am unable to update my account details and need some help.' },
  { name: 'Nischal Gurung', email: 'nischal.gurung@example.com', phone_number: '+977 9860011223', subject: 'Facility feedback', message: 'The facility was excellent. I wanted to share some feedback with the team.' },
  { name: 'Olivia Brown', email: 'olivia.brown@example.com', phone_number: '+1 555 441 2098', subject: 'Availability request', message: 'Are there any open slots available for a private event next month?' },
  { name: 'Suman Karki', email: 'suman.karki@example.com', phone_number: '+977 9844556677', subject: 'Cancellation policy', message: 'Please let me know about the cancellation and refund policy.' },
  { name: 'Ethan Miller', email: 'ethan.miller@example.com', phone_number: '+1 555 502 7781', subject: 'Technical issue', message: 'The booking page is not loading properly on my mobile device.' },
  { name: 'Anisha Rai', email: 'anisha.rai@example.com', phone_number: '+977 9822334455', subject: 'General enquiry', message: 'I would like to learn more about the services offered by Nexus FMS.' },
  { name: 'Lucas Anderson', email: 'lucas.anderson@example.com', phone_number: '+1 555 615 8820', subject: 'Invoice request', message: 'Could you send me a copy of the invoice for my last booking?' },
  { name: 'Pratik Bista', email: 'pratik.bista@example.com', phone_number: '+977 9855667788', subject: 'Group booking', message: 'Can we reserve multiple slots for our group every Saturday?' },
  { name: 'Emma Davis', email: 'emma.davis@example.com', phone_number: '+1 555 727 1409', subject: 'Opening hours', message: 'Are you open on public holidays and during the early morning?' },
  { name: 'Kiran Maharjan', email: 'kiran.maharjan@example.com', phone_number: '+977 9811223344', subject: 'Membership details', message: 'Please send details about your membership plans and benefits.' },
]

export function ContactUsPage() {
  const { showToast } = useToast()
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [contacts, setContacts] = useState<ContactMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selected, setSelected] = useState<ContactMessage | null>(null)
  const [selectedStatus, setSelectedStatus] = useState('NEW')
  const [adminNotes, setAdminNotes] = useState('')
  const [modalMode, setModalMode] = useState<'view' | 'update' | null>(null)
  useEffect(() => {
    let active = true
    const apiBase = import.meta.env.DEV ? '/backend' : (import.meta.env.VITE_API_BASE_URL || '')
    authFetchAll<ContactMessage>(`${apiBase}/api/v1/admin/contact/`)
      .then((contacts) => { if (active) setContacts(contacts) })
      .catch((error: Error) => { if (active) showToast(error.message, 'error') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [showToast])
  const filtered = useMemo(() => contacts.filter((item) => `${item.name} ${item.email} ${item.subject}`.toLowerCase().includes(query.toLowerCase()) && (statusFilter === 'ALL' || item.status === statusFilter)), [contacts, query, statusFilter])
  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage))
  const visible = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage)
  const changeRows = (value: number) => { setRowsPerPage(value); setPage(1) }
  const openModal = async (item: ContactMessage, mode: 'view' | 'update') => {
    setSelected(item)
    setSelectedStatus(item.status)
    setAdminNotes(item.admin_notes)
    setModalMode(mode)
    if (mode !== 'view') return

    setLoadingDetail(true)
    try {
      const apiBase = import.meta.env.DEV ? '/backend' : (import.meta.env.VITE_API_BASE_URL || '')
      const response = await authFetch(`${apiBase}/api/v1/admin/contact/${item.id}/`)
      const body = await response.json().catch(() => ({}))
      if (!response.ok || !body.success) throw new Error(body?.message || 'Unable to load contact message details.')
      const contact = body.data as ContactMessage
      setSelected(contact)
      setSelectedStatus(contact.status)
      setAdminNotes(contact.admin_notes)
    } catch (error) { showToast(error instanceof Error ? error.message : 'Unable to load contact message details.', 'error') } finally { setLoadingDetail(false) }
  }
  const updateContact = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!selected) return
    setSaving(true)
    try {
      const apiBase = import.meta.env.DEV ? '/backend' : (import.meta.env.VITE_API_BASE_URL || '')
      const response = await authFetch(`${apiBase}/api/v1/admin/contact/${selected.id}/`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: selectedStatus, admin_notes: adminNotes }) })
      const body = await response.json().catch(() => ({}))
      if (!response.ok || !body.success) throw new Error(body?.message || 'Unable to update contact message.')
      const updated = body.data as ContactMessage
      setContacts((items) => items.map((item) => item.id === updated.id ? updated : item))
      setSelected(updated)
      showToast(body.message || 'Contact message updated successfully.', 'success')
      setModalMode(null)
    } catch (error) { showToast(error instanceof Error ? error.message : 'Unable to update contact message.', 'error') } finally { setSaving(false) }
  }
  if (loading) return <PageSkeleton variant="table" eyebrow="Customer support" title="Contact messages" description="Review and respond to customer enquiries." />
  return <div className="contact-page"><div className="page-heading"><div><p className="eyebrow">Inbox</p><h1>Contact Us</h1><p className="muted">Review messages and enquiries from your customers.</p></div></div><section className="table-card"><div className="table-toolbar"><div><h2>Customer messages</h2><p>{filtered.length} total messages</p></div><div className="table-controls"><label className="table-search"><Search size={16} /><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1) }} placeholder="Search messages" /></label><label className="status-filter"><span>Status</span><select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1) }}><option value="ALL">All statuses</option><option value="NEW">New</option><option value="IN_PROGRESS">In progress</option><option value="RESOLVED">Resolved</option></select></label></div></div><div className="table-scroll"><table><thead><tr><th className="sn-col">SN</th><th>Name</th><th>Email</th><th>Phone number</th><th>Subject</th><th>Status</th><th className="actions-col">Action</th></tr></thead><tbody>{visible.map((item, index) => <tr key={item.id}><td className="sn-col">{(page - 1) * rowsPerPage + index + 1}</td><td><strong className="table-name">{item.name}</strong></td><td><span className="email-cell"><Mail size={13} />{item.email}</span></td><td><span className="phone-cell"><Phone size={13} />{item.phone_number}</span></td><td><span className="subject-cell">{item.subject}</span></td><td><span className={`contact-status ${item.status.toLowerCase()}`}>{formatStatus(item.status)}</span></td><td className="actions-col"><button className="row-action" title="View message" onClick={() => openModal(item, 'view')}><Eye size={16} /></button><button className="row-action" title="Update message" onClick={() => openModal(item, 'update')}><Pencil size={15} /></button></td></tr>)}</tbody></table></div><div className="table-footer"><label className="rows-select">Rows per page<select value={rowsPerPage} onChange={(event) => changeRows(Number(event.target.value))}><option value={5}>5</option><option value={10}>10</option><option value={15}>15</option></select></label><span className="page-count">{filtered.length ? (page - 1) * rowsPerPage + 1 : 0}–{Math.min(page * rowsPerPage, filtered.length)} of {filtered.length}</span><div className="pagination"><button disabled={page === 1} onClick={() => setPage((current) => current - 1)} aria-label="Previous page"><ChevronLeft size={16} /></button><span>Page {page} of {totalPages}</span><button disabled={page === totalPages} onClick={() => setPage((current) => current + 1)} aria-label="Next page"><ChevronRight size={16} /></button></div></div></section>{selected && modalMode && <div className="modal-backdrop" onClick={() => setModalMode(null)}><div className="contact-modal" onClick={(event) => event.stopPropagation()}><div className="modal-header"><div><p className="eyebrow">Contact message</p><h2>{modalMode === 'view' ? 'Message details' : 'Update message'}</h2></div><button className="modal-close" onClick={() => setModalMode(null)} aria-label="Close modal"><X size={18} /></button></div>{modalMode === 'view' ? <div className="modal-content"><div className="modal-data-grid"><ModalData label="Name" value={selected.name} /><ModalData label="Email" value={selected.email} /><ModalData label="Phone number" value={selected.phone_number} /><ModalData label="Subject" value={selected.subject} /><ModalData label="Status" value={formatStatus(selectedStatus)} /></div><div className="message-box"><span>Message</span><p>{selected.message}</p></div><div className="modal-meta"><span>Admin notes</span><strong>{adminNotes || 'No notes added'}</strong><span>Created at</span><strong>{formatDate(selected.created_at)}</strong><span>Updated at</span><strong>{formatDate(selected.updated_at)}</strong></div></div> : <form className="modal-content" onSubmit={updateContact}><div className="modal-data-grid"><ModalData label="Name" value={selected.name} /><ModalData label="Email" value={selected.email} /></div><label className="field"><span>Status</span><select value={selectedStatus} onChange={(event) => setSelectedStatus(event.target.value)}><option value="NEW">New</option><option value="IN_PROGRESS">In progress</option><option value="RESOLVED">Resolved</option></select></label><label className="field"><span>Admin notes</span><textarea rows={4} value={adminNotes} onChange={(event) => setAdminNotes(event.target.value)} placeholder="Add notes about this message" /></label><div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setModalMode(null)}>Cancel</button><button type="submit" className="primary-button" disabled={saving}>{saving ? 'Updating...' : 'Update message'}</button></div></form>}</div></div>}</div>
}

function ModalData({ label, value }: { label: string; value: string }) { return <div className="modal-data"><span>{label}</span><strong>{value}</strong></div> }
function formatStatus(value: string) { return value.replace('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase()) }
function formatDate(value: string) { return new Date(value).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) }
