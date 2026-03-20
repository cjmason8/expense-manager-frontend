import type { App } from 'vue'
import axios from 'axios'

import { router } from '@/plugins/1.router/index'
import { useAuthStore } from '@/stores/authStore'
import { resolveApiBaseUrl } from '@/utils/resolveApiBaseUrl'

function routeIsPublic(): boolean {
  return router.currentRoute.value.matched.some(r => Boolean(r.meta.public))
}

/**
 * Pin axios to the same API base as $api / useApi (relative on HTTPS pages).
 * Prevents mixed content if anything ever set a stale http://… base URL.
 * Logs out on 401 from the API when the session/token is no longer valid.
 */
export default function (_: App) {
  axios.defaults.baseURL = resolveApiBaseUrl()

  axios.interceptors.response.use(
    r => r,
    async (error) => {
      if (!axios.isAxiosError(error) || error.response == null)
        return Promise.reject(error)

      const status = error.response.status
      const reqUrl = String(error.config?.url ?? '')

      // Don’t treat auth endpoints as “session expired”
      if (reqUrl.includes('/login') || reqUrl.includes('/users/') && reqUrl.includes('/authenticate'))
        return Promise.reject(error)

      if (status === 401) {
        try {
          const auth = useAuthStore()
          auth.logout()
          if (!routeIsPublic())
            await router.replace({ path: '/login', query: { redirect: router.currentRoute.value.fullPath } })
        }
        catch {
          /* Pinia not ready — ignore */
        }
      }

      return Promise.reject(error)
    },
  )
}
