export interface User {
  id: string
  name: string
  email: string
  role?: string
  avatarUrl?: string
}

export interface ApiError {
  message: string
  status?: number
  details?: unknown
}
