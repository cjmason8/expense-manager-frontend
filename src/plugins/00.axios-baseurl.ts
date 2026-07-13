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
 * Attaches Cognito access token as Bearer on every request.
 */
export default function (_: App) {
  axios.defaults.baseURL = resolveApiBaseUrl()

  axios.interceptors.request.use(config => {
    try {
      const auth = useAuthStore()
      if (auth.token) {
        config.headers = config.headers ?? {}
        config.headers.Authorization = `Bearer ${auth.token}`
      }
    }
    catch {
      /* Pinia not ready */
    }

    return config
  })

  axios.interceptors.response.use(
    r => r,
    async error => {
      if (!axios.isAxiosError(error) || error.response == null)
        return Promise.reject(error)

      if (error.response.status === 401) {
        try {
          const auth = useAuthStore()

          await auth.logout()
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
