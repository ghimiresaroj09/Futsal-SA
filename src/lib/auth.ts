const ACCESS_TOKEN_COOKIE = 'access_token'
const REFRESH_TOKEN_COOKIE = 'refresh_token'

function readCookie(name: string) {
  if (typeof document === 'undefined') return null
  const prefix = `${encodeURIComponent(name)}=`
  const value = document.cookie.split('; ').find((cookie) => cookie.startsWith(prefix))?.slice(prefix.length)
  return value ? decodeURIComponent(value) : null
}

function writeCookie(name: string, value: string, persistent: boolean) {
  const attributes = ['Path=/', 'SameSite=Lax']
  if (persistent) attributes.push('Max-Age=2592000') // 30 days
  if (typeof window !== 'undefined' && window.location.protocol === 'https:') attributes.push('Secure')
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; ${attributes.join('; ')}`
}

/**
 * Keep credentials out of localStorage. These are JavaScript-readable cookies
 * because this API currently expects the access token in an Authorization header.
 * Moving them to HttpOnly cookies requires the API to issue and consume them.
 */
export function setAuthTokens(access: string, refresh: string, persistent = false) {
  writeCookie(ACCESS_TOKEN_COOKIE, access, persistent)
  writeCookie(REFRESH_TOKEN_COOKIE, refresh, persistent)
}

export function getAccessToken() {
  return readCookie(ACCESS_TOKEN_COOKIE)
}

export function getRefreshToken() {
  return readCookie(REFRESH_TOKEN_COOKIE)
}

export function hasAuthTokens() {
  return Boolean(getRefreshToken())
}

export function clearAuthTokens() {
  for (const name of [ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE]) {
    document.cookie = `${encodeURIComponent(name)}=; Path=/; Max-Age=0; SameSite=Lax`
  }
}

/** Move sessions created by older versions to cookies on their next app load. */
export function migrateLegacyTokens() {
  const access = localStorage.getItem('access_token')
  const refresh = localStorage.getItem('refresh_token')
  if (access && refresh && !hasAuthTokens()) setAuthTokens(access, refresh, localStorage.getItem('remember_me') === 'true')
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
}
