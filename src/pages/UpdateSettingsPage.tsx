import { ArrowLeft, LoaderCircle, Save } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../components/ui/Toast'
import { authFetch } from '../lib/api'
import { PageSkeleton } from '../components/ui/PageSkeleton'
import type { FacilitySettings } from './SettingsPage'

type SettingsForm = { name: string; description: string; location: string; address: string; phone: string; email: string; price_per_slot: string; slot_duration: string; opening_time: string; closing_time: string; status: string }
const emptyForm: SettingsForm = { name: '', description: '', location: '', address: '', phone: '', email: '', price_per_slot: '', slot_duration: '', opening_time: '', closing_time: '', status: 'ACTIVE' }

export function UpdateSettingsPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [form, setForm] = useState<SettingsForm>(emptyForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const update = (key: keyof SettingsForm, value: string) => setForm((current) => ({ ...current, [key]: value }))

  useEffect(() => {
    let active = true
    const access = localStorage.getItem('access_token')
    const apiBase = import.meta.env.DEV ? '/backend' : (import.meta.env.VITE_API_BASE_URL || '')
    authFetch(`${apiBase}/api/v1/admin/futsal/`, { headers: { Authorization: `Bearer ${access || ''}` } })
      .then(async (response) => { const body = await response.json().catch(() => ({})); if (!response.ok || !body.success) throw new Error(body?.message || 'Unable to load futsal settings.'); return body.data as FacilitySettings })
      .then((settings) => { if (active) setForm(toForm(settings)) })
      .catch((error: Error) => { if (active) showToast(error.message, 'error') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [showToast])

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    try {
      const access = localStorage.getItem('access_token')
      const apiBase = import.meta.env.DEV ? '/backend' : (import.meta.env.VITE_API_BASE_URL || '')
      const response = await authFetch(`${apiBase}/api/v1/admin/futsal/`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${access || ''}` }, body: JSON.stringify({ ...form, slot_duration: Number(form.slot_duration), opening_time: toApiTime(form.opening_time), closing_time: toApiTime(form.closing_time) }) })
      const body = await response.json().catch(() => ({}))
      if (!response.ok || !body.success) throw new Error(body?.message || body?.detail || 'Unable to update futsal settings.')
      showToast(body.message || 'Futsal settings updated successfully.', 'success')
      navigate('/settings')
    } catch (error) { showToast(error instanceof Error ? error.message : 'Unable to update futsal settings.', 'error') } finally { setSaving(false) }
  }

  if (loading) return <PageSkeleton variant="form" eyebrow="Facility management" title="Edit Settings" description="Update your futsal facility details." />
  return <div className="settings-page edit-settings-page"><button className="back-button" onClick={() => navigate('/settings')}><ArrowLeft size={16} />Back to settings</button><div className="page-heading"><div><p className="eyebrow">Workspace configuration</p><h1>Update settings</h1><p className="muted">Update your facility and slot configuration.</p></div></div><form className="edit-profile-card settings-form" onSubmit={submit}><div className="form-section"><div className="section-title"><h2>Facility information</h2><p>Basic information about your facility.</p></div><div className="form-grid"><Field label="Name" value={form.name} onChange={(value) => update('name', value)} /><Field label="Location" value={form.location} onChange={(value) => update('location', value)} /><Field label="Address" value={form.address} onChange={(value) => update('address', value)} full /><Field label="Phone" value={form.phone} onChange={(value) => update('phone', value)} /><Field label="Email" type="email" value={form.email} onChange={(value) => update('email', value)} /><Field label="Description" value={form.description} onChange={(value) => update('description', value)} full textarea /></div></div><div className="form-section"><div className="section-title"><h2>Slot configuration</h2><p>Set pricing, duration, and opening hours.</p></div><div className="form-grid"><Field label="Price per slot" value={form.price_per_slot} onChange={(value) => update('price_per_slot', value)} type="number" /><Field label="Slot duration (minutes)" value={form.slot_duration} onChange={(value) => update('slot_duration', value)} type="number" /><Field label="Opening time" value={form.opening_time} onChange={(value) => update('opening_time', value)} type="time" /><Field label="Closing time" value={form.closing_time} onChange={(value) => update('closing_time', value)} type="time" /><label className="field"><span>Status</span><select value={form.status} onChange={(event) => update('status', event.target.value)}><option value="ACTIVE">ACTIVE</option><option value="INACTIVE">INACTIVE</option></select></label></div></div><div className="form-actions"><button type="button" className="secondary-button" onClick={() => navigate('/settings')} disabled={saving}>Cancel</button><button type="submit" className="primary-button" disabled={saving}><Save size={16} />{saving ? 'Saving...' : 'Save changes'}</button></div></form></div>
}

function Field({ label, value, onChange, type = 'text', full = false, textarea = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; full?: boolean; textarea?: boolean }) { return <label className={`field ${full ? 'field-full' : ''}`}><span>{label}</span>{textarea ? <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={3} /> : <input type={type} value={value} onChange={(event) => onChange(event.target.value)} />}</label> }
function toForm(settings: FacilitySettings): SettingsForm { return { name: settings.name, description: settings.description, location: settings.location, address: settings.address, phone: settings.phone, email: settings.email, price_per_slot: settings.price_per_slot, slot_duration: String(settings.slot_duration), opening_time: settings.opening_time.slice(0, 5), closing_time: settings.closing_time.slice(0, 5), status: settings.status } }
function toApiTime(value: string) { return value ? `${value}:00.000Z` : '' }
