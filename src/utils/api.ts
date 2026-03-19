import { ofetch } from 'ofetch'

import { resolveApiBaseUrl } from '@/utils/resolveApiBaseUrl'

export const $api = ofetch.create({
  baseURL: resolveApiBaseUrl(),
  async onRequest({ options }) {
    const accessToken = useCookie('accessToken').value
    if (accessToken) {
      options.headers = {
        ...options.headers,
        Authorization: `Bearer ${accessToken}`,
      }
    }
  },
})
