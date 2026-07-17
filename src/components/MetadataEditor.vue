<script setup lang="ts">
import type { MetadataRow } from '@/types/metadataRow'
import MetadataRowsEditor from '@/components/MetadataRowsEditor.vue'
import { useMetadataKeysStore } from '@/stores/metadataKeysStore'

const model = defineModel<string | undefined>({ default: '' })

const metadataKeysStore = useMetadataKeysStore()

const rows = ref<MetadataRow[]>([createEmptyRow()])
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

function objectToRows(value: unknown): MetadataRow[] {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    return [createEmptyRow()]

  const list: MetadataRow[] = Object.entries(value as Record<string, unknown>)
    .map(([key, entryValue]) => {
      const values = normalizeValues(entryValue)
      if (values.length === 0)
        return null

      return {
        keyName: key,
        values,
        pendingValue: null,
        confirmed: true,
        addingValue: false,
        editingValueIndex: null,
      } satisfies MetadataRow
    })
    .filter((row): row is MetadataRow => row != null)

  ensureTrailingEmptyRow(list)

  return list.length > 0 ? list : [createEmptyRow()]
}

function syncModelFromRows() {
  if (syncingFromModel.value)
    return

  const built = rowsToObject(rows.value)
  const next = Object.keys(built).length === 0 ? '' : JSON.stringify(built)

  if (next !== model.value)
    model.value = next
}

function loadFromModel(chunk: string | undefined) {
  syncingFromModel.value = true
  try {
    if (!chunk?.trim()) {
      rows.value = [createEmptyRow()]

      return
    }

    try {
      rows.value = objectToRows(JSON.parse(chunk))
    }
    catch {
      rows.value = [createEmptyRow()]
    }
  }
  finally {
    syncingFromModel.value = false
  }
}

onMounted(() => {
  if (metadataKeysStore.metadataKeys.length === 0)
    void metadataKeysStore.getMetadataKeys()

  loadFromModel(model.value)
})

watch(model, chunk => {
  const built = rowsToObject(rows.value)
  const current = Object.keys(built).length === 0 ? '' : JSON.stringify(built)

  if (chunk !== current)
    loadFromModel(chunk)
})

watch(rows, () => syncModelFromRows(), { deep: true })
</script>

<template>
  <MetadataRowsEditor v-model="rows" />
</template>
