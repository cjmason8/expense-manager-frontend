const allowedProtocols = new Set(['http:', 'https:', 'mailto:'])

function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function isSafeUrl(url: string) {
  try {
    const parsed = new URL(url.includes('://') ? url : `https://${url}`)

    return allowedProtocols.has(parsed.protocol)
  }
  catch {
    return false
  }
}

function normalizeUrl(url: string) {
  return url.includes('://') ? url : `https://${url}`
}

function renderInlineMarkdown(text: string) {
  let html = escapeHtml(text)

  html = html.replace(
    /\[([^\]]+)\]\(([^)\s]+)\)/g,
    (_match, label, url) => {
      if (!isSafeUrl(url))
        return escapeHtml(`[${label}](${url})`)

      return `<a href="${escapeHtml(normalizeUrl(url))}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a>`
    },
  )

  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')

  return html
}

export function renderMarkdown(text?: string | null) {
  if (!text)
    return ''

  return text
    .split('\n')
    .map(line => renderInlineMarkdown(line))
    .join('<br>')
}

export function resolveExternalUrl(url?: string | null) {
  if (!url?.trim())
    return null

  const trimmed = url.trim()

  if (!isSafeUrl(trimmed))
    return null

  return normalizeUrl(trimmed)
}

export function stripMarkdown(text?: string | null) {
  if (!text)
    return ''

  return text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
}
