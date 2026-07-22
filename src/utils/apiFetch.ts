import { useAuthStore } from '@/stores/authStore'

/**
 * fetch() with Cognito access token attached (same token as axios / $api).
 */
export async function apiFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const headers = new Headers(init?.headers)

  let token: string | undefined
  try {
    const auth = useAuthStore()

    token = auth.token || undefined
  }
  catch {
    /* Pinia not ready */
  }

  if (!token) {
    const cookie = useCookie('accessToken').value
    if (cookie)
      token = cookie
  }

  if (token)
    headers.set('Authorization', `Bearer ${token}`)

  if (!headers.has('Accept'))
    headers.set('Accept', 'application/json')

  return fetch(input, {
    ...init,
    headers,
  })
}
