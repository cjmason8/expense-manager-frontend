/**
 * Resolves the API base URL for $api / useApi.
 *
 * If the app is served over HTTPS but VITE_API_BASE_URL is `http://...`, browsers block
 * requests (mixed content). In that case we fall back to same-origin `/api` so you can
 * reverse-proxy `/api` on your domain to the backend (recommended for production).
 */
export function resolveApiBaseUrl(): string {
  const raw = import.meta.env.VITE_API_BASE_URL as string | undefined
  const fallback = '/api'

  if (raw === undefined || raw === '')
    return fallback

  const trimmed = raw.trim()

  if (
    typeof window !== 'undefined'
    && window.location?.protocol === 'https:'
    && trimmed.toLowerCase().startsWith('http://')
  ) {
    console.warn(
      '[expense-manager] VITE_API_BASE_URL is HTTP but the page is HTTPS — using same-origin /api to avoid mixed content. '
      + 'Configure your web server to proxy /api to your backend, or set VITE_API_BASE_URL to an HTTPS URL.',
    )

    return fallback
  }

  return trimmed
}
