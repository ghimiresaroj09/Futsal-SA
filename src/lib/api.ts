import axios from 'axios'

const apiBase = import.meta.env.DEV ? '/backend' : (import.meta.env.VITE_API_BASE_URL || '')
let refreshRequest: Promise<string> | null = null
let requestButton: HTMLButtonElement | null = null
const axiosButtonReleases = new WeakMap<object, () => void>()

if (typeof document !== 'undefined') {
  document.addEventListener('click', (event) => {
    const target = event.target
    requestButton = target instanceof Element ? target.closest<HTMLButtonElement>('button') : null
  }, true)
}

function showButtonSpinner() {
  const button = requestButton
  requestButton = null
  if (!button || button.disabled) return () => {}
  button.dataset.apiLoading = 'true'
  button.disabled = true
  return () => {
    delete button.dataset.apiLoading
    button.disabled = false
  }
}

async function refreshAccessToken() {
  if (refreshRequest) return refreshRequest

  refreshRequest = (async () => {
    const refresh = localStorage.getItem('refresh_token')
    if (!refresh) throw new Error('Session expired.')
    const response = await fetch(`${apiBase}/api/v1/auth/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    })
    const body = await response.json().catch(() => ({}))
    if (!response.ok || !body.success || !body.data?.access) throw new Error(body?.message || 'Session expired.')
    localStorage.setItem('access_token', body.data.access)
    if (body.data.refresh) localStorage.setItem('refresh_token', body.data.refresh)
    return body.data.access as string
  })()

  try { return await refreshRequest } finally { refreshRequest = null }
}

export async function authFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const releaseButton = init.method && init.method.toUpperCase() !== 'GET' ? showButtonSpinner() : () => {}
  const send = (token: string | null) => {
    const headers = new Headers(init.headers)
    if (token) headers.set('Authorization', `Bearer ${token}`)
    return fetch(input, { ...init, headers })
  }

  try {
    const response = await send(localStorage.getItem('access_token'))
    if (response.status !== 401) return response

    try {
      return await send(await refreshAccessToken())
    } catch (error) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      window.dispatchEvent(new CustomEvent('auth:unauthorized'))
      throw error
    }
  } finally { releaseButton() }
}

type PaginatedResponse<T> = { success: boolean; message?: string; data: { next?: string | null; results: T[] } }

/** Fetch every page so client-side table filtering always includes the full result set. */
export async function authFetchAll<T>(input: string) {
  const results: T[] = []
  const visited = new Set<string>()
  let url: string | null = input
  const normalizePageUrl = (value: string) => {
    if (!/^https?:\/\//i.test(value)) return value
    const parsed = new URL(value)
    return `${apiBase}${parsed.pathname}${parsed.search}`
  }

  while (url && !visited.has(url)) {
    visited.add(url)
    const response = await authFetch(url)
    const body = await response.json().catch(() => ({})) as PaginatedResponse<T>
    if (!response.ok || !body.success) throw new Error(body?.message || 'Unable to load data.')
    results.push(...(body.data?.results || []))
    url = body.data?.next ? normalizePageUrl(body.data.next) : null
  }

  return results
}

export const api = axios.create({
  baseURL: import.meta.env.DEV ? '/backend' : (import.meta.env.VITE_API_BASE_URL || '/api'),
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  if (config.method && config.method.toUpperCase() !== 'GET') axiosButtonReleases.set(config, showButtonSpinner())
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => { axiosButtonReleases.get(response.config)?.(); return response },
  (error) => {
    if (error.config) axiosButtonReleases.get(error.config)?.()
    if (error.response?.status === 401) {
      window.dispatchEvent(new CustomEvent('auth:unauthorized'))
    }
    return Promise.reject(error)
  },
)
