export const TOTAL_METADATA_KEY = 'Total'
export const UNKNOWN_TOTAL = 'UNKNOWN'

const MAINTENANCE_FOLDER = /(?:^|\/)IPs\/[^/]+\/\d{4}-\d{4}\/maintenance\/?$/i
const AMOUNT = /^-?\d+(?:\.\d{1,2})?$/

const currencyFormat = new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' })

export function isMaintenanceFolder(folderPath?: string) {
  return !!folderPath && MAINTENANCE_FOLDER.test(folderPath)
}

function parseMetadata(metaDataChunk?: string): Record<string, unknown> {
  if (!metaDataChunk)
    return {}

  try {
    const parsed = JSON.parse(metaDataChunk)

    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  }
  catch {
    return {}
  }
}

export function getTotal(metaDataChunk?: string): string | undefined {
  const value = parseMetadata(metaDataChunk)[TOTAL_METADATA_KEY]
  const first = Array.isArray(value) ? value[0] : value

  return first == null || first === '' ? undefined : String(first)
}

export function withTotal(metaDataChunk: string | undefined, total: string) {
  return JSON.stringify({ ...parseMetadata(metaDataChunk), [TOTAL_METADATA_KEY]: total })
}

/** Returns the normalised total (e.g. `379.00` or `UNKNOWN`), or null when the input isn't valid. */
export function parseTotalInput(input: string): string | null {
  const trimmed = input.trim()
  if (trimmed === '' || trimmed.toUpperCase() === UNKNOWN_TOTAL)
    return UNKNOWN_TOTAL

  const cleaned = trimmed.replace(/[\s,$]/g, '')

  return AMOUNT.test(cleaned) ? Number(cleaned).toFixed(2) : null
}

export function totalInCents(total?: string): number | null {
  if (!total || !AMOUNT.test(total))
    return null

  return Math.round(Number(total) * 100)
}

export function formatTotal(total: string) {
  const cents = totalInCents(total)

  return cents == null ? total : currencyFormat.format(cents / 100)
}

export function formatCents(cents: number) {
  return currencyFormat.format(cents / 100)
}
