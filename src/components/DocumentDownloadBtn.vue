<script setup lang="ts">
import type { Document } from '@/types/document'
import { useDocumentDownload } from '@/composables/useDocumentDownload'

const props = defineProps<{
  document?: Document | null
}>()

const { isDownloading, viewDocumentation } = useDocumentDownload()

const loading = computed(() => isDownloading(props.document?.id))
</script>

<template>
  <IconBtn
    v-if="document"
    size="small"
    :disabled="loading"
    @click="viewDocumentation(document)"
  >
    <VIcon
      :icon="loading ? 'ri-loader-4-line' : 'ri-download-line'"
      :class="{ 'document-download-spinner': loading }"
    />
  </IconBtn>
</template>

<style scoped>
.document-download-spinner {
  animation: document-download-spin 1s linear infinite;
}

@keyframes document-download-spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}
</style>
