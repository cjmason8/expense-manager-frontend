<script setup lang="ts">
import { computed } from 'vue'
import { renderMarkdown } from '@/utils/renderMarkdown'

const props = defineProps<{
  content?: string | null
}>()

const html = computed(() => renderMarkdown(props.content))
</script>

<template>
  <div
    v-if="html"
    class="markdown-content"
    v-html="html"
  />
</template>

<style scoped lang="scss">
.markdown-content {
  overflow-wrap: anywhere;
  white-space: normal;

  :deep(a) {
    color: rgb(var(--v-theme-primary));
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  :deep(strong) {
    font-weight: 600;
  }
}
</style>
