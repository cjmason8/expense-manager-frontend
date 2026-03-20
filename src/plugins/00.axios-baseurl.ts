import type { App } from 'vue'
import axios from 'axios'

import { resolveApiBaseUrl } from '@/utils/resolveApiBaseUrl'

/**
 * Pin axios to the same API base as $api / useApi (relative on HTTPS pages).
 * Prevents mixed content if anything ever set a stale http://… base URL.
 */
export default function (_: App) {
  axios.defaults.baseURL = resolveApiBaseUrl()
}
