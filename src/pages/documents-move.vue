<script setup lang="ts">
import { useDocumentStore } from '@/stores/documentStore'
import type { Document } from '@/types/document'

const router = useRouter()
const documentStore = useDocumentStore()

const documents = ref<Document[]>([])
const selectedIds = ref<Array<string | number>>([])
const moving = ref(false)
const moveError = ref('')
const loadingDest = ref(false)

const destFolderPath = ref(documentStore.ROOT_FOLDER_PATH)
const destFolders = ref<Document[]>([])

const displayedSourcePath = computed(() => toDisplayPath(documentStore.currentFolderPath))

const displayedDestPath = computed(() => toDisplayPath(destFolderPath.value))

const destBreadcrumbs = computed(() => {
  const relative = toRelativePath(destFolderPath.value)
  if (!relative)
    return [{ label: '/', path: documentStore.ROOT_FOLDER_PATH }]

  const segments = relative.split('/')
  const crumbs = [{ label: '/', path: documentStore.ROOT_FOLDER_PATH }]

  let built = documentStore.ROOT_FOLDER_PATH
  for (const segment of segments) {
    built = `${built}/${segment}`
    crumbs.push({ label: segment, path: built })
  }

  return crumbs
})

const canMove = computed(() =>
  selectedIds.value.length > 0
  && !moving.value
  && destFolderPath.value !== documentStore.currentFolderPath,
)

const headers = [
  { title: '', key: 'selected', sortable: false, width: '48px' },
  { title: 'Name', key: 'fileName' },
]

const destHeaders = [
  { title: 'Folder', key: 'fileName' },
]

function toDisplayPath(path: string) {
  if (!path || path === documentStore.ROOT_FOLDER_PATH)
    return '/'

  return path.replace(`${documentStore.ROOT_FOLDER_PATH}/`, '/')
}

function toRelativePath(absolutePath: string) {
  if (!absolutePath || absolutePath === documentStore.ROOT_FOLDER_PATH)
    return ''

  return absolutePath.replace(`${documentStore.ROOT_FOLDER_PATH}/`, '')
}

function isSelected(id: string | number) {
  return selectedIds.value.includes(id)
}

function toggleSelected(item: Document) {
  if (isSelected(item.id))
    selectedIds.value = selectedIds.value.filter(id => id !== item.id)
  else
    selectedIds.value = [...selectedIds.value, item.id]
}

async function loadDocuments() {
  const folderPath = documentStore.currentFolderPath || documentStore.ROOT_FOLDER_PATH
  const res = await documentStore.getDocuments(folderPath, false)

  documents.value = res ?? []
  selectedIds.value = []
}

async function loadDestFolders(path: string) {
  loadingDest.value = true
  moveError.value = ''
  try {
    const res = await documentStore.getDocuments(path, false)

    destFolderPath.value = path
    destFolders.value = (res ?? [])
      .filter(doc => doc.isFolder)
      .sort((a, b) => a.fileName.localeCompare(b.fileName))
  }
  finally {
    loadingDest.value = false
  }
}

function openDestFolder(folder: Document) {
  const nextPath = `${folder.folderPath}/${folder.fileName}`

  loadDestFolders(nextPath)
}

function goToDestPath(path: string) {
  loadDestFolders(path)
}

function goUpDest() {
  if (destFolderPath.value === documentStore.ROOT_FOLDER_PATH)
    return

  const lastSlash = destFolderPath.value.lastIndexOf('/')

  const parent = lastSlash > 0
    ? destFolderPath.value.slice(0, lastSlash)
    : documentStore.ROOT_FOLDER_PATH

  loadDestFolders(parent || documentStore.ROOT_FOLDER_PATH)
}

async function moveFiles() {
  if (!canMove.value)
    return

  moving.value = true
  moveError.value = ''
  try {
    const result = await documentStore.moveFiles(
      selectedIds.value,
      toRelativePath(destFolderPath.value),
    )

    if (!result) {
      moveError.value = 'Move failed. Please try another destination folder.'

      return
    }

    if (result.folderPath)
      documentStore.currentFolderPath = result.folderPath

    await router.push({ path: '/documents', query: { existingFolder: 'true' } })
  }
  finally {
    moving.value = false
  }
}

