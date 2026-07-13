import { confirmSignIn, fetchAuthSession, getCurrentUser, signIn, signOut } from 'aws-amplify/auth'

import { cognitoLoginErrorMessage } from '@/utils/cognitoErrors'

const STORAGE_KEY = 'expense-manager-auth'

interface PersistedAuth {
  token: string
  roles: string
  user: string
}

function readAccessTokenPayload(accessToken: { payload: Record<string, unknown> }) {
  const payload = accessToken.payload
  const username = payload.username ?? payload['cognito:username'] ?? payload.email
  const groups = payload['cognito:groups']
  const roles = Array.isArray(groups) ? groups.join(',') : ''

  return {
    user: username != null ? String(username) : '',
    roles,
  }
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref('')
  const roles = ref('')
  const user = ref('')

  const sessionValidated = ref(false)
  const hydrated = ref(false)
  const loginError = ref<string | null>(null)
  const needsNewPassword = ref(false)
  const pendingUserName = ref('')

  const isAuthenticated = computed(
    () => sessionValidated.value && !!token.value,
  )

  function syncAccessTokenCookie(accessToken: string) {
    useCookie('accessToken').value = accessToken || null
  }

  function persist() {
    const payload: PersistedAuth = {
      token: token.value,
      roles: roles.value,
      user: user.value,
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  }

  async function applyAmplifySession(): Promise<boolean> {
    const session = await fetchAuthSession()
    const accessToken = session.tokens?.accessToken

    if (!accessToken) {
      sessionValidated.value = false
      token.value = ''
      syncAccessTokenCookie('')

      return false
    }

    const accessTokenString = accessToken.toString()
    const { user: sessionUser, roles: sessionRoles } = readAccessTokenPayload(accessToken)

    token.value = accessTokenString
    roles.value = sessionRoles
    user.value = sessionUser
    sessionValidated.value = true
    syncAccessTokenCookie(accessTokenString)
    persist()

    try {
      const currentUser = await getCurrentUser()
      if (currentUser.signInDetails?.loginId)
        user.value = currentUser.signInDetails.loginId
    }
    catch {
      // display name from token claims is enough
    }

    return true
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
      if (p.token)
        syncAccessTokenCookie(p.token)
    }
    catch {
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  async function clearSessionForLoginPage() {
    try {
      await signOut()
    }
    catch {
      // already signed out
    }
    token.value = ''
    roles.value = ''
    user.value = ''
    sessionValidated.value = false
    loginError.value = null
    needsNewPassword.value = false
    pendingUserName.value = ''
    localStorage.removeItem(STORAGE_KEY)
    syncAccessTokenCookie('')
    hydrated.value = true
  }

  async function logout() {
    await clearSessionForLoginPage()
  }

  async function validateSession(): Promise<boolean> {
    try {
      return await applyAmplifySession()
    }
    catch {
      sessionValidated.value = false
      token.value = ''
      syncAccessTokenCookie('')

      return false
    }
  }

  async function login(credentials: { userName: string; password: string }): Promise<boolean> {
    loginError.value = null
    needsNewPassword.value = false
    pendingUserName.value = credentials.userName.trim()
    try {
      const result = await signIn({
        username: pendingUserName.value,
        password: credentials.password,
      })

      if (result.nextStep.signInStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED') {
        needsNewPassword.value = true
        return false
      }

      if (result.nextStep.signInStep !== 'DONE') {
        loginError.value = `Additional sign-in step required: ${result.nextStep.signInStep}`
        return false
      }

      return await applyAmplifySession()
    }
    catch (error: unknown) {
      loginError.value = cognitoLoginErrorMessage(error)
      return false
    }
  }

  async function confirmNewPassword(newPassword: string): Promise<boolean> {
    loginError.value = null
    try {
      const result = await confirmSignIn({
        challengeResponse: newPassword,
      })

      if (result.nextStep.signInStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED') {
        loginError.value = 'Please choose a different password that meets the pool policy.'
        return false
      }

      if (result.nextStep.signInStep !== 'DONE') {
        loginError.value = `Additional sign-in step required: ${result.nextStep.signInStep}`
        return false
      }

      needsNewPassword.value = false
      return await applyAmplifySession()
    }
    catch (error: unknown) {
      loginError.value = cognitoLoginErrorMessage(error)
      return false
    }
  }

  function cancelNewPassword() {
    needsNewPassword.value = false
    pendingUserName.value = ''
    loginError.value = null
    void signOut()
  }

  return {
    token,
    roles,
    user,
    sessionValidated,
    hydrated,
    loginError,
    needsNewPassword,
    pendingUserName,
    isAuthenticated,
    hydrateFromStorage,
    clearSessionForLoginPage,
    logout,
    validateSession,
    login,
    confirmNewPassword,
    cancelNewPassword,
  }
})
