import axios from 'axios'

import type { AuthenticateResponse, LoginResponse } from '@/types/auth'

const STORAGE_KEY = 'expense-manager-auth'

interface PersistedAuth {
  token: string
  roles: string
  user: string
}

function parseLoginBody(data: unknown): LoginResponse {
  if (data == null)
    return {}
  if (typeof data === 'string') {
    try {
      return JSON.parse(data) as LoginResponse
    }
    catch {
      return { error: data }
    }
  }
  return data as LoginResponse
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref('')
  const roles = ref('')
  const user = ref('')
  /** True after successful login or successful GET /users/{token}/authenticate */
  const sessionValidated = ref(false)
  const hydrated = ref(false)
  const loginError = ref<string | null>(null)

  const isAuthenticated = computed(
    () => sessionValidated.value && !!token.value,
  )

  function persist() {
    const payload: PersistedAuth = {
      token: token.value,
      roles: roles.value,
      user: user.value,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  }

  function hydrateFromStorage() {
    if (hydrated.value)
      return
    hydrated.value = true
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw)
        return
      const p = JSON.parse(raw) as Partial<PersistedAuth>
      if (p.token)
        token.value = p.token
      if (p.roles != null)
        roles.value = p.roles
      if (p.user != null)
        user.value = p.user
    }
    catch {
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  /** Clears session when opening the login page (same as Angular LoginFormComponent ngOnInit). */
  function clearSessionForLoginPage() {
    token.value = ''
    roles.value = ''
    user.value = ''
    sessionValidated.value = false
    loginError.value = null
    localStorage.removeItem(STORAGE_KEY)
  }

  function logout() {
    clearSessionForLoginPage()
    hydrated.value = true
  }

  /**
   * Validates token with backend (Angular AuthenticateService.authenticate).
   */
  async function validateSession(): Promise<boolean> {
    if (!token.value) {
      sessionValidated.value = false
      return false
    }
    try {
      const { data } = await axios.get<AuthenticateResponse>(
        `/users/${encodeURIComponent(token.value)}/authenticate`,
      )
      if (data.status === 'failed') {
        sessionValidated.value = false
        return false
      }
      if (data.user)
        user.value = data.user
      sessionValidated.value = true
      persist()
      return true
    }
    catch {
      sessionValidated.value = false
      return false
    }
  }

  /**
   * POST /login with { userName, password } (Angular AuthenticateService.loginUser).
   */
  async function login(credentials: { userName: string; password: string }): Promise<boolean> {
    loginError.value = null
    try {
      const { data, status } = await axios.post<unknown>(
        '/login',
        {
          userName: credentials.userName,
          password: credentials.password,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        },
      )
      const res = parseLoginBody(data)
      if (res.error) {
        loginError.value = typeof res.error === 'string' ? res.error : 'Login failed'
        return false
      }
      if (res.loginStatus !== 'success' || !res.token) {
        // 2xx but empty body, HTML, or JSON without loginStatus/token — common when proxy hits wrong server
        const preview
          = data === undefined || data === null || data === ''
            ? '(empty body)'
            : typeof data === 'object'
              ? JSON.stringify(data).slice(0, 200)
              : String(data).slice(0, 200)
        loginError.value
          = `Login response was not successful (HTTP ${status}). Expected JSON with loginStatus "success" and token. Got: ${preview}`
        return false
      }
      token.value = res.token
      roles.value = res.roles ?? ''
      user.value = res.user ?? ''
      sessionValidated.value = true
      persist()
      return true
    }
    catch (e: unknown) {
      if (axios.isAxiosError(e)) {
        const status = e.response?.status
        const body = e.response?.data
        if (typeof body === 'string') {
          try {
            const j = JSON.parse(body) as { error?: string }
            loginError.value = j.error ?? body
          }
          catch {
            loginError.value = body.trim() || `Request failed (HTTP ${status ?? '?'})`
          }
        }
        else if (body && typeof body === 'object' && 'error' in body) {
          loginError.value = String((body as { error?: string }).error)
        }
        else if (status != null) {
          loginError.value = `Request failed (HTTP ${status}${e.response?.statusText ? ` ${e.response.statusText}` : ''})`
        }
        else {
          loginError.value = e.message || 'Network error — is the API running and the Vite proxy correct?'
        }
        return false
      }
      loginError.value = 'Login failed'
      return false
    }
  }

  return {
    token,
    roles,
    user,
    sessionValidated,
    hydrated,
    loginError,
    isAuthenticated,
    hydrateFromStorage,
    clearSessionForLoginPage,
    logout,
    validateSession,
    login,
  }
})