function cancel() {
  router.push('/documents')
}

onMounted(() => {
  loadDocuments()
  loadDestFolders(documentStore.ROOT_FOLDER_PATH)
})
</script>

<template>
  <VContainer>
    <VRow class="align-center">
      <VCol
        cols="12"
        sm="auto"
      >
        <VCard>
          <VCardTitle>
            From: {{ displayedSourcePath }}
          </VCardTitle>
        </VCard>
      </VCol>
      <VCol
        cols="12"
        sm="auto"
      >
        <VBtn
          variant="outlined"
          @click="cancel"
        >
          Cancel
        </VBtn>
      </VCol>
    </VRow>

    <VRow>
      <VCol
        cols="12"
        md="6"
      >
        <VCard>
          <VCardTitle>Select items to move</VCardTitle>
          <VCardText>
            Choose files or folders from the current directory.
          </VCardText>
          <VDataTable
            :headers="headers"
            :items="documents"
            :items-per-page="25"
            class="text-no-wrap"
          >
            <template #item.selected="{ item }">
              <VCheckbox
                :model-value="isSelected(item.id)"
                hide-details
                density="compact"
                @update:model-value="toggleSelected(item)"
              />
            </template>

            <template #item.fileName="{ item }">
              <span class="d-flex align-center gap-1">
                <VIcon
                  :icon="item.isFolder ? 'ri-folder-line' : 'ri-file-line'"
                  size="18"
                />
                {{ item.fileName }}
              </span>
            </template>
          </VDataTable>
        </VCard>
      </VCol>

      <VCol
        cols="12"
        md="6"
      >
        <VCard>
          <VCardTitle>Move to</VCardTitle>
          <VCardText>
            Browse folders starting from <code>/</code>. Open a folder to see its subfolders,
            then click Move when this is the destination you want.
          </VCardText>

          <VCardText class="pt-0">
            <div class="d-flex align-center flex-wrap gap-1 mb-3">
              <VBtn
                size="small"
                variant="tonal"
                :disabled="destFolderPath === documentStore.ROOT_FOLDER_PATH || loadingDest"
                prepend-icon="ri-arrow-up-line"
                @click="goUpDest"
              >
                Up
              </VBtn>
              <template
                v-for="(crumb, index) in destBreadcrumbs"
                :key="crumb.path"
              >
                <VBtn
                  size="small"
                  :variant="index === destBreadcrumbs.length - 1 ? 'flat' : 'text'"
                  :color="index === destBreadcrumbs.length - 1 ? 'primary' : undefined"
                  @click="goToDestPath(crumb.path)"
                >
                  {{ crumb.label }}
                </VBtn>
                <span
                  v-if="index < destBreadcrumbs.length - 1"
                  class="text-medium-emphasis"
                >/</span>
              </template>
            </div>

            <div class="text-body-2 mb-2">
              Destination: <strong>{{ displayedDestPath }}</strong>
            </div>

            <VDataTable
              :headers="destHeaders"
              :items="destFolders"
              :loading="loadingDest"
              :items-per-page="25"
              class="text-no-wrap"
              hover
            >
              <template #item.fileName="{ item }">
                <VBtn
                  variant="text"
                  class="px-1 text-none"
                  prepend-icon="ri-folder-line"
                  @click="openDestFolder(item)"
                >
                  {{ item.fileName }}
                </VBtn>
              </template>

              <template #no-data>
                <div class="text-medium-emphasis pa-4">
                  No subfolders here. You can still move into this folder.
                </div>
              </template>
            </VDataTable>

            <VAlert
              v-if="moveError"
              type="error"
              density="compact"
              variant="tonal"
              class="mt-3"
            >
              {{ moveError }}
            </VAlert>

            <div class="d-flex gap-4 mt-4">
              <VBtn
                color="primary"
                :disabled="!canMove"
                :loading="moving"
                @click="moveFiles"
              >
                Move
              </VBtn>
              <VBtn
                variant="outlined"
                @click="cancel"
              >
                Cancel
              </VBtn>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>
  </VContainer>
</template>
