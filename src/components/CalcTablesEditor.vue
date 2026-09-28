<script setup lang="ts">
import { computed, ref } from 'vue'
import type { CalcTable } from '@/types/calcTable'
import {
  addColumn,
  addRow,
  canMergeRight,
  canUnmerge,
  columnLabel,
  createEmptyCalcTable,
  evaluateGrid,
  formatCellDisplay,
  getCellMergeInfo,
  mergeRight,
  removeLastColumn,
  removeLastRow,
  unmerge,
} from '@/utils/calcTable'

const model = defineModel<CalcTable[]>({ required: true })

const selectedCell = ref<{ tableId: string; row: number; col: number } | null>(null)
const editingCell = ref<{ tableId: string; row: number; col: number } | null>(null)

const computedByTable = computed(() => {
  const map = new Map<string, unknown[][]>()

  for (const table of model.value)
    map.set(table.id, evaluateGrid(table.cells))

  return map
})

function findTable(tableId: string) {
  return model.value.find(item => item.id === tableId)
}

function replaceTable(next: CalcTable) {
  model.value = model.value.map(table => (table.id === next.id ? next : table))
}

function addTable() {
  const nextIndex = model.value.length + 1

  model.value = [...model.value, createEmptyCalcTable(`Table ${nextIndex}`)]
}

function removeTable(tableId: string) {
  if (selectedCell.value?.tableId === tableId)
    selectedCell.value = null
  if (editingCell.value?.tableId === tableId)
    editingCell.value = null

  model.value = model.value.filter(table => table.id !== tableId)
}

function updateTableName(tableId: string, name: string) {
  const table = findTable(tableId)
  if (!table)
    return

  replaceTable({ ...table, name })
}

function updateCells(tableId: string, cells: string[][]) {
  const table = findTable(tableId)
  if (!table)
    return

  replaceTable({ ...table, cells })
}

function setCell(tableId: string, row: number, col: number, value: string) {
  const table = findTable(tableId)
  if (!table)
    return

  const cells = table.cells.map((r, ri) =>
    r.map((c, ci) => (ri === row && ci === col ? value : c)),
  )

  updateCells(tableId, cells)
}

function displayValue(tableId: string, row: number, col: number) {
  const raw = findTable(tableId)?.cells[row]?.[col] ?? ''
  if (isEditing(tableId, row, col))
    return raw

  const computedValue = computedByTable.value.get(tableId)?.[row]?.[col]

  return formatCellDisplay(computedValue)
}

function isEditing(tableId: string, row: number, col: number) {
  return editingCell.value?.tableId === tableId
    && editingCell.value.row === row
    && editingCell.value.col === col
}

function isSelected(tableId: string, row: number, col: number) {
  return selectedCell.value?.tableId === tableId
    && selectedCell.value.row === row
    && selectedCell.value.col === col
}

function selectCell(tableId: string, row: number, col: number) {
  const table = findTable(tableId)
  if (!table)
    return

  const info = getCellMergeInfo(table.merges, row, col)
  if (info.kind === 'covered')
    return

  selectedCell.value = { tableId, row, col }
}

function startEdit(tableId: string, row: number, col: number) {
  selectCell(tableId, row, col)
  editingCell.value = { tableId, row, col }
}

function stopEdit() {
  editingCell.value = null
}

function onAddRow(tableId: string) {
  const table = findTable(tableId)
  if (!table)
    return

  updateCells(tableId, addRow(table.cells))
}

function onAddColumn(tableId: string) {
  const table = findTable(tableId)
  if (!table)
    return

  updateCells(tableId, addColumn(table.cells))
}

function onRemoveRow(tableId: string) {
  const table = findTable(tableId)
  if (!table)
    return

  replaceTable(removeLastRow(table))
}

function onRemoveColumn(tableId: string) {
  const table = findTable(tableId)
  if (!table)
    return

  replaceTable(removeLastColumn(table))
}

function isFormula(tableId: string, row: number, col: number) {
  const raw = findTable(tableId)?.cells[row]?.[col] ?? ''

  return raw.trim().startsWith('=')
}

