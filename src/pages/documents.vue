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
let directoryAction: string = 'Create'

const showArchive = ref(false)
const currentFolderPath = ref('')
const displayedFolderPath = ref('/')

const documentStore = useDocumentStore()
const documents = ref<Document[]>([])

const file = ref<File | null>(null)
const imageUrl = ref<string | null>(null)
const uploading = ref<boolean>(false)
const uploadStatusMessage = ref('')
const uploadStatusError = ref(false)

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
    selectedFolderItem.value.folderPath = currentFolderPath.value
    selectedFolderItem.value.isFolder = true
    documentStore.createDirectory(selectedFolderItem.value).then(res => {
      documentStore.getDocuments(res.folderPath, false).then(res2 => {
        documents.value = res2
        selectedFolderItem.value = { ...defaultFolderItem.value }
        currentFolderPath.value = res.folderPath
        displayedFolderPath.value = getDirectoryPath()
      })
    })
  }
  else {
    selectedFolderItem.value.folderPath = currentFolderPath.value
    documentStore.updateDirectory(selectedFolderItem.value).then(res => {
      documentStore.getDocuments(res.folderPath, false).then(res2 => {
        documents.value = res2
        selectedFolderItem.value = { ...defaultFolderItem.value }
        currentFolderPath.value = res.folderPath
        directoryAction = 'Create'
        displayedFolderPath.value = getDirectoryPath()
      })
    })
  }
  closeAddEditFolder()
}

const openFolder = (folderPath: string) => {
  console.log(folderPath)
  if (folderPath.endsWith('IPs') || folderPath === '/docs/expenseManager/filofax')
    showArchive.value = true
  else
    showArchive.value = false

  documents.value = []
  documentStore.getDocuments(folderPath, archiveButtonDescription.value === 'Hide Archived').then(res => {
    documents.value = res
    currentFolderPath.value = folderPath
    displayedFolderPath.value = getDirectoryPath()
  })
}

const openParentFolder = () => {
  openFolder(
    currentFolderPath.value.substring(0, currentFolderPath.value.lastIndexOf('/')),
  )
}

const toggleArchived = () => {
  let includeArchived = false
  if (archiveButtonDescription.value === 'Show Archived') {
    includeArchived = true
    archiveButtonDescription.value = 'Hide Archived'
  }
  else {
    archiveButtonDescription.value = 'Show Archived'
  }

  documentStore.getDocuments(currentFolderPath.value, includeArchived).then(res => {
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
  selectedItem.value = { ...defaultItem.value, folderPath: currentFolderPath.value }
  resetUploadState()
  uploadDocument.value = true
}

// Handle file selection and preview
const handleFileChange = () => {
  uploadStatusMessage.value = ''
  uploadStatusError.value = false
  if (!file.value) {
    imageUrl.value = null

    return
  }

  if (file.value && file.value.type.startsWith('image/')) {
    const reader = new FileReader()

    reader.onload = (e: ProgressEvent<FileReader>) => {
      imageUrl.value = e.target?.result as string
    }
    reader.readAsDataURL(file.value)
  }
  else {
    imageUrl.value = null
  }
}

// Upload file to API
const uploadFile = async () => {
  if (!file.value || uploading.value)
    return

  uploading.value = true
  uploadStatusMessage.value = ''
  uploadStatusError.value = false
  try {
    const res = await documentStore.uploadFile(
      file.value,
      'documents',
      currentFolderPath.value,
    )

    if (res) {
      selectedItem.value = {
        ...selectedItem.value,
        ...res,
        folderPath: currentFolderPath.value,
        originalFileName: res.originalFileName || res.fileName,
      }
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

// Watch for file changes to reset preview
watch(file, newFile => {
  if (!newFile)
    imageUrl.value = null
})

watch(uploadDocument, isOpen => {
  if (!isOpen) {
    selectedItem.value = { ...defaultItem.value }
    resetUploadState()
  }
})


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
    resetUploadState()
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
        currentFolderPath.value = res.folderPath
      })
    })
  }
}

const archiveFolder = (document: Document) => {
  const msg
    = `Are you sure you want to archive the folder ${document.fileName}?`

  if (confirm(msg)) {
    documentStore.archiveFolder(document).then(res => {
      documentStore.getDocuments(currentFolderPath.value, false).then(res2 => {
        documents.value = res2

        // directory = new Document()
      })
    })
  }
}

function getDirectoryPath(): string {
  return !currentFolderPath.value || currentFolderPath.value === '/docs/expenseManager/filofax'
    ? '/'
    : currentFolderPath.value.replace('/docs/expenseManager/filofax/', '/')
}

const move = () => {
  router.push('/documents/move')
}

const saveUploadDocument = async () => {
  selectedItem.value.folderPath = currentFolderPath.value

  const isExistingDocument = selectedItem.value.id > 0

  const result = isExistingDocument
    ? await documentStore.updateDocument(selectedItem.value)
    : await documentStore.addDocument(selectedItem.value)

  if (!result)
    return

  const folderPath = result.folderPath || currentFolderPath.value
  const refreshedDocuments = await documentStore.getDocuments(folderPath, archiveButtonDescription.value === 'Hide Archived')
  if (refreshedDocuments)
    documents.value = refreshedDocuments

  closeUploadDocument()
}

function resetUploadState() {
  file.value = null
  imageUrl.value = null
  uploading.value = false
  uploadStatusMessage.value = ''
  uploadStatusError.value = false
}

function closeUploadDocument() {
  uploadDocument.value = false
  selectedItem.value = { ...defaultItem.value }
  resetUploadState()
}

onMounted(() => {
  if (route.query.existingFolder) {
    openFolder(currentFolderPath.value)
  }
  else {
    showArchive.value = true
    documentStore
      .getDocuments('/docs/expenseManager/filofax', archiveButtonDescription.value === 'Hide Archived')
      .then(res => {
        documents.value = res
        currentFolderPath.value = '/docs/expenseManager/filofax'
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
          v-if="currentFolderPath !== '/docs/expenseManager/filofax'"
          color="primary"
          @click="openFolder('/docs/expenseManager/filofax')"
        >
          Home
        </VBtn>
      </VCol>
      <VCol
        cols="8"
        sm="auto"
      >
        <VBtn
          v-if="currentFolderPath !== '/docs/expenseManager/filofax'"
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
          v-if="showArchive"
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
    max-width="900px"
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
            sm="6"
          >
            <VCard style="width: 650px">
              <VCardTitle>Upload File</VCardTitle>
              <VCardText>
                <VFileInput
                  v-model="file"
                  style="width: 600px"
                  label="Choose a file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg"
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
                  :disabled="!file || uploading"
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
            <VTextarea
              v-model="selectedItem.metaDataChunk"
              rows="2"
            />
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
    max-width="900px"
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
            <VTextarea
              v-model="selectedFolderItem.metaDataChunk"
              rows="2"
            />
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
