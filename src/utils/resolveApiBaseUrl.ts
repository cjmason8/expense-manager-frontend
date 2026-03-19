/**
 * Resolves the API base URL for $api / useApi.
 *
 * Default is same-origin root (`''`) so paths like `/search` and `/week` hit your nginx → backend.
 * If VITE_API_BASE_URL is `http://...` while the page is HTTPS, browsers block it (mixed content);
 * we fall back to same-origin `''` so nginx can proxy those paths to the API.
 */
export function resolveApiBaseUrl(): string {
  const raw = import.meta.env.VITE_API_BASE_URL as string | undefined
  const fallback = ''

  if (raw === undefined || raw === '')
    return fallback

  const trimmed = raw.trim()

  if (
    typeof window !== 'undefined'
    && window.location?.protocol === 'https:'
    && trimmed.toLowerCase().startsWith('http://')
  ) {
    console.warn(
      '[expense-manager] VITE_API_BASE_URL is HTTP but the page is HTTPS — using same-origin requests instead to avoid mixed content. '
      + 'Proxy paths like /search and /week on your domain to the backend, or set VITE_API_BASE_URL to an HTTPS URL.',
    )

    return fallback
  }

  return trimmed.replace(/\/$/, '')
}
