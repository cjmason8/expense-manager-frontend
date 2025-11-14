<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'
// eslint-disable-next-line no-restricted-imports
import { VCardTitle } from 'vuetify/components'
import { Document } from '@/types/document'
import { useDocumentStore } from '@/stores/documentStore'

const router = useRouter()
const route = useRoute()

const uploadDocument = ref(false)
const createDirectory = ref(false)

const defaultItem = ref<Document>({
  id: -1,
  fileName: '',
  originalFileName: '',
  isFolder: false,
  folderPath: '',
})

const selectedItem = ref<Document>(defaultItem.value)

let showArchive: boolean = false
let includeAll: boolean = false
let currentFolderPath: string = ''
const displayedFolderPath = ref('/')

const openFolder = (folderPath: string) => {
  if (folderPath.endsWith('IPs'))
    showArchive = true
  else
    showArchive = false

  documents.value = []
  documentStore.getDocuments(folderPath, false).then(res => {
    documents.value = res
    currentFolderPath = folderPath
    displayedFolderPath.value = getDirectoryPath()
  })
}

const documents = ref<Document[]>([])
let directory: Document = new Document()
let directoryAction: string = 'Create'

const documentStore = useDocumentStore()

if (route.query.existingFolder) {
  openFolder(currentFolderPath)
}
else {
  showArchive = true
  documentStore
    .getDocuments('/docs/expenseManager/filofax', false)
    .then(res => {
      documents.value = res
      currentFolderPath = '/docs/expenseManager/filofax'
    })
}

const headers = [
  { title: '', key: 'fileName' },
  { title: '', key: 'actions' },
]

const openParentFolder = () => {
  openFolder(
    currentFolderPath.substring(0, currentFolderPath.lastIndexOf('/')),
  )
}

const refreshList = (includeAllParam: boolean) => {
  includeAll = includeAllParam
  documentStore.getDocuments(currentFolderPath, includeAll).then(res => {
    documents.value = res
  })
}

const file = ref<File | null>(null)
const imageUrl = ref<string | null>(null)
const uploading = ref<boolean>(false)
const fileType = ''

// Handle file selection and preview
const handleFileChange = () => {
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
  if (!file.value)
    return

  uploading.value = true
  documentStore
    .uploadFile(file.value, 'documents', currentFolderPath)
    .then(res => {
      selectedItem.value = res
      selectedItem.value.originalFileName = selectedItem.value.fileName
    })
  uploading.value = false
}

// Watch for file changes to reset preview
watch(file, newFile => {
  if (!newFile)
    imageUrl.value = null
})

const viewDocumentation = (document: Document) => {
  documentStore.getFileById(document.id, document.fileName).then(res => {
    const fileURL = URL.createObjectURL(res)

    window.open(fileURL)
  })
}

const editDocument = (document: Document) => {
  if (document.isFolder) {
    directory.id = document.id
    directory.fileName = document.fileName
    directory.originalFileName = document.fileName
    directory.isFolder = document.isFolder
    directory.folderPath = document.folderPath
    directory.metaDataChunk = document.metaDataChunk
    directoryAction = 'Update'
  }
  else {
    document.id = document.id
    document.fileName = document.fileName
    document.originalFileName = document.fileName
    document.isFolder = document.isFolder
    document.folderPath = document.folderPath
    document.metaDataChunk = document.metaDataChunk
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
        directory = new Document()
        currentFolderPath = res.folderPath
      })
    })
  }
}

const archiveFolder = (document: Document) => {
  const msg
    = `Are you sure you want to archive the folder ${document.fileName}?`

  if (confirm(msg)) {
    documentStore.archiveFolder(document).then(res => {
      documentStore.getDocuments(currentFolderPath, false).then(res2 => {
        documents.value = res2
        directory = new Document()
      })
    })
  }
}

function getDirectoryPath(): string {
  return !currentFolderPath || currentFolderPath === '/docs/expenseManager/filofax'
    ? '/'
    : currentFolderPath.replace('/docs/expenseManager/filofax/', '/')
}

const move = () => {
  router.push('/documents/move')
}

const saveUploadDocument = () => {
  let result

  if (selectedItem.value.id)
    result = documentStore.updateDocument(selectedItem.value)
  else
    result = documentStore.addDocument(selectedItem.value)

  result.then(data => {
    documentStore.getDocuments(data.filePath, false).then(data2 => {
      documents.value = data2
    })
  })
}

const closeUploadDocument = () => {
  uploadDocument.value = false
  selectedItem.value = { ...defaultItem.value }
}
</script>

<template>
  <VContainer>
    <VRow
      class="align-center"
      dense
    >
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
            :items-per-page="10"
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
                      <IconBtn
                        v-if="!item.isFolder"
                        size="small"
                        @click="viewDocumentation(item)"
                      >
                        <VIcon icon="ri-download-line" />
                      </IconBtn>
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
  <VDialog v-model="uploadDocument">
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

                <VBtn
                  :disabled="!file"
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
</style>
