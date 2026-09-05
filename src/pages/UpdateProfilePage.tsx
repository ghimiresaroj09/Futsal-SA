import { ArrowLeft, Camera, LoaderCircle, Save } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../components/ui/Toast'
import { authFetch } from '../lib/api'
import { PageSkeleton } from '../components/ui/PageSkeleton'

type AdminProfile = {
  id: string
  full_name: string
  email: string
  phone_number: string
  profile_image: string | null
  role: string
  is_verified: boolean
  created_at: string
}

type ProfileResponse = { success: boolean; message: string; data: AdminProfile }

export function UpdateProfilePage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [image, setImage] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [form, setForm] = useState({ fullName: '', phone: '', email: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const apiBase = import.meta.env.DEV ? '/backend' : (import.meta.env.VITE_API_BASE_URL || '')
  const update = (key: 'fullName' | 'phone', value: string) => setForm((current) => ({ ...current, [key]: value }))

  useEffect(() => {
    authFetch(`${apiBase}/api/v1/admin/profile/`)
      .then(async (response) => {
        const body = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(body?.message || body?.detail || 'Unable to load your profile.')
        return body as ProfileResponse
      })
      .then(({ data }) => {
        setForm({ fullName: data.full_name, phone: data.phone_number, email: data.email })
        setImage(data.profile_image)
      })
      .catch((error: Error) => showToast(error.message, 'error'))
      .finally(() => setLoading(false))
  }, [apiBase, showToast])

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = () => setImage(typeof reader.result === 'string' ? reader.result : null)
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    try {
      const payload = new FormData()
      payload.append('full_name', form.fullName.trim())
      payload.append('phone_number', form.phone.trim())
      if (imageFile) payload.append('profile_image', imageFile)
      const response = await authFetch(`${apiBase}/api/v1/admin/profile/`, {
        method: 'PATCH',
        body: payload,
      })
      const body = await response.json().catch(() => ({}))
      const validationErrors = body?.errors && Object.values(body.errors).flat().join(' ')
      if (!response.ok) throw new Error(validationErrors || body?.message || body?.detail || 'Unable to update your profile.')
      const result = body as ProfileResponse
      localStorage.setItem('current_user', JSON.stringify(result.data))
      showToast(result.message || 'Profile updated successfully.', 'success')
      navigate('/profile')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to update your profile.', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <PageSkeleton variant="form" eyebrow="Account settings" title="Edit Profile" description="Update your personal account information." />

  return <div className="profile-page edit-profile-page">
    <button className="back-button" onClick={() => navigate('/profile')}><ArrowLeft size={16} />Back to profile</button>
    <div className="page-heading profile-heading"><div><p className="eyebrow">Account settings</p><h1>Update profile</h1><p className="muted">Keep your account information up to date.</p></div></div>
    <form className="edit-profile-card" onSubmit={handleSubmit}>
      <div className="form-section"><div className="section-title"><h2>Profile image</h2><p>Choose a clear image for your account.</p></div><div className="upload-row"><div className="profile-avatar small">{image ? <img src={image} alt="Profile preview" /> : <span>{form.fullName.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}</span>}</div><div><label className="upload-button"><Camera size={15} />Upload image<input type="file" accept="image/*" onChange={handleImageChange} /></label><p className="helper-text">JPG, PNG or GIF. Maximum size 2MB.</p></div></div></div>
      <div className="form-section"><div className="section-title"><h2>Personal information</h2><p>Update the details associated with your account.</p></div><div className="form-grid"><label className="field"><span>Full Name</span><input value={form.fullName} onChange={(event) => update('fullName', event.target.value)} placeholder="Enter your full name" required /></label><label className="field"><span>Phone Number</span><input value={form.phone} onChange={(event) => update('phone', event.target.value)} placeholder="Enter your phone number" required /></label><label className="field field-full"><span>Email Address</span><input type="email" value={form.email} disabled aria-label="Email address (cannot be changed)" /></label></div></div>
      <div className="form-actions"><button type="button" className="secondary-button" onClick={() => navigate('/profile')} disabled={saving}>Cancel</button><button type="submit" className="primary-button" disabled={saving}>{saving ? <><LoaderCircle className="spin" size={16} />Saving...</> : <><Save size={16} />Save changes</>}</button></div>
    </form>
  </div>
}
