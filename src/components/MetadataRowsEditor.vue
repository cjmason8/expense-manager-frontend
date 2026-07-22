<script setup lang="ts">
import { useMetadataKeysStore } from '@/stores/metadataKeysStore'
import { useMetadataValuesStore } from '@/stores/metadataValuesStore'
import type { MetadataRow } from '@/types/metadataRow'

const rows = defineModel<MetadataRow[]>({ required: true })

const metadataKeysStore = useMetadataKeysStore()
const metadataValuesStore = useMetadataValuesStore()
const metadataKeys = computed(() => metadataKeysStore.metadataKeys)

const addKeyDialog = ref(false)
const newKeyName = ref('')
const addKeyTargetRow = ref<MetadataRow | null>(null)

const addValueDialog = ref(false)
const newValueText = ref('')
const addValueTargetRow = ref<MetadataRow | null>(null)

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

function ensureTrailingEmptyRow() {
  if (rows.value.length === 0) {
    rows.value.push(createEmptyRow())

    return
  }

  const last = rows.value[rows.value.length - 1]
  if (last.confirmed && !last.addingValue && last.editingValueIndex == null)
    rows.value.push(createEmptyRow())
}

function availableKeysForRow(row: MetadataRow) {
  const used = new Set(
    rows.value
      .filter(item => item !== row && item.keyName)
      .map(item => item.keyName as string),
  )

  return metadataKeys.value.filter(key => !used.has(key.name) || key.name === row.keyName)
}

function keyForName(name: string | null) {
  if (!name)
    return undefined

  return metadataKeys.value.find(key => key.name === name)
}

/** Dropdown options excluding other selected values; keeps current edit value available */
function optionValuesForRow(row: MetadataRow, editingIndex: number | null = null) {
  const key = keyForName(row.keyName)
  const options = metadataValuesStore.valuesForKey(key?.id)

  const selected = new Set(
    row.values.filter((_, index) => index !== editingIndex),
  )

  return options.filter(option => !selected.has(option.value))
}

function canAddValue(row: MetadataRow) {
  return optionValuesForRow(row).length > 0
}

async function onKeySelected(row: MetadataRow) {
  row.values = []
  row.pendingValue = null
  row.confirmed = false
  row.addingValue = false
  row.editingValueIndex = null

  const key = keyForName(row.keyName)
  if (key?.id != null)
    await metadataValuesStore.ensureValuesForKey(key.id)
}

function onValueSelected(row: MetadataRow) {
  if (!row.pendingValue)
    return

  if (row.editingValueIndex != null) {
    const index = row.editingValueIndex
    if (row.values.includes(row.pendingValue) && row.values[index] !== row.pendingValue) {
      row.pendingValue = null

      return
    }

    row.values[index] = row.pendingValue
    row.pendingValue = null
    row.editingValueIndex = null
    row.confirmed = true

    return
  }

  if (row.values.includes(row.pendingValue)) {
    row.pendingValue = null

    return
  }

  if (row.addingValue) {
    row.values.push(row.pendingValue)
    row.pendingValue = null
    row.addingValue = false
    row.confirmed = true
    ensureTrailingEmptyRow()

    return
  }

  row.values = [row.pendingValue]
  row.pendingValue = null
  row.confirmed = true
  ensureTrailingEmptyRow()
}

function editValue(row: MetadataRow, index: number) {
  row.addingValue = false
  row.editingValueIndex = index
  row.pendingValue = row.values[index] ?? null
}

function cancelEditValue(row: MetadataRow) {
  row.editingValueIndex = null
  row.pendingValue = null
}

function deleteValue(row: MetadataRow, index: number) {
  row.values.splice(index, 1)
  row.addingValue = false
  row.editingValueIndex = null
  row.pendingValue = null

  if (row.values.length === 0) {
    const rowIndex = rows.value.indexOf(row)
    if (rowIndex !== -1)
      rows.value.splice(rowIndex, 1)

    if (rows.value.length === 0 || rows.value.every(item => item.confirmed && !item.addingValue))
      ensureTrailingEmptyRow()
  }
}

function startAddValue(row: MetadataRow) {
  if (!canAddValue(row))
    return

  row.editingValueIndex = null
  row.addingValue = true
  row.pendingValue = null
}

