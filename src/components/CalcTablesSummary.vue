<script setup lang="ts">
import { computed } from 'vue'
import { getCalcTablesFromChunk } from '@/utils/calcTable'

const props = defineProps<{
  chunk?: string | null
}>()

const tables = computed(() => getCalcTablesFromChunk(props.chunk))
const label = computed(() => {
  if (tables.value.length === 0)
    return ''

  if (tables.value.length === 1)
    return tables.value[0].name || '1 table'

  return `${tables.value.length} tables`
})
</script>

<template>
  <div
    v-if="tables.length"
    class="calc-tables-summary"
  >
    <VIcon
      icon="ri-table-line"
      size="14"
      class="me-1"
    />
    {{ label }}
  </div>
</template>

<style scoped lang="scss">
.calc-tables-summary {
  align-items: center;
  color: rgba(var(--v-theme-on-surface), 0.7);
  display: inline-flex;
  font-size: 0.8125rem;
  margin-block-start: 4px;
  white-space: normal;
}
</style>
