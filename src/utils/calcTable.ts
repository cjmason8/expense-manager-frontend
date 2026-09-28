import { HyperFormula } from 'hyperformula'
import type { CalcTable, CalcTableMerge } from '@/types/calcTable'
import { CALC_TABLES_KEY, LEGACY_CALC_TABLES_METADATA_KEY } from '@/types/calcTable'

const DEFAULT_ROWS = 6
const DEFAULT_COLS = 4

export function columnLabel(index: number): string {
  let n = index
  let label = ''

  do {
    label = String.fromCharCode(65 + (n % 26)) + label
    n = Math.floor(n / 26) - 1
  } while (n >= 0)

  return label
}

export function createEmptyGrid(rows = DEFAULT_ROWS, cols = DEFAULT_COLS): string[][] {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => ''))
}

export function createEmptyCalcTable(name = 'Table'): CalcTable {
  return {
    id: crypto.randomUUID(),
    name,
    cells: createEmptyGrid(),
    merges: [],
  }
}

function normalizeCells(value: unknown): string[][] {
  if (!Array.isArray(value) || value.length === 0)
    return createEmptyGrid()

  const rows = value.map(row => {
    if (!Array.isArray(row))
      return Array.from({ length: DEFAULT_COLS }, () => '')

    return row.map(cell => (cell == null ? '' : String(cell)))
  })

  const colCount = Math.max(DEFAULT_COLS, ...rows.map(row => row.length))

  return rows.map(row => {
    if (row.length >= colCount)
      return row

    return [...row, ...Array.from({ length: colCount - row.length }, () => '')]
  })
}

function mergeSpan(merge: CalcTableMerge) {
  return {
    colspan: Math.max(1, merge.colspan || 1),
    rowspan: Math.max(1, merge.rowspan || 1),
  }
}

export function normalizeMerges(
  value: unknown,
  rowCount: number,
  colCount: number,
): CalcTableMerge[] {
  if (!Array.isArray(value))
    return []

  const merges: CalcTableMerge[] = []

  for (const entry of value) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry))
      continue

    const record = entry as Record<string, unknown>
    const row = Number(record.row)
    const col = Number(record.col)
    const colspan = Number(record.colspan ?? 1)
    const rowspan = Number(record.rowspan ?? 1)

    if (!Number.isInteger(row) || !Number.isInteger(col))
      continue
    if (row < 0 || col < 0 || row >= rowCount || col >= colCount)
      continue
    if (!Number.isInteger(colspan) || !Number.isInteger(rowspan))
      continue
    if (colspan < 2 && rowspan < 2)
      continue
    if (row + rowspan > rowCount || col + colspan > colCount)
      continue

    const next: CalcTableMerge = { row, col, colspan }
    if (rowspan > 1)
      next.rowspan = rowspan

    if (mergesOverlap(merges, next))
      continue

    merges.push(next)
  }

  return merges
}

function rangesOverlap(
  a: { row: number, col: number, rowspan: number, colspan: number },
  b: { row: number, col: number, rowspan: number, colspan: number },
) {
  return a.row < b.row + b.rowspan
    && a.row + a.rowspan > b.row
    && a.col < b.col + b.colspan
    && a.col + a.colspan > b.col
}

function mergesOverlap(existing: CalcTableMerge[], candidate: CalcTableMerge) {
  const next = { ...candidate, ...mergeSpan(candidate) }

  return existing.some((merge) => {
    const current = { ...merge, ...mergeSpan(merge) }

    return rangesOverlap(current, next)
  })
}

export function findMergeAt(merges: CalcTableMerge[] | undefined, row: number, col: number) {
  return (merges ?? []).find(merge => merge.row === row && merge.col === col) ?? null
}

export function isCoveredCell(merges: CalcTableMerge[] | undefined, row: number, col: number) {
  return (merges ?? []).some((merge) => {
    const { colspan, rowspan } = mergeSpan(merge)
    if (merge.row === row && merge.col === col)
      return false

    return row >= merge.row
      && row < merge.row + rowspan
      && col >= merge.col
      && col < merge.col + colspan
  })
}

export function getCellMergeInfo(merges: CalcTableMerge[] | undefined, row: number, col: number) {
  const anchor = findMergeAt(merges, row, col)
  if (anchor) {
    const { colspan, rowspan } = mergeSpan(anchor)

    return { kind: 'anchor' as const, merge: anchor, colspan, rowspan }
  }

  if (isCoveredCell(merges, row, col))
    return { kind: 'covered' as const }

  return { kind: 'normal' as const, colspan: 1, rowspan: 1 }
}