function cancelAddValue(row: MetadataRow) {
  row.addingValue = false
  row.pendingValue = null
}

function openAddKeyDialog(row: MetadataRow) {
  addKeyTargetRow.value = row
  newKeyName.value = ''
  addKeyDialog.value = true
}

async function saveNewKey() {
  const name = newKeyName.value.trim()
  if (!name)
    return

  const created = await metadataKeysStore.addMetadataKey(name)
  if (created && addKeyTargetRow.value) {
    addKeyTargetRow.value.keyName = created.name
    addKeyTargetRow.value.values = []
    addKeyTargetRow.value.pendingValue = null
    addKeyTargetRow.value.confirmed = false
    addKeyTargetRow.value.addingValue = false
    addKeyTargetRow.value.editingValueIndex = null
    if (created.id != null)
      await metadataValuesStore.ensureValuesForKey(created.id)
  }

  addKeyDialog.value = false
  addKeyTargetRow.value = null
  newKeyName.value = ''
}

function openAddValueDialog(row: MetadataRow) {
  addValueTargetRow.value = row
  newValueText.value = ''
  addValueDialog.value = true
}

async function saveNewValue() {
  const value = newValueText.value.trim()
  const row = addValueTargetRow.value
  const key = keyForName(row?.keyName ?? null)

  if (!value || !row || !key)
    return

  const editingIndex = row.editingValueIndex
  const blocked = row.values.filter((_, index) => index !== editingIndex)
  if (blocked.includes(value)) {
    addValueDialog.value = false
    addValueTargetRow.value = null
    newValueText.value = ''

    return
  }

  const created = await metadataValuesStore.addMetadataValue(value, key)
  if (created) {
    row.pendingValue = created.value
    onValueSelected(row)
  }

  addValueDialog.value = false
  addValueTargetRow.value = null
  newValueText.value = ''
}

watch(
  () => rows.value.map(row => row.keyName).join('|'),
  async () => {
    const ids = rows.value
      .map(row => keyForName(row.keyName)?.id)
      .filter((id): id is number => id != null)

    await Promise.all(ids.map(id => metadataValuesStore.ensureValuesForKey(id)))
  },
  { immediate: true },
)
</script>

