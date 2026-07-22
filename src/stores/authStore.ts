import { confirmSignIn, fetchAuthSession, getCurrentUser, signIn, signOut } from 'aws-amplify/auth'

import { cognitoLoginErrorMessage } from '@/utils/cognitoErrors'

const STORAGE_KEY = 'expense-manager-auth'

interface PersistedAuth {
  token: string
  roles: string
  user: string
}

function normalizeGroups(raw: unknown): string[] {
  if (Array.isArray(raw))
    return raw.map(group => String(group).trim()).filter(Boolean)

  if (typeof raw === 'string' && raw.trim())
    return [raw.trim()]

  return []
}

function readGroupsFromPayload(payload: Record<string, unknown> | undefined) {
  if (!payload)
    return []

  return normalizeGroups(payload['cognito:groups'])
}

function readSessionClaims(session: Awaited<ReturnType<typeof fetchAuthSession>>) {
  const accessPayload = session.tokens?.accessToken?.payload as Record<string, unknown> | undefined
  const idPayload = session.tokens?.idToken?.payload as Record<string, unknown> | undefined

  const username = accessPayload?.username
    ?? accessPayload?.['cognito:username']
    ?? idPayload?.['cognito:username']
    ?? idPayload?.email

  const groups = [...new Set([
    ...readGroupsFromPayload(accessPayload),
    ...readGroupsFromPayload(idPayload),
  ])]

  return {
    user: username != null ? String(username) : '',
    roles: groups.join(','),
    groups,
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

  const groups = computed(() =>
    roles.value
      .split(',')
      .map(group => group.trim())
      .filter(Boolean),
  )

  const isAdmin = computed(() =>
    groups.value.some(group => group.toLowerCase() === 'admin'),
  )

  function hasGroup(groupName: string) {
    const target = groupName.toLowerCase()

    return groups.value.some(group => group.toLowerCase() === target)
  }

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

  async function applyAmplifySession(forceRefresh = false): Promise<boolean> {
    let session = await fetchAuthSession({ forceRefresh })
    let { user: sessionUser, roles: sessionRoles } = readSessionClaims(session)

    if (!sessionRoles && !forceRefresh) {
      session = await fetchAuthSession({ forceRefresh: true })
      ;({ user: sessionUser, roles: sessionRoles } = readSessionClaims(session))
    }

    const accessToken = session.tokens?.accessToken

    if (!accessToken) {
      sessionValidated.value = false
      token.value = ''
      syncAccessTokenCookie('')

      return false
    }

    const accessTokenString = accessToken.toString()

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

      return await applyAmplifySession(true)
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
    groups,
    isAdmin,
    hasGroup,
    hydrateFromStorage,
    clearSessionForLoginPage,
    logout,
    validateSession,
    login,
    confirmNewPassword,
    cancelNewPassword,
  }
})
