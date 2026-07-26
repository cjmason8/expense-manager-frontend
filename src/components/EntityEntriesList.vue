<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useEntityEntriesStore } from '@/stores/entityEntriesStore'
import type { EntityEntry, EntityType } from '@/types/entityEntry'
import { Document } from '@/types/document'
import { resolveExternalUrl } from '@/utils/renderMarkdown'

const props = defineProps<{
  entityType: EntityType
  entityLabel: string
  uploadType: string
  showLinkField?: boolean
}>()

const entityEntriesStore = useEntityEntriesStore()

const allEntries = ref<EntityEntry[]>([])
const loading = ref(false)
const addEditDialog = ref(false)
const deleteDialog = ref(false)
const dialogTitle = ref('')
const editedIndex = ref(-1)
const formKey = ref(0)

const searchFilter = ref('')
const appliedSearchFilter = ref('')

const entityLabelPlural = computed(() => `${props.entityLabel}s`)

const defaultItem = (): EntityEntry => ({
  name: '',
  description: '',
  type: props.entityType,
  link: props.showLinkField ? '' : undefined,
  documentDto: new Document(),
  metaDataChunk: '',
})

function entryLink(item: EntityEntry) {
  return props.showLinkField ? resolveExternalUrl(item.link) : null
}

const selectedItem = ref<EntityEntry>(defaultItem())

async function loadEntries() {
  loading.value = true
  try {
    allEntries.value = await entityEntriesStore.getEntityEntries(props.entityType)
  }
  finally {
    loading.value = false
  }
}

onMounted(() => {
  loadEntries()
})

const displayedEntries = computed(() => {
  const query = appliedSearchFilter.value.trim().toLowerCase()

  if (!query)
    return allEntries.value

  return allEntries.value.filter(entry =>
    entry.name?.toLowerCase().includes(query)
    || entry.description?.toLowerCase().includes(query)
    || entry.link?.toLowerCase().includes(query),
  )
})

function runFilter() {
  appliedSearchFilter.value = searchFilter.value
}

function clearFilters() {
  searchFilter.value = ''
  appliedSearchFilter.value = ''
}

const headers = [
  { title: 'ID', key: 'id', width: '80px' },
  { title: 'NAME', key: 'name', minWidth: '180px' },
  { title: 'DESCRIPTION', key: 'description', minWidth: '320px' },
  { title: 'ACTIONS', key: 'actions', width: '150px', sortable: false },
]

function findEntryIndex(id?: number) {
  if (id == null)
    return -1

  return allEntries.value.findIndex(entry => entry.id === id)
}

function addEntry() {
  selectedItem.value = defaultItem()
  formKey.value += 1
  addEditDialog.value = true
  dialogTitle.value = `Add ${props.entityLabel}`
}

function editItem(item: EntityEntry) {
  editedIndex.value = findEntryIndex(item.id)
  selectedItem.value = {
    ...item,
    documentDto: item.documentDto ? { ...item.documentDto } : new Document(),
  }
  formKey.value += 1
  addEditDialog.value = true
  dialogTitle.value = `Edit ${props.entityLabel}`
}

function deleteItem(item: EntityEntry) {
  editedIndex.value = findEntryIndex(item.id)
  selectedItem.value = { ...item }
  deleteDialog.value = true
}

function closeAddEdit() {
  addEditDialog.value = false
  editedIndex.value = -1
  selectedItem.value = defaultItem()
  formKey.value += 1
}

function closeDelete() {
  deleteDialog.value = false
  editedIndex.value = -1
  selectedItem.value = defaultItem()
}

async function saveAddEdit() {
  const payload: EntityEntry = {
    ...selectedItem.value,
    type: props.entityType,
  }

  if (dialogTitle.value.includes('Edit')) {
    const updated = await entityEntriesStore.updateEntityEntry(payload)
    const idx = findEntryIndex(updated.id)

    if (idx > -1)
      allEntries.value.splice(idx, 1, updated)
  }
  else {
    const created = await entityEntriesStore.addEntityEntry(payload)

    allEntries.value.push(created)
  }

  closeAddEdit()
}

async function deleteItemConfirm() {
  if (selectedItem.value.id == null)
    return

  await entityEntriesStore.deleteEntityEntry(selectedItem.value.id)
  allEntries.value.splice(editedIndex.value, 1)
  closeDelete()
}
</script>

