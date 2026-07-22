<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'
// eslint-disable-next-line no-restricted-imports
import { VCardText, VCardTitle } from 'vuetify/components'
import { Document } from '@/types/document'
import { useDocumentStore } from '@/stores/documentStore'

const router = useRouter()
const route = useRoute()

const uploadDocument = ref(false)
const createDirectory = ref(false)
const archiveButtonDescription = ref('Show Archived')
const folderDialogTitle = ref('Add Folder')

const defaultItem = ref<Document>({
  id: '',
  fileName: '',
  originalFileName: '',
  isFolder: false,
  folderPath: '',
})

const defaultFolderItem = ref<Document>({
  id: '',
  fileName: '',
  originalFileName: '',
  isFolder: false,
  folderPath: '',
})

const selectedItem = ref<Document>({ ...defaultItem.value })
const selectedFolderItem = ref<Document>({ ...defaultFolderItem.value })
const documentUploadKey = ref(0)
let directoryAction: string = 'Create'

const documentStore = useDocumentStore()
const ROOT_FOLDER_PATH = documentStore.ROOT_FOLDER_PATH
const displayedFolderPath = ref('/')
const documents = ref<Document[]>([])

const headers = [
  { title: '', key: 'fileName' },
  { title: '', key: 'actions' },
]

const closeAddEditFolder = () => {
  createDirectory.value = false
  directoryAction = 'Create'
  selectedFolderItem.value = { ...defaultFolderItem.value }
}

const actionDirectory = () => {
  if (directoryAction === 'Create') {
    selectedFolderItem.value.folderPath = documentStore.currentFolderPath
    selectedFolderItem.value.isFolder = true
    documentStore.createDirectory(selectedFolderItem.value).then(res => {
      documentStore.getDocuments(res.folderPath, false).then(res2 => {
        documents.value = res2
        selectedFolderItem.value = { ...defaultFolderItem.value }
        documentStore.currentFolderPath = res.folderPath
        displayedFolderPath.value = getDirectoryPath()
      })
    })
  }
  else {
    selectedFolderItem.value.folderPath = documentStore.currentFolderPath
    documentStore.updateDirectory(selectedFolderItem.value).then(res => {
      documentStore.getDocuments(res.folderPath, false).then(res2 => {
        documents.value = res2
        selectedFolderItem.value = { ...defaultFolderItem.value }
        documentStore.currentFolderPath = res.folderPath
        directoryAction = 'Create'
        displayedFolderPath.value = getDirectoryPath()
      })
    })
  }
  closeAddEditFolder()
}

const openFolder = (folderPath: string) => {
  documents.value = []
  documentStore.getDocuments(folderPath, archiveButtonDescription.value === 'Hide Archived').then(res => {
    documents.value = res
    documentStore.currentFolderPath = folderPath
    displayedFolderPath.value = getDirectoryPath()
  })
}

const openParentFolder = () => {
  const path = documentStore.currentFolderPath

  openFolder(path.substring(0, path.lastIndexOf('/')))
}

const isArchiveToggleLocation = (folderPath: string) => {
  return folderPath === ROOT_FOLDER_PATH || folderPath.endsWith('IPs')
}

const toggleArchived = () => {
  const wasShowingArchived = archiveButtonDescription.value === 'Hide Archived'

  if (wasShowingArchived) {
    archiveButtonDescription.value = 'Show Archived'

    if (!isArchiveToggleLocation(documentStore.currentFolderPath)) {
      openFolder(ROOT_FOLDER_PATH)

      return
    }
  }
  else {
    archiveButtonDescription.value = 'Hide Archived'
  }

  documentStore.getDocuments(
    documentStore.currentFolderPath,
    archiveButtonDescription.value === 'Hide Archived',
  ).then(res => {
    documents.value = res
    displayedFolderPath.value = getDirectoryPath()
  })
}

const addFolder = () => {
  directoryAction = 'Create'
  selectedFolderItem.value = { ...defaultFolderItem.value }
  createDirectory.value = true
  folderDialogTitle.value = 'Add Folder'
}

const openUploadFile = () => {
  selectedItem.value = { ...defaultItem.value, folderPath: documentStore.currentFolderPath }
  documentUploadKey.value += 1
  uploadDocument.value = true
}

const editDocument = (document: Document) => {
  if (document.isFolder) {
    selectedFolderItem.value = document
    directoryAction = 'Update'

    createDirectory.value = true
    folderDialogTitle.value = 'Edit Folder'
  }
  else {
    selectedItem.value.id = document.id
    selectedItem.value.fileName = document.fileName
    selectedItem.value.originalFileName = document.fileName
    selectedItem.value.isFolder = document.isFolder
    selectedItem.value.folderPath = document.folderPath
    selectedItem.value.metaDataChunk = document.metaDataChunk
    documentUploadKey.value += 1
    uploadDocument.value = true
  }
}

