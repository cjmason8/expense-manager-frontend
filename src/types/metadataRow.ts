export interface MetadataRow {
  keyName: string | null
  /** Selected values for this key (one or many) */
  values: string[]
  /** Temporary selection while choosing/adding/editing a value */
  pendingValue: string | null
  confirmed: boolean
  /** True when appending another value to an already confirmed row */
  addingValue: boolean
  /** Index of the value currently being edited, if any */
  editingValueIndex: number | null
}
