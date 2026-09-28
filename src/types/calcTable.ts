export interface CalcTableMerge {
  /** Top-left cell row (0-based). */
  row: number
  /** Top-left cell column (0-based). */
  col: number
  /** Number of columns spanned (>= 2 for a merge). */
  colspan: number
  /** Number of rows spanned (>= 1). Defaults to 1. */
  rowspan?: number
}

export interface CalcTable {
  id: string
  name: string
  /** Raw cell values; formulas start with `=` (Excel-style). */
  cells: string[][]
  /** Visual merges; value lives in the top-left (anchor) cell. */
  merges?: CalcTableMerge[]
}

/** Key inside the entity's dataChunk JSON. */
export const CALC_TABLES_KEY = 'calcTables'

/** Metadata stores values as flat strings, so tables saved under this key lost their JSON structure. */
export const LEGACY_CALC_TABLES_METADATA_KEY = '__calcTables'