const deleteDocument = (document: Document) => {
  let msg = 'Are you sure you want to delete'
  if (document.isFolder) {
    msg
      += ` the folder ${
        document.fileName
      }? This will also delete any files or subfolders with in this folder.`
  }
  else {
    msg += ` the file ${document.fileName}?`
  }
  if (confirm(msg)) {
    documentStore.deleteDocument(document).then(res => {
      documentStore.getDocuments(res.folderPath, false).then(res2 => {
        documents.value = res2
        selectedItem.value = new Document()
        documentStore.currentFolderPath = res.folderPath
      })
    })
  }
}

function getDirectoryPath(): string {
  const path = documentStore.currentFolderPath

  return !path || path === ROOT_FOLDER_PATH
    ? '/'
    : path.replace(`${ROOT_FOLDER_PATH}/`, '/')
}

const move = () => {
  router.push('/documents-move')
}

const saveUploadDocument = async () => {
  selectedItem.value.folderPath = documentStore.currentFolderPath

  const isExistingDocument = selectedItem.value.id > 0

  const result = isExistingDocument
    ? await documentStore.updateDocument(selectedItem.value)
    : await documentStore.addDocument(selectedItem.value)

  if (!result)
    return

  const folderPath = result.folderPath || documentStore.currentFolderPath
  const refreshedDocuments = await documentStore.getDocuments(folderPath, archiveButtonDescription.value === 'Hide Archived')
  if (refreshedDocuments)
    documents.value = refreshedDocuments

  closeUploadDocument()
}

function closeUploadDocument() {
  uploadDocument.value = false
  selectedItem.value = { ...defaultItem.value }
}

watch(uploadDocument, isOpen => {
  if (!isOpen) {
    selectedItem.value = { ...defaultItem.value }
    documentUploadKey.value += 1
  }
})

onMounted(() => {
  if (route.query.existingFolder) {
    openFolder(documentStore.currentFolderPath)
  }
  else {
    documentStore
      .getDocuments(ROOT_FOLDER_PATH, archiveButtonDescription.value === 'Hide Archived')
      .then(res => {
        documents.value = res
        documentStore.currentFolderPath = ROOT_FOLDER_PATH
        displayedFolderPath.value = getDirectoryPath()
      })
  }
})
</script>

