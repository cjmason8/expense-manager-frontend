<script setup lang="ts">
import type { MetadataRow } from '@/types/metadataRow'
import MetadataRowsEditor from '@/components/MetadataRowsEditor.vue'
import { useMetadataKeysStore } from '@/stores/metadataKeysStore'

const model = defineModel<string | undefined>({ default: '' })

const metadataKeysStore = useMetadataKeysStore()

const rows = ref<MetadataRow[]>([createEmptyRow()])
const preservedEntries = ref<Record<string, unknown>>({})
const syncingFromModel = ref(false)

function createEmptyRow(): MetadataRow {
  return {
    keyName: null,
    values: [],
    pendingValue: null,
    confirmed: false,
    addingValue: false,
    editingValueIndex: null,
  }
}

function ensureTrailingEmptyRow(list: MetadataRow[]) {
  if (list.length === 0) {
    list.push(createEmptyRow())

    return
  }

  const last = list[list.length - 1]
  if (last.confirmed && !last.addingValue && last.editingValueIndex == null)
    list.push(createEmptyRow())
}

function rowsToObject(list: MetadataRow[]): Record<string, unknown> {
  const result: Record<string, unknown> = {}

  for (const row of list) {
    if (!row.keyName || row.values.length === 0)
      continue

    result[row.keyName] = row.values.length === 1 ? row.values[0] : [...row.values]
  }

  return result
}

function normalizeValues(entryValue: unknown): string[] {
  if (Array.isArray(entryValue))
    return entryValue.map(item => String(item))

  if (entryValue == null || typeof entryValue === 'object')
    return []

  return [String(entryValue)]
}

function isPreservedEntry(key: string, entryValue: unknown) {
  if (key.startsWith('__'))
    return true

  return entryValue != null && typeof entryValue === 'object' && !Array.isArray(entryValue)
}

function splitChunkObject(value: unknown): {
  rowSource: Record<string, unknown>
  preserved: Record<string, unknown>
} {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    return { rowSource: {}, preserved: {} }

  const rowSource: Record<string, unknown> = {}
  const preserved: Record<string, unknown> = {}

  for (const [key, entryValue] of Object.entries(value as Record<string, unknown>)) {
    if (isPreservedEntry(key, entryValue))
      preserved[key] = entryValue
    else
      rowSource[key] = entryValue
  }

  return { rowSource, preserved }
}

function objectToRows(value: unknown): MetadataRow[] {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    return [createEmptyRow()]

  const list: MetadataRow[] = []

  for (const [key, entryValue] of Object.entries(value as Record<string, unknown>)) {
    const values = normalizeValues(entryValue)
    if (values.length === 0)
      continue

    list.push({
      keyName: key,
      values,
      pendingValue: null,
      confirmed: true,
      addingValue: false,
      editingValueIndex: null,
    })
  }

  ensureTrailingEmptyRow(list)

  return list.length > 0 ? list : [createEmptyRow()]
}

function buildChunkFromState() {
  const built = {
    ...preservedEntries.value,
    ...rowsToObject(rows.value),
  }

  return Object.keys(built).length === 0 ? '' : JSON.stringify(built)
}

function syncModelFromRows() {
  if (syncingFromModel.value)
    return

  const next = buildChunkFromState()

  if (next !== model.value)
    model.value = next
}

function loadFromModel(chunk: string | undefined) {
  syncingFromModel.value = true
  try {
    if (!chunk?.trim()) {
      rows.value = [createEmptyRow()]
      preservedEntries.value = {}

      return
    }

    try {
      const { rowSource, preserved } = splitChunkObject(JSON.parse(chunk))

      preservedEntries.value = preserved
      rows.value = objectToRows(rowSource)
    }
    catch {
      rows.value = [createEmptyRow()]
      preservedEntries.value = {}
    }
  }
  finally {
    syncingFromModel.value = false
  }
}

onMounted(() => {
  if (metadataKeysStore.metadataKeys.length === 0)
    metadataKeysStore.getMetadataKeys()

  loadFromModel(model.value)
})

watch(model, chunk => {
  const current = buildChunkFromState()

  if (chunk !== current)
    loadFromModel(chunk)
})

watch(rows, () => syncModelFromRows(), { deep: true })
</script>

<template>
  <MetadataRowsEditor v-model="rows" />
</template>
