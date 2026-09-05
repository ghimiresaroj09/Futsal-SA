import { Camera, Check, Edit3, Mail, Phone, UserRound, LoaderCircle } from 'lucide-react'
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

export function ProfilePage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [profile, setProfile] = useState<AdminProfile | null>(null)
  const [image, setImage] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [savingImage, setSavingImage] = useState(false)

  useEffect(() => {
    let active = true
    const access = localStorage.getItem('access_token')
    const apiBase = import.meta.env.DEV ? '/backend' : (import.meta.env.VITE_API_BASE_URL || '')
    authFetch(`${apiBase}/api/v1/admin/profile/`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${access || ''}` },
    })
      .then(async (response) => {
        const body = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(body?.message || body?.detail || 'Unable to load your profile.')
        return body as ProfileResponse
      })
      .then((response) => {
        if (!active) return
        setProfile(response.data)
        setImage(response.data.profile_image)
        localStorage.setItem('current_user', JSON.stringify(response.data))
      })
      .catch((requestError: Error) => { showToast(requestError.message, 'error') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [showToast])

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setSavingImage(true)
    try {
      const access = localStorage.getItem('access_token')
      const apiBase = import.meta.env.DEV ? '/backend' : (import.meta.env.VITE_API_BASE_URL || '')
      const payload = new FormData()
      payload.append('profile_image', file)
      const response = await authFetch(`${apiBase}/api/v1/admin/profile/`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${access || ''}` },
        body: payload,
      })
      const body = await response.json().catch(() => ({}))
      const validationErrors = body?.errors && Object.values(body.errors).flat().join(' ')
      if (!response.ok) throw new Error(validationErrors || body?.message || body?.detail || 'Unable to update your profile image.')
      const updatedProfile = body.data as AdminProfile
      setProfile(updatedProfile)
      setImage(updatedProfile.profile_image)
      localStorage.setItem('current_user', JSON.stringify(updatedProfile))
      showToast(body.message || 'Profile image updated successfully.', 'success')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to update your profile image.', 'error')
    } finally {
      setSavingImage(false)
      event.target.value = ''
    }
  }

  if (loading) return <PageSkeleton variant="form" eyebrow="Account settings" title="Profile" description="View your account details and preferences." />
  if (!profile) return <div className="profile-page"><div className="empty-state">Profile information could not be loaded.</div></div>

  const initials = profile.full_name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()
  return <div className="profile-page">
    <div className="page-heading profile-heading"><div><p className="eyebrow">Account settings</p><h1>My profile</h1><p className="muted">Manage your personal information and profile image.</p></div><button className="primary-button" onClick={() => navigate('/profile/edit')}><Edit3 size={16} />Edit profile</button></div>
    <section className="profile-card">
      <div className="profile-cover"><div className="profile-avatar-wrap"><div className="profile-avatar">{image ? <img src={image} alt="Profile" /> : <span>{initials}</span>}</div><label className="camera-button" title="Change profile image"><Camera size={15} /><input type="file" accept="image/*" onChange={handleImageChange} /></label></div></div>
      <div className="profile-card-body"><div className="profile-intro"><div><h2>{profile.full_name}</h2><p>{profile.role}</p></div><span className="status-badge"><Check size={13} />{profile.is_verified ? 'Verified' : 'Unverified'}</span></div><div className="profile-details"><Detail icon={<UserRound size={17} />} label="Full Name" value={profile.full_name} /><Detail icon={<Phone size={17} />} label="Phone Number" value={profile.phone_number} /><Detail icon={<Mail size={17} />} label="Email Address" value={profile.email} /></div></div>
    </section>
  </div>
}

function Detail({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <div className="profile-detail"><div className="detail-icon">{icon}</div><div><span>{label}</span><strong>{value}</strong></div></div> }