export function canMergeRight(table: CalcTable, row: number, col: number) {
  const colCount = table.cells[0]?.length ?? 0
  const existing = findMergeAt(table.merges, row, col)
  const { colspan, rowspan } = existing ? mergeSpan(existing) : { colspan: 1, rowspan: 1 }
  const nextCol = col + colspan

  if (nextCol >= colCount)
    return false

  const proposed: CalcTableMerge = {
    row,
    col,
    colspan: colspan + 1,
    ...(rowspan > 1 ? { rowspan } : {}),
  }
  const others = (table.merges ?? []).filter(m => !(m.row === row && m.col === col))

  return !mergesOverlap(others, proposed)
}

export function mergeRight(table: CalcTable, row: number, col: number): CalcTable {
  if (!canMergeRight(table, row, col))
    return table

  const existing = findMergeAt(table.merges, row, col)
  const { colspan, rowspan } = existing ? mergeSpan(existing) : { colspan: 1, rowspan: 1 }
  const next: CalcTableMerge = {
    row,
    col,
    colspan: colspan + 1,
    ...(rowspan > 1 ? { rowspan } : {}),
  }

  const cells = table.cells.map(r => [...r])
  for (let r = row; r < row + rowspan; r++) {
    for (let c = col; c < col + next.colspan; c++) {
      if (r === row && c === col)
        continue
      cells[r][c] = ''
    }
  }

  const merges = (table.merges ?? []).filter(m => !(m.row === row && m.col === col))
  merges.push(next)

  return { ...table, cells, merges }
}

export function canUnmerge(table: CalcTable, row: number, col: number) {
  const merge = findMergeAt(table.merges, row, col)
  if (!merge)
    return false

  const { colspan, rowspan } = mergeSpan(merge)

  return colspan > 1 || rowspan > 1
}

export function unmerge(table: CalcTable, row: number, col: number): CalcTable {
  if (!canUnmerge(table, row, col))
    return table

  return {
    ...table,
    merges: (table.merges ?? []).filter(m => !(m.row === row && m.col === col)),
  }
}

export function clipMergesToGrid(
  merges: CalcTableMerge[] | undefined,
  rowCount: number,
  colCount: number,
): CalcTableMerge[] {
  return normalizeMerges(merges ?? [], rowCount, colCount)
}

export function parseCalcTable(value: unknown): CalcTable | null {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    return null

  const record = value as Record<string, unknown>
  const name = typeof record.name === 'string' && record.name.trim()
    ? record.name.trim()
    : 'Table'
  const id = typeof record.id === 'string' && record.id
    ? record.id
    : crypto.randomUUID()
  const cells = normalizeCells(record.cells)

  return {
    id,
    name,
    cells,
    merges: normalizeMerges(record.merges, cells.length, cells[0]?.length ?? 0),
  }
}

export function parseCalcTables(value: unknown): CalcTable[] {
  if (!Array.isArray(value))
    return []

  return value
    .map(parseCalcTable)
    .filter((table): table is CalcTable => table != null)
}

function parseChunkObject(chunk?: string | null): Record<string, unknown> {
  if (!chunk?.trim())
    return {}

  try {
    const parsed = JSON.parse(chunk)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))
      return {}

    return parsed as Record<string, unknown>
  }
  catch {
    return {}
  }
}

export function getCalcTablesFromChunk(chunk?: string | null): CalcTable[] {
  return parseCalcTables(parseChunkObject(chunk)[CALC_TABLES_KEY])
}

/**
 * Parses Java's Map/List toString() output, e.g. `{name=Table 1, cells=[[a, b], [, c]]}`.
 * Best effort: a cell containing `, ` or `]` cannot be told apart from a delimiter.
 */
function parseJavaToString(input: string): unknown {
  let i = 0

  function parseScalar(context: 'list' | 'map') {
    const start = i
    while (i < input.length) {
      if (context === 'list' && (input[i] === ']' || input.startsWith(', ', i)))
        break
      if (context === 'map' && (input[i] === '}' || /^, \w+=/.test(input.slice(i, i + 64))))
        break
      i++
    }

    return input.slice(start, i)
  }

  function parseValue(context: 'list' | 'map'): unknown {
    if (input[i] === '{')
      return parseMap()
    if (input[i] === '[')
      return parseList()

    return parseScalar(context)
  }

  function parseList(): unknown[] {
    const result: unknown[] = []
    i++
    if (input[i] === ']') {
      i++

      return result
    }

    while (i < input.length) {
      result.push(parseValue('list'))
      if (input.startsWith(', ', i)) {
        i += 2
        continue
      }
      if (input[i] === ']') {
        i++

        return result
      }
      throw new Error('Malformed list')
    }
    throw new Error('Unterminated list')
  }

  function parseMap(): Record<string, unknown> {
    const result: Record<string, unknown> = {}
    i++
    if (input[i] === '}') {
      i++

      return result
    }

    while (i < input.length) {
      const eq = input.indexOf('=', i)
      if (eq < 0)
        throw new Error('Malformed map')

      const key = input.slice(i, eq)
      i = eq + 1
      result[key] = parseValue('map')
      if (input.startsWith(', ', i)) {
        i += 2
        continue
      }
      if (input[i] === '}') {
        i++

        return result
      }
      throw new Error('Malformed map')
    }
    throw new Error('Unterminated map')
  }

  return parseValue('map')
}

