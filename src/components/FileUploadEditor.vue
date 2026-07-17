<script setup lang="ts">
import { useDocumentStore } from '@/stores/documentStore'
import type { Document } from '@/types/document'

const model = defineModel<Document | undefined>()

const props = withDefaults(defineProps<{
  uploadType?: string
  uploadPath?: string
  accept?: string
}>(), {
  accept: '.pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg',
})

const emit = defineEmits<{
  uploaded: [document: Document]
}>()

const documentStore = useDocumentStore()

const file = ref<File | File[] | null>(null)
const imageUrl = ref<string | null>(null)
const uploading = ref(false)
const uploadStatusMessage = ref('')
const uploadStatusError = ref(false)

const selectedFile = computed(() => {
  if (!file.value)
    return null

  return Array.isArray(file.value) ? file.value[0] ?? null : file.value
})

const hasAttachedFile = computed(() => {
  const doc = model.value
  if (!doc?.id || doc.id === '' || doc.id === -1)
    return false

  return Boolean(doc.fileName || doc.originalFileName)
})

const attachedFileName = computed(() =>
  model.value?.originalFileName || model.value?.fileName || 'Attached file',
)

function reset() {
  file.value = null
  imageUrl.value = null
  uploading.value = false
  uploadStatusMessage.value = ''
  uploadStatusError.value = false
}

function handleFileChange() {
  uploadStatusMessage.value = ''
  uploadStatusError.value = false

  const current = selectedFile.value
  if (!current) {
    imageUrl.value = null

    return
  }

  if (current.type.startsWith('image/')) {
    const reader = new FileReader()

    reader.onload = (e: ProgressEvent<FileReader>) => {
      imageUrl.value = e.target?.result as string
    }
    reader.readAsDataURL(current)
  }
  else {
    imageUrl.value = null
  }
}

async function uploadFile() {
  const current = selectedFile.value
  if (!current || uploading.value)
    return

  uploading.value = true
  uploadStatusMessage.value = ''
  uploadStatusError.value = false

  try {
    const res = await documentStore.uploadFile(
      current,
      props.uploadType,
      props.uploadPath,
    ) as Document | undefined

    if (res) {
      const next: Document = {
        ...(model.value ?? {}),
        ...res,
        originalFileName: res.originalFileName || res.fileName,
        ...(props.uploadPath != null ? { folderPath: props.uploadPath } : {}),
      }

      model.value = next
      emit('uploaded', next)
      uploadStatusMessage.value = 'Upload finished. The file is attached. Choose another file to upload again.'
      uploadStatusError.value = false
      file.value = null
      imageUrl.value = null
    }
    else {
      uploadStatusMessage.value = 'Upload failed. Please try again.'
      uploadStatusError.value = true
    }
  }
  catch {
    uploadStatusMessage.value = 'Upload failed. Please try again.'
    uploadStatusError.value = true
  }
  finally {
    uploading.value = false
  }
}

watch(file, newFile => {
  if (!newFile)
    imageUrl.value = null
})

defineExpose({
  reset,
})
</script>

<template>
  <VCard class="file-upload-editor">
    <VCardTitle>Upload File</VCardTitle>
    <VCardText>
      <VAlert
        v-if="hasAttachedFile"
        type="info"
        density="compact"
        variant="tonal"
        class="mb-3"
      >
        <div class="d-flex align-center justify-space-between gap-2">
          <span>Attached: {{ attachedFileName }}</span>
          <DocumentDownloadBtn :document="model" />
        </div>
      </VAlert>

      <VFileInput
        v-model="file"
        class="file-upload-input"
        :label="hasAttachedFile ? 'Replace file' : 'Choose a file'"
        :accept="accept"
        show-size
        @change="handleFileChange"
      />

      <VProgressLinear
        v-if="uploading"
        indeterminate
        color="primary"
        class="mt-2"
      />

      <VAlert
        v-if="uploadStatusMessage"
        :type="uploadStatusError ? 'error' : 'success'"
        density="compact"
        variant="tonal"
        class="mt-2"
      >
        {{ uploadStatusMessage }}
      </VAlert>

      <VBtn
        :disabled="!selectedFile || uploading"
        color="primary"
        class="mt-2"
        @click="uploadFile"
      >
        Upload
      </VBtn>

      <VImg
        v-if="imageUrl"
        :src="imageUrl"
        class="mt-4"
        max-width="200"
      />
    </VCardText>
  </VCard>
</template>

<style scoped>
.file-upload-editor {
  width: 650px;
  max-width: 100%;
}

.file-upload-input {
  width: 600px;
  max-width: 100%;
}
</style>