<template>
  <div class="metadata-rows-editor">
    <table class="metadata-table">
      <tbody>
        <template
          v-for="(row, rowIndex) in rows"
          :key="rowIndex"
        >
          <!-- Confirmed values as separate rows -->
          <template v-if="row.confirmed">
            <tr
              v-for="(value, valueIndex) in row.values"
              :key="`${rowIndex}-${valueIndex}`"
            >
              <td class="metadata-col-key">
                <span
                  v-if="valueIndex === 0"
                  class="text-body-2"
                >{{ row.keyName }}</span>
              </td>

              <td class="metadata-col-value">
                <VAutocomplete
                  v-if="row.editingValueIndex === valueIndex"
                  v-model="row.pendingValue"
                  :items="optionValuesForRow(row, valueIndex)"
                  item-title="value"
                  item-value="value"
                  placeholder="Select value..."
                  density="compact"
                  hide-details
                  @update:model-value="onValueSelected(row)"
                />
                <span
                  v-else
                  class="text-body-2"
                >{{ value }}</span>
              </td>

              <td class="metadata-col-action">
                <div
                  v-if="row.editingValueIndex === valueIndex"
                  class="d-flex align-center gap-2"
                >
                  <VBtn
                    size="small"
                    variant="tonal"
                    @click="cancelEditValue(row)"
                  >
                    Cancel
                  </VBtn>
                  <VBtn
                    size="small"
                    variant="tonal"
                    @click="openAddValueDialog(row)"
                  >
                    New value
                  </VBtn>
                </div>
                <div
                  v-else
                  class="d-flex align-center gap-2"
                >
                  <VBtn
                    size="small"
                    variant="tonal"
                    @click="editValue(row, valueIndex)"
                  >
                    Edit
                  </VBtn>
                  <VBtn
                    size="small"
                    variant="tonal"
                    color="error"
                    @click="deleteValue(row, valueIndex)"
                  >
                    Delete
                  </VBtn>
                </div>
              </td>

              <td class="metadata-col-extra">
                <VBtn
                  v-if="valueIndex === 0 && row.editingValueIndex == null && !row.addingValue"
                  size="small"
                  variant="tonal"
                  class="metadata-add-btn"
                  :disabled="!canAddValue(row)"
                  @click="startAddValue(row)"
                >
                  Add
                </VBtn>
              </td>
            </tr>

            <!-- Row for appending another value -->
            <tr v-if="row.addingValue">
              <td class="metadata-col-key" />
              <td class="metadata-col-value">
                <VAutocomplete
                  v-model="row.pendingValue"
                  :items="optionValuesForRow(row)"
                  item-title="value"
                  item-value="value"
                  placeholder="Select value..."
                  density="compact"
                  hide-details
                  @update:model-value="onValueSelected(row)"
                />
              </td>
              <td class="metadata-col-action">
                <VBtn
                  size="small"
                  variant="tonal"
                  @click="cancelAddValue(row)"
                >
                  Cancel
                </VBtn>
              </td>
              <td class="metadata-col-extra">
                <VBtn
                  size="small"
                  variant="tonal"
                  @click="openAddValueDialog(row)"
                >
                  New value
                </VBtn>
              </td>
            </tr>
          </template>

          <!-- Editable / new key row -->
          <tr v-else>
            <td class="metadata-col-key">
              <VAutocomplete
                v-model="row.keyName"
                :items="availableKeysForRow(row)"
                item-title="name"
                item-value="name"
                placeholder="Select key..."
                density="compact"
                hide-details
                @update:model-value="onKeySelected(row)"
              />
            </td>
            <td class="metadata-col-value">
              <VAutocomplete
                v-if="row.keyName"
                v-model="row.pendingValue"
                :items="optionValuesForRow(row)"
                item-title="value"
                item-value="value"
                placeholder="Select value..."
                density="compact"
                hide-details
                @update:model-value="onValueSelected(row)"
              />
            </td>
            <td class="metadata-col-action">
              <VBtn
                v-if="!row.keyName"
                size="small"
                variant="tonal"
                block
                @click="openAddKeyDialog(row)"
              >
                Add key
              </VBtn>
            </td>
            <td class="metadata-col-extra">
              <VBtn
                v-if="row.keyName"
                size="small"
                variant="tonal"
                @click="openAddValueDialog(row)"
              >
                New value
              </VBtn>
            </td>
          </tr>
        </template>
      </tbody>
    </table>

    <VDialog
      v-model="addKeyDialog"
      max-width="420px"
    >
      <VCard title="Add metadata key">
        <VCardText>
          <VTextField
            v-model="newKeyName"
            label="Key name"
            autofocus
            @keyup.enter="saveNewKey"
          />
        </VCardText>
        <VCardText>
          <div class="d-flex gap-4 justify-end">
            <VBtn
              variant="outlined"
              @click="addKeyDialog = false"
            >
              Cancel
            </VBtn>
            <VBtn
              color="success"
              :disabled="!newKeyName.trim()"
              @click="saveNewKey"
            >
              Save
            </VBtn>
          </div>
        </VCardText>
      </VCard>
    </VDialog>

    <VDialog
      v-model="addValueDialog"
      max-width="420px"
    >
      <VCard title="Add metadata value">
        <VCardText>
          <VTextField
            v-model="newValueText"
            label="Value"
            autofocus
            @keyup.enter="saveNewValue"
          />
        </VCardText>
        <VCardText>
          <div class="d-flex gap-4 justify-end">
            <VBtn
              variant="outlined"
              @click="addValueDialog = false"
            >
              Cancel
            </VBtn>
            <VBtn
              color="success"
              :disabled="!newValueText.trim()"
              @click="saveNewValue"
            >
              Save
            </VBtn>
          </div>
        </VCardText>
      </VCard>
    </VDialog>
  </div>
</template>

<style scoped>
.metadata-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0 8px;
  table-layout: fixed;
}

.metadata-col-key {
  width: 24%;
  padding-right: 8px;
  vertical-align: middle;
}

.metadata-col-value {
  width: 28%;
  padding-right: 8px;
  vertical-align: middle;
}

.metadata-col-action {
  width: 180px;
  padding-right: 8px;
  vertical-align: middle;
}

.metadata-col-extra {
  width: auto;
  vertical-align: middle;
}

.metadata-add-btn {
  margin-left: 24px;
}
</style>
