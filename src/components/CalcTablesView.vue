<script setup lang="ts">
import { computed } from 'vue'
import type { CalcTable } from '@/types/calcTable'
import {
  evaluateGrid,
  formatCellDisplay,
  getCellMergeInfo,
} from '@/utils/calcTable'

const props = defineProps<{
  tables: CalcTable[]
}>()

const computedByTable = computed(() => {
  const map = new Map<string, unknown[][]>()

  for (const table of props.tables)
    map.set(table.id, evaluateGrid(table.cells))

  return map
})

function cellValue(table: CalcTable, row: number, col: number) {
  return computedByTable.value.get(table.id)?.[row]?.[col]
}

function cellAttrs(table: CalcTable, row: number, col: number) {
  const info = getCellMergeInfo(table.merges, row, col)
  if (info.kind === 'covered')
    return null

  const colspan = info.kind === 'anchor' ? info.colspan : 1
  const rowspan = info.kind === 'anchor' ? info.rowspan : 1

  return {
    colspan,
    rowspan,
    merged: colspan > 1 || rowspan > 1,
    numeric: typeof cellValue(table, row, col) === 'number',
  }
}
</script>

<template>
  <div class="calc-tables-view">
    <div
      v-for="table in tables"
      :key="table.id"
      class="calc-tables-view__table"
    >
      <div class="calc-tables-view__name">
        {{ table.name }}
      </div>
      <div class="calc-tables-view__scroll">
        <table class="calc-tables-view__grid">
          <tbody>
            <tr
              v-for="(row, rowIndex) in table.cells"
              :key="`row-${rowIndex}`"
            >
              <template
                v-for="(_, colIndex) in row"
                :key="`cell-${rowIndex}-${colIndex}`"
              >
                <td
                  v-if="cellAttrs(table, rowIndex, colIndex)"
                  :colspan="cellAttrs(table, rowIndex, colIndex)!.colspan"
                  :rowspan="cellAttrs(table, rowIndex, colIndex)!.rowspan"
                  :class="{
                    'calc-tables-view__cell--merged': cellAttrs(table, rowIndex, colIndex)!.merged,
                    'calc-tables-view__cell--numeric': cellAttrs(table, rowIndex, colIndex)!.numeric,
                  }"
                >
                  {{ formatCellDisplay(cellValue(table, rowIndex, colIndex)) }}
                </td>
              </template>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.calc-tables-view {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.calc-tables-view__name {
  font-weight: 600;
  margin-block-end: 6px;
}

.calc-tables-view__scroll {
  max-inline-size: 100%;
  overflow: auto;
}

.calc-tables-view__grid {
  border-collapse: collapse;
  font-size: 0.875rem;

  td {
    border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
    min-inline-size: 96px;
    padding-block: 6px;
    padding-inline: 10px;
    white-space: nowrap;
  }
}

.calc-tables-view__cell--numeric {
  font-variant-numeric: tabular-nums;
  text-align: end;
}

.calc-tables-view__cell--merged {
  font-weight: 600;
  text-align: center;
}
</style>