function selectedTable() {
  if (!selectedCell.value)
    return null

  return findTable(selectedCell.value.tableId) ?? null
}

const canMergeSelected = computed(() => {
  const table = selectedTable()
  const cell = selectedCell.value
  if (!table || !cell)
    return false

  return canMergeRight(table, cell.row, cell.col)
})

const canUnmergeSelected = computed(() => {
  const table = selectedTable()
  const cell = selectedCell.value
  if (!table || !cell)
    return false

  return canUnmerge(table, cell.row, cell.col)
})

function onMergeRight() {
  const table = selectedTable()
  const cell = selectedCell.value
  if (!table || !cell)
    return

  replaceTable(mergeRight(table, cell.row, cell.col))
}

function onUnmerge() {
  const table = selectedTable()
  const cell = selectedCell.value
  if (!table || !cell)
    return

  replaceTable(unmerge(table, cell.row, cell.col))
}

function cellAttrs(table: CalcTable, row: number, col: number) {
  const info = getCellMergeInfo(table.merges, row, col)
  if (info.kind === 'covered')
    return null

  if (info.kind === 'anchor') {
    return {
      colspan: info.colspan,
      rowspan: info.rowspan,
      merged: info.colspan > 1 || info.rowspan > 1,
    }
  }

  return { colspan: 1, rowspan: 1, merged: false }
}
</script>

<template>
  <div class="calc-tables">
    <div
      v-if="model.length === 0"
      class="calc-tables__empty text-medium-emphasis text-body-2"
    >
      No calculation tables yet. Add one for budgets, inventories, or any grid with formulas.
    </div>

    <div
      v-for="table in model"
      :key="table.id"
      class="calc-tables__table"
    >
      <div class="calc-tables__toolbar">
        <VTextField
          :model-value="table.name"
          label="Table name"
          hide-details
          density="compact"
          class="calc-tables__name"
          @update:model-value="updateTableName(table.id, String($event ?? ''))"
        />
        <div class="calc-tables__actions">
          <VBtn
            size="small"
            variant="text"
            @click="onAddRow(table.id)"
          >
            + Row
          </VBtn>
          <VBtn
            size="small"
            variant="text"
            @click="onAddColumn(table.id)"
          >
            + Col
          </VBtn>
          <VBtn
            size="small"
            variant="text"
            :disabled="table.cells.length <= 1"
            @click="onRemoveRow(table.id)"
          >
            − Row
          </VBtn>
          <VBtn
            size="small"
            variant="text"
            :disabled="(table.cells[0]?.length ?? 0) <= 1"
            @click="onRemoveColumn(table.id)"
          >
            − Col
          </VBtn>
          <VBtn
            size="small"
            variant="text"
            :disabled="!(selectedCell?.tableId === table.id && canMergeSelected)"
            @click="onMergeRight"
          >
            Merge →
          </VBtn>
          <VBtn
            size="small"
            variant="text"
            :disabled="!(selectedCell?.tableId === table.id && canUnmergeSelected)"
            @click="onUnmerge"
          >
            Unmerge
          </VBtn>
          <VBtn
            size="small"
            variant="text"
            color="error"
            @click="removeTable(table.id)"
          >
            Remove
          </VBtn>
        </div>
      </div>

      <div class="calc-tables__scroll">
        <table class="calc-tables__grid">
          <thead>
            <tr>
              <th class="calc-tables__corner" />
              <th
                v-for="(_, colIndex) in table.cells[0]"
                :key="`col-${colIndex}`"
              >
                {{ columnLabel(colIndex) }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(row, rowIndex) in table.cells"
              :key="`row-${rowIndex}`"
            >
              <th>{{ rowIndex + 1 }}</th>
              <template
                v-for="(_, colIndex) in row"
                :key="`cell-${rowIndex}-${colIndex}`"
              >
                <td
                  v-if="cellAttrs(table, rowIndex, colIndex)"
                  :colspan="cellAttrs(table, rowIndex, colIndex)!.colspan"
                  :rowspan="cellAttrs(table, rowIndex, colIndex)!.rowspan"
                  :class="{
                    'calc-tables__cell--formula': isFormula(table.id, rowIndex, colIndex) && !isEditing(table.id, rowIndex, colIndex),
                    'calc-tables__cell--editing': isEditing(table.id, rowIndex, colIndex),
                    'calc-tables__cell--selected': isSelected(table.id, rowIndex, colIndex) && !isEditing(table.id, rowIndex, colIndex),
                    'calc-tables__cell--merged': cellAttrs(table, rowIndex, colIndex)!.merged,
                  }"
                  @click="startEdit(table.id, rowIndex, colIndex)"
                >
                  <input
                    v-if="isEditing(table.id, rowIndex, colIndex)"
                    :key="`${table.id}-${rowIndex}-${colIndex}`"
                    class="calc-tables__input"
                    :value="table.cells[rowIndex][colIndex]"
                    autofocus
                    @blur="stopEdit"
                    @keydown.enter.prevent="stopEdit"
                    @keydown.escape.prevent="stopEdit"
                    @input="setCell(table.id, rowIndex, colIndex, ($event.target as HTMLInputElement).value)"
                  >
                  <span
                    v-else
                    class="calc-tables__value"
                    :title="table.cells[rowIndex][colIndex] || undefined"
                  >{{ displayValue(table.id, rowIndex, colIndex) }}</span>
                </td>
              </template>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="calc-tables__hint text-caption text-medium-emphasis">
        Click a cell, then
        <strong>Merge →</strong>
        to span a heading across columns.
        Formulas start with
        <code>=</code>
        — e.g.
        <code>=B2+B3</code>
        ,
        <code>=SUM(B2:B5)</code>
      </div>
    </div>

    <VBtn
      variant="tonal"
      prepend-icon="ri-table-line"
      @click="addTable"
    >
      Add table
    </VBtn>
  </div>
