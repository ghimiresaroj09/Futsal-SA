import { Eye, EyeOff, KeyRound, Save } from 'lucide-react'
import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../components/ui/Toast'
import { authFetch } from '../lib/api'

export function ChangePasswordPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [show, setShow] = useState({ old: false, next: false, confirm: false })
  const [form, setForm] = useState({ old: '', next: '', confirm: '' })
  const [saved, setSaved] = useState(false)
  const submissionInProgress = useRef(false)
  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }))
  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (submissionInProgress.current) return
    submissionInProgress.current = true
    setSaved(true)
    try {
      const apiBase = import.meta.env.DEV ? '/backend' : (import.meta.env.VITE_API_BASE_URL || '')
      const response = await authFetch(`${apiBase}/api/v1/auth/change-password/`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ old_password: form.old, new_password: form.next, confirm_password: form.confirm }) })
      const body = await response.json().catch(() => ({}))
      if (!response.ok || !body.success) throw new Error(body?.message || body?.detail || 'Unable to change password.')
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('current_user')
      showToast(body.message || 'Password changed successfully. Please login again.', 'success')
      navigate('/login', { replace: true })
    } catch (error) { showToast(error instanceof Error ? error.message : 'Unable to change password.', 'error') } finally { submissionInProgress.current = false; setSaved(false) }
  }
  return <div className="security-page"><div className="page-heading"><div><p className="eyebrow">Account security</p><h1>Change password</h1><p className="muted">Choose a strong password to keep your account secure.</p></div></div><form className="password-card" onSubmit={submit}><div className="security-intro"><div className="security-icon"><KeyRound size={21} /></div><div><h2>Update your password</h2><p>Your new password should be at least 8 characters long.</p></div></div><div className="password-fields"><PasswordField label="Old Password" value={form.old} visible={show.old} onToggle={() => setShow({ ...show, old: !show.old })} onChange={(value) => update('old', value)} /><PasswordField label="New Password" value={form.next} visible={show.next} onToggle={() => setShow({ ...show, next: !show.next })} onChange={(value) => update('next', value)} /><PasswordField label="Confirm New Password" value={form.confirm} visible={show.confirm} onToggle={() => setShow({ ...show, confirm: !show.confirm })} onChange={(value) => update('confirm', value)} /></div><div className="form-actions"><button type="button" className="secondary-button" onClick={() => navigate('/')} disabled={saved}>Cancel</button><button type="submit" className="primary-button" disabled={saved}>{saved ? 'Updating...' : <><Save size={16} />Update password</>}</button></div></form></div>
}

function PasswordField({ label, value, visible, onToggle, onChange }: { label: string; value: string; visible: boolean; onToggle: () => void; onChange: (value: string) => void }) { return <label className="field"><span>{label}</span><div className="password-input"><KeyRound size={16} /><input type={visible ? 'text' : 'password'} value={value} onChange={(event) => onChange(event.target.value)} required /><button type="button" onClick={onToggle} aria-label={visible ? 'Hide password' : 'Show password'}>{visible ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label> }
