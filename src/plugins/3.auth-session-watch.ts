import type { App } from 'vue'

import { router } from '@/plugins/1.router/index'
import { useAuthStore } from '@/stores/authStore'

/** Poll token validity while the app is open (fetch-based stores don’t use axios). */
const SESSION_POLL_MS = 120_000

function isLoginPath(fullPath: string) {
  return fullPath === '/login' || fullPath.startsWith('/login?')
}

/**
 * Re-check session when the tab becomes visible and on a timer — covers idle pages
 * where vue-router does not run (Angular called authenticate when entering each view).
 */
export default function (_app: App) {
  if (typeof window === 'undefined')
    return

  const revalidate = async () => {
    const auth = useAuthStore()
    auth.hydrateFromStorage()
    if (!auth.token)
      return
    const { fullPath } = router.currentRoute.value
    if (isLoginPath(fullPath))
      return

    const ok = await auth.validateSession()
    if (!ok) {
      auth.logout()
      await router.replace({
        path: '/login',
        query:
          router.currentRoute.value.fullPath
          && router.currentRoute.value.fullPath !== '/'
          && !isLoginPath(router.currentRoute.value.fullPath)
            ? { redirect: router.currentRoute.value.fullPath }
            : {},
      })
    }
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible')
      void revalidate()
  })

  window.setInterval(() => {
    void revalidate()
  }, SESSION_POLL_MS)
}