<template>
  <VContainer>
    <VRow class="align-center">
      <!-- Card takes the space -->
      <VCol
        cols="8"
        sm="auto"
      >
        <VCard>
          <VCardTitle>
            {{ displayedFolderPath }}
          </VCardTitle>
        </VCard>
      </VCol>

      <!-- Button keeps natural width -->
      <VCol
        cols="8"
        sm="auto"
      >
        <VBtn
          v-if="documentStore.currentFolderPath !== ROOT_FOLDER_PATH"
          color="primary"
          @click="openFolder(ROOT_FOLDER_PATH)"
        >
          Home
        </VBtn>
      </VCol>
      <VCol
        cols="8"
        sm="auto"
      >
        <VBtn
          v-if="documentStore.currentFolderPath !== ROOT_FOLDER_PATH"
          color="primary"
          @click="openParentFolder"
        >
          Back
        </VBtn>
      </VCol>
      <VCol
        cols="8"
        sm="auto"
      >
        <VBtn
          color="primary"
          @click="toggleArchived"
        >
          {{ archiveButtonDescription }}
        </VBtn>
      </VCol>
      <VCol
        cols="8"
        sm="auto"
      >
        <VBtn
          color="primary"
          @click="addFolder"
        >
          Add Folder
        </VBtn>
      </VCol>
      <VCol
        cols="8"
        sm="auto"
      >
        <VBtn
          color="primary"
          @click="openUploadFile"
        >
          Upload File
        </VBtn>
      </VCol>
      <VCol
        cols="8"
        sm="auto"
      >
        <VBtn
          color="primary"
          @click="move"
        >
          Move
        </VBtn>
      </VCol>
    </VRow>
    <VRow>
      <VCol
        aria-colspan="3"
        cols="24"
      >
        <VCard>
          <VCardTitle>Documents</VCardTitle>
          <VDataTable
            :headers="headers"
            :items="documents"
            :items-per-page="15"
            class="text-no-wrap"
          >
            <template #item.id="{ item }">
              <span class="text-h6">{{ item.id }}</span>
            </template>

            <!-- Actions -->
            <template #item.actions="{ item }">
              <div class="d-flex gap-1">
                <table>
                  <tr>
                    <td style="min-width: 35px">
                      <DocumentDownloadBtn
                        v-if="!item.isFolder"
                        :document="item"
                      />
                      <IconBtn
                        v-if="item.isFolder"
                        size="small"
                        @click="openFolder(`${item.folderPath}/${item.fileName}`)"
                      >
                        <VIcon icon="ri-folder-line" />
                      </IconBtn>
                    </td>
                    <td style="min-width: 35px">
                      <IconBtn
                        size="small"
                        @click="editDocument(item)"
                      >
                        <VIcon icon="ri-pencil-line" />
                      </IconBtn>
                    </td>
                    <td style="min-width: 35px">
                      <IconBtn
                        size="small"
                        @click="deleteDocument(item)"
                      >
                        <VIcon icon="ri-delete-bin-line" />
                      </IconBtn>
                    </td>
                  </tr>
                </table>
              </div>
            </template>
          </VDataTable>
        </VCard>
      </VCol>
    </VRow>
  </VContainer>

  <!-- 👉 Add/Edit Dialog  -->
  <VDialog
    v-model="uploadDocument"
    max-width="1100px"
  >
    <VCard title="Upload Document">
      <VCardText>
        <VRow>
          <VCol
            cols="6"
            sm="3"
          >
            <label for="file">File</label>
          </VCol>
          <VCol
            cols="18"
            sm="9"
          >
            <FileUploadEditor
              :key="documentUploadKey"
              v-model="selectedItem"
              upload-type="documents"
              :upload-path="documentStore.currentFolderPath"
            />
          </VCol>
        </VRow>
        <VRow>
          <VCol
            cols="6"
            sm="3"
          >
            <label for="selectedItem.fileName">File name</label>
          </VCol>
          <VCol
            cols="18"
            sm="9"
          >
            <VTextField v-model="selectedItem.fileName" />
          </VCol>
        </VRow>
        <VRow>
          <VCol
            cols="6"
            sm="3"
          >
            <label for="selectedItem.metaDataChunk">Metadata</label>
          </VCol>
          <VCol
            cols="18"
            sm="9"
          >
            <MetadataEditor v-model="selectedItem.metaDataChunk" />
          </VCol>
        </VRow>
      </VCardText>

      <VCardText>
        <div class="self-align-end d-flex gap-4 justify-end">
          <VBtn
            color="error"
            variant="outlined"
            @click="closeUploadDocument"
          >
            Cancel
          </VBtn>
          <VBtn
            color="success"
            variant="elevated"
            @click="saveUploadDocument"
          >
            Save
          </VBtn>
        </div>
      </VCardText>
    </VCard>
  </VDialog>

  <!-- 👉 Add/Edit Folder Dialog  -->
  <VDialog
    v-model="createDirectory"
    max-width="1100px"
  >
    <VCard :title="folderDialogTitle">
      <VCardText>
        <VRow>
          <VCol
            cols="6"
            sm="3"
          >
            <label for="selectedFolderItem.fileName">Name</label>
          </VCol>
          <VCol
            cols="18"
            sm="9"
          >
            <VTextField v-model="selectedFolderItem.fileName" />
          </VCol>
        </VRow>
        <VRow>
          <VCol
            cols="6"
            sm="3"
          >
            <label for="selectedFolderItem.metaDataChunk">Metadata</label>
          </VCol>
          <VCol
            cols="18"
            sm="9"
          >
            <MetadataEditor v-model="selectedFolderItem.metaDataChunk" />
          </VCol>
        </VRow>
      </VCardText>

      <VCardText>
        <div class="self-align-end d-flex gap-4 justify-end">
          <VBtn
            color="error"
            variant="outlined"
            @click="closeAddEditFolder"
          >
            Cancel
          </VBtn>
          <VBtn
            color="success"
            variant="elevated"
            @click="actionDirectory"
          >
            Save
          </VBtn>
        </div>
      </VCardText>
    </VCard>
  </VDialog>
</template>

<style>
.p-datepicker {
  z-index: 1050 !important; /* Adjust the value as necessary */
}

.v-dialog {
  z-index: 1000 !important; /* Adjust the value if necessary */
}

.file-v-card {
  width: 300px;
}

.v-checkbox {
  white-space: normal !important;
  overflow-wrap: break-word;
  flex: 1 1 auto; /* allow the label to grow */
}
</style>