export function getLegacyCalcTablesFromMetadata(metaDataChunk?: string | null): CalcTable[] {
  const legacy = parseChunkObject(metaDataChunk)[LEGACY_CALC_TABLES_METADATA_KEY]

  if (Array.isArray(legacy))
    return parseCalcTables(legacy)

  if (typeof legacy !== 'string' || !legacy.trim().startsWith('{'))
    return []

  try {
    const table = parseCalcTable(parseJavaToString(legacy.trim()))

    return table ? [table] : []
  }
  catch {
    return []
  }
}

export function removeLegacyCalcTablesFromMetadata(metaDataChunk?: string | null): string {
  const next = { ...parseChunkObject(metaDataChunk) }
  if (!(LEGACY_CALC_TABLES_METADATA_KEY in next))
    return metaDataChunk ?? ''

  delete next[LEGACY_CALC_TABLES_METADATA_KEY]

  return Object.keys(next).length === 0 ? '' : JSON.stringify(next)
}

function tableHasContent(table: CalcTable) {
  return table.cells.some(row => row.some(cell => cell.trim().length > 0))
}

export function setCalcTablesInChunk(
  chunk: string | null | undefined,
  tables: CalcTable[],
): string {
  const next = { ...parseChunkObject(chunk) }
  const meaningful = tables
    .filter(tableHasContent)
    .map((table) => {
      const merges = clipMergesToGrid(
        table.merges,
        table.cells.length,
        table.cells[0]?.length ?? 0,
      )

      return {
        id: table.id,
        name: table.name.trim() || 'Table',
        cells: table.cells.map(row => row.map(cell => cell)),
        ...(merges.length > 0 ? { merges } : {}),
      }
    })

  if (meaningful.length === 0)
    delete next[CALC_TABLES_KEY]
  else
    next[CALC_TABLES_KEY] = meaningful

  return Object.keys(next).length === 0 ? '' : JSON.stringify(next)
}

export function evaluateGrid(cells: string[][]): unknown[][] {
  if (cells.length === 0)
    return []

  try {
    const hf = HyperFormula.buildFromArray(cells, {
      licenseKey: 'gpl-v3',
    })

    return hf.getSheetValues(0) as unknown[][]
  }
  catch {
    return cells.map(row => row.map(cell => cell))
  }
}

export function formatCellDisplay(value: unknown): string {
  if (value == null || value === '')
    return ''

  if (typeof value === 'number') {
    if (!Number.isFinite(value))
      return String(value)

    return Number.isInteger(value)
      ? String(value)
      : value.toLocaleString(undefined, {
          maximumFractionDigits: 6,
        })
  }

  if (typeof value === 'object' && value !== null && 'type' in value) {
    const error = value as { type: string, message?: string }

    return error.message ? `#${error.type}!` : `#${error.type}!`
  }

  return String(value)
}

export function addRow(cells: string[][]): string[][] {
  const cols = cells[0]?.length ?? DEFAULT_COLS

  return [...cells, Array.from({ length: cols }, () => '')]
}

export function addColumn(cells: string[][]): string[][] {
  return cells.map(row => [...row, ''])
}

export function removeLastRow(table: CalcTable): CalcTable {
  if (table.cells.length <= 1)
    return table

  const cells = table.cells.slice(0, -1)

  return {
    ...table,
    cells,
    merges: clipMergesToGrid(table.merges, cells.length, cells[0]?.length ?? 0),
  }
}

export function removeLastColumn(table: CalcTable): CalcTable {
  if ((table.cells[0]?.length ?? 0) <= 1)
    return table

  const cells = table.cells.map(row => row.slice(0, -1))

  return {
    ...table,
    cells,
    merges: clipMergesToGrid(table.merges, cells.length, cells[0]?.length ?? 0),
  }
}