</template>

<style scoped lang="scss">
.calc-tables {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.calc-tables__table {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
}

.calc-tables__toolbar {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: space-between;
}

.calc-tables__name {
  max-inline-size: 280px;
  min-inline-size: 180px;
}

.calc-tables__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
}

.calc-tables__scroll {
  max-inline-size: 100%;
  overflow: auto;
}

.calc-tables__grid {
  border-collapse: collapse;
  font-size: 0.875rem;
  min-inline-size: 100%;

  th,
  td {
    border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
    min-inline-size: 96px;
    padding: 0;
  }

  thead th,
  tbody th {
    background: rgba(var(--v-theme-on-surface), 0.04);
    color: rgba(var(--v-theme-on-surface), 0.65);
    font-weight: 600;
    padding-block: 6px;
    padding-inline: 8px;
    text-align: center;
    user-select: none;
  }

  tbody th {
    min-inline-size: 40px;
    width: 40px;
  }
}

.calc-tables__corner {
  min-inline-size: 40px !important;
  width: 40px;
}

.calc-tables__grid td {
  cursor: text;
  height: 34px;
  vertical-align: middle;
}

.calc-tables__cell--formula .calc-tables__value {
  color: rgb(var(--v-theme-primary));
}

.calc-tables__cell--editing,
.calc-tables__cell--selected {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: -2px;
}

.calc-tables__cell--merged .calc-tables__value,
.calc-tables__cell--merged .calc-tables__input {
  font-weight: 600;
  text-align: center;
}

.calc-tables__input,
.calc-tables__value {
  box-sizing: border-box;
  display: block;
  inline-size: 100%;
  min-block-size: 34px;
  padding-block: 6px;
  padding-inline: 8px;
}

.calc-tables__input {
  background: transparent;
  border: 0;
  color: inherit;
  font: inherit;
  outline: none;
}

.calc-tables__value {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.calc-tables__hint code {
  background: rgba(var(--v-theme-on-surface), 0.06);
  border-radius: 3px;
  padding-block: 1px;
  padding-inline: 4px;
}
</style>