<template>
  <VCard class="entity-entries-card">
    <VCardText class="pb-0 entity-entries-filters">
      <VRow
        class="align-center"
        dense
      >
        <VCol
          cols="12"
          md="6"
        >
          <VTextField
            v-model="searchFilter"
            label="Search"
            placeholder="Filter by name or description..."
            clearable
            hide-details
            density="compact"
            @keyup.enter="runFilter"
          />
        </VCol>
        <VCol
          cols="12"
          md="6"
          class="d-flex align-center gap-2 justify-end"
        >
          <VBtn
            color="primary"
            @click="runFilter"
          >
            Filter
          </VBtn>
          <VBtn
            variant="outlined"
            @click="clearFilters"
          >
            Clear
          </VBtn>
          <VBtn
            color="primary"
            @click="addEntry"
          >
            Add {{ entityLabel }}
          </VBtn>
        </VCol>
      </VRow>
    </VCardText>

    <VDataTable
      :headers="headers"
      :items="displayedEntries"
      :items-per-page="15"
      :loading="loading"
      :loading-text="`Loading ${entityLabelPlural.toLowerCase()}...`"
      class="text-no-wrap entity-entries-table"
    >
      <template #item.id="{ item }">
        <span class="text-h6">{{ item.id }}</span>
      </template>

      <template #item.name="{ item }">
        <a
          v-if="entryLink(item)"
          :href="entryLink(item)!"
          target="_blank"
          rel="noopener noreferrer"
          class="entity-entry-name-link"
        >
          {{ item.name }}
        </a>
        <span v-else>{{ item.name }}</span>
      </template>

      <template #item.description="{ item }">
        <MarkdownContent
          :content="item.description"
          class="entity-entries-description-cell"
        />
      </template>

      <template #item.actions="{ item }">
        <div class="d-flex gap-1">
          <DocumentDownloadBtn :document="item.documentDto" />
          <IconBtn
            size="small"
            @click="editItem(item)"
          >
            <VIcon icon="ri-pencil-line" />
          </IconBtn>
          <IconBtn
            size="small"
            @click="deleteItem(item)"
          >
            <VIcon icon="ri-delete-bin-line" />
          </IconBtn>
        </div>
      </template>
    </VDataTable>
  </VCard>

  <VDialog
    v-model="addEditDialog"
    max-width="1100px"
  >
    <VCard :title="dialogTitle">
      <VCardText>
        <VRow>
          <VCol
            cols="12"
            md="3"
          >
            <label :for="`${uploadType}-name`">Name</label>
          </VCol>
          <VCol
            cols="12"
            md="9"
          >
            <VTextField
              :id="`${uploadType}-name`"
              v-model="selectedItem.name"
            />
          </VCol>
        </VRow>
        <VRow>
          <VCol
            cols="12"
            md="3"
          >
            <label :for="`${uploadType}-description`">Description</label>
          </VCol>
          <VCol
            cols="12"
            md="9"
          >
            <MarkdownEditor v-model="selectedItem.description" />
          </VCol>
        </VRow>
        <VRow v-if="showLinkField">
          <VCol
            cols="12"
            md="3"
          >
            <label :for="`${uploadType}-link`">Link</label>
          </VCol>
          <VCol
            cols="12"
            md="9"
          >
            <VTextField
              :id="`${uploadType}-link`"
              v-model="selectedItem.link"
              placeholder="https://..."
              hide-details
            />
          </VCol>
        </VRow>
        <VRow>
          <VCol
            cols="12"
            md="3"
          >
            <label :for="`${uploadType}-metadata`">Metadata</label>
          </VCol>
          <VCol
            cols="12"
            md="9"
          >
            <MetadataEditor v-model="selectedItem.metaDataChunk" />
          </VCol>
        </VRow>
        <VRow>
          <VCol
            cols="12"
            md="3"
          >
            <label :for="`${uploadType}-file`">File</label>
          </VCol>
          <VCol
            cols="12"
            md="9"
          >
            <FileUploadEditor
              :key="`${uploadType}-file-${formKey}`"
              v-model="selectedItem.documentDto"
              :upload-type="uploadType"
            />
          </VCol>
        </VRow>
      </VCardText>

      <VCardText>
        <div class="self-align-end d-flex gap-4 justify-end">
          <VBtn
            color="error"
            variant="outlined"
            @click="closeAddEdit"
          >
            Cancel
          </VBtn>
          <VBtn
            color="success"
            variant="elevated"
            @click="saveAddEdit"
          >
            Save
          </VBtn>
        </div>
      </VCardText>
    </VCard>
  </VDialog>

  <VDialog
    v-model="deleteDialog"
    max-width="400px"
  >
    <VCard>
      <VCardTitle>Confirm Deletion</VCardTitle>
      <VCardText>
        Are you sure you want to delete
        <strong>{{ selectedItem.name }}</strong>?
      </VCardText>
      <VCardActions>
        <VBtn
          color="blue darken-1"
          @click="deleteDialog = false"
        >
          Cancel
        </VBtn>
        <VBtn
          color="red darken-1"
          @click="deleteItemConfirm"
        >
          Delete
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<style scoped lang="scss">
.entity-entries-table {
  inline-size: 100%;
}

.entity-entries-description-cell {
  display: inline-block;
  max-inline-size: 100%;
  overflow-wrap: anywhere;
  white-space: normal;
}

.entity-entry-name-link {
  color: rgb(var(--v-theme-primary));
  font-weight: 500;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}
</style>
