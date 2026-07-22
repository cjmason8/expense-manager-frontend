<script setup lang="ts">
import { format } from 'date-fns'
import DatePicker from 'primevue/datepicker'
import { computed, ref } from 'vue'
import { useDonationsStore } from '@/stores/donationsStore'
import { useRefDataStore } from '@/stores/refDataStore'
import type { Donation } from '@/types/donation'
import { RefData } from '@/types/refData'

let selectedDate = new Date()

const addEditDialog = ref(false)
const deleteDialog = ref(false)
const causes = ref<RefData[]>([])
const allDonations = ref<Donation[]>([])
const donationsStore = useDonationsStore()

const selectedCauseId = ref<number | null>(null)
const dateFrom = ref<Date | null>(null)
const dateTo = ref<Date | null>(null)
const appliedCauseId = ref<number | null>(null)
const appliedDateFrom = ref<Date | null>(null)
const appliedDateTo = ref<Date | null>(null)

donationsStore.getDonations().then(res => {
  allDonations.value = res ?? []
})

const refDataStore = useRefDataStore()

refDataStore.getRefData('cause').then(res => {
  causes.value = res ?? []
})

const causeOptions = computed(() => {
  const causesById = new Map<number, RefData>()

  for (const donation of allDonations.value) {
    if (donation.cause?.id != null && donation.cause.description)
      causesById.set(donation.cause.id, donation.cause)
  }

  return [...causesById.values()].sort((a, b) => a.description.localeCompare(b.description))
})

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function getDueDate(donation: Donation) {
  const parsed = parseDate(donation.dueDateString)

  return parsed ? startOfDay(parsed) : null
}

function matchesDueDateFilter(donation: Donation) {
  const dueDate = getDueDate(donation)
  const from = appliedDateFrom.value ? startOfDay(appliedDateFrom.value) : null
  const to = appliedDateTo.value ? startOfDay(appliedDateTo.value) : null

  if (!from && !to)
    return true

  if (!dueDate)
    return false

  if (from && !to)
    return dueDate >= from

  if (!from && to)
    return dueDate <= to

  const rangeStart = from! <= to! ? from! : to!
  const rangeEnd = from! <= to! ? to! : from!

  return dueDate >= rangeStart && dueDate <= rangeEnd
}

const displayedDonations = computed(() => {
  let filtered = allDonations.value

  if (appliedCauseId.value != null) {
    filtered = filtered.filter(
      donation => donation.cause?.id === appliedCauseId.value,
    )
  }

  if (appliedDateFrom.value || appliedDateTo.value)
    filtered = filtered.filter(matchesDueDateFilter)

  return filtered
})

function runFilter() {
  appliedCauseId.value = selectedCauseId.value
  appliedDateFrom.value = dateFrom.value
  appliedDateTo.value = dateTo.value
}

function clearFilters() {
  selectedCauseId.value = null
  dateFrom.value = null
  dateTo.value = null
  appliedCauseId.value = null
  appliedDateFrom.value = null
  appliedDateTo.value = null
}

async function refreshDonations() {
  allDonations.value = await donationsStore.getDonations()
}

const defaultItem = ref<Donation>({
  cause: new RefData(),
  dueDateString: '',
  description: '',
  notes: '',
  metaDataChunk: '',
  amount: -1,
})

const selectedItem = ref<Donation>(defaultItem.value)
const donationFormKey = ref(0)
const causeId = ref<number>()
const dialogTitle = ref<string>()
const editedIndex = ref(-1)

const headers = [
  { title: 'ID', key: 'id' },
  { title: 'CAUSE', key: 'cause.description' },
  { title: 'DESCRIPTION', key: 'description' },
  { title: 'DUE DATE', key: 'dueDateString' },
  { title: 'ACTIONS', key: 'actions' },
]

const addDonation = () => {
  selectedItem.value = { ...defaultItem.value }
  donationFormKey.value += 1
  addEditDialog.value = true
  dialogTitle.value = 'Add Donation'
}

const findDonationIndex = (id?: number) => {
  if (id == null)
    return -1

  return allDonations.value.findIndex(donation => donation.id === id)
}

const editItem = (item: Donation) => {
  editedIndex.value = findDonationIndex(item.id)
  selectedItem.value = { ...item }
  donationFormKey.value += 1
  selectedDate = parseDate(selectedItem.value.dueDateString)
  causeId.value = selectedItem.value.cause?.id
  addEditDialog.value = true
  dialogTitle.value = 'Edit Donation'
}

const deleteItem = (item: Donation) => {
  editedIndex.value = findDonationIndex(item.id)
  selectedItem.value = { ...item }
  deleteDialog.value = true
}

const closeAddEdit = () => {
  addEditDialog.value = false
  editedIndex.value = -1
  selectedItem.value = { ...defaultItem.value }
  selectedDate = new Date()
  causeId.value = -1
  donationFormKey.value += 1
}

const closeDelete = () => {
  deleteDialog.value = false
  editedIndex.value = -1
  selectedItem.value = { ...defaultItem.value }
}

const saveAddEdit = async () => {
  selectedItem.value.dueDateString = format(selectedDate, 'dd-MM-yyyy')
  selectedItem.value.cause = causes.value.find(
    refData => refData.id === causeId.value,
  )
  if (dialogTitle.value?.indexOf('Edit') !== -1) {
    await donationsStore.updateDonation(selectedItem.value)

    const idx = findDonationIndex(selectedItem.value.id)
    if (idx > -1)
      allDonations.value.splice(idx, 1, { ...selectedItem.value })
  }
  else {
    await donationsStore.addDonation(selectedItem.value)
    await refreshDonations()
  }

  closeAddEdit()
}

const deleteItemConfirm = () => {
  allDonations.value.splice(editedIndex.value, 1)
  donationsStore.deleteDonation(selectedItem.value)
  closeDelete()
}
</script>

<template>
  <VCard class="donations-card">
    <VCardText class="pb-0 donations-filters">
      <VRow
        class="align-center"
        dense
      >
        <VCol
          cols="12"
          md="4"
        >
          <VSelect
            v-model="selectedCauseId"
            :items="causeOptions"
            item-title="description"
            item-value="id"
            label="Cause"
            placeholder="All"
            clearable
            hide-details
            density="compact"
          />
        </VCol>
        <VCol
          cols="12"
          md="8"
          class="d-flex justify-end"
        >
          <VBtn
            color="primary"
            @click="addDonation"
          >
            Add Donation
          </VBtn>
        </VCol>
      </VRow>
      <VRow
        class="align-end donations-filters-date-row"
        dense
      >
        <VCol
          cols="12"
          md="3"
        >
          <label class="text-caption mb-0 d-inline-block">Due date from</label>
          <DatePicker
            v-model="dateFrom"
            class="w-100 donations-date-field"
            date-format="dd-mm-yy"
            show-icon
            placeholder="Due date from"
            size="small"
          />
        </VCol>
        <VCol
          cols="12"
          md="3"
        >
          <label class="text-caption mb-0 d-inline-block">Due date to</label>
          <DatePicker
            v-model="dateTo"
            class="w-100 donations-date-field"
            date-format="dd-mm-yy"
            show-icon
            placeholder="Due date to"
            size="small"
          />
        </VCol>
        <VCol
          cols="12"
          md="3"
          class="d-flex align-center gap-2"
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
        </VCol>
      </VRow>
    </VCardText>

    <VDataTable
      :headers="headers"
      :items="displayedDonations"
      :items-per-page="15"
      class="text-no-wrap donations-table"
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
                <DocumentDownloadBtn :document="item.documentDto" />
              </td>
              <td style="min-width: 35px">
                <IconBtn
                  size="small"
                  @click="editItem(item)"
                >
                  <VIcon icon="ri-pencil-line" />
                </IconBtn>
              </td>
              <td style="min-width: 35px">
                <IconBtn
                  size="small"
                  @click="deleteItem(item)"
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

  <!-- 👉 Add/Edit Dialog  -->
  <VDialog
    v-model="addEditDialog"
    max-width="1100px"
  >
    <VCard :title="dialogTitle">
      <VCardText>
        <VRow>
          <VCol
            cols="6"
            sm="3"
          >
            <label for="causeId">Cause</label>
          </VCol>
          <VCol
            cols="12"
            sm="6"
          >
            <VSelect
              v-model="causeId"
              :items="causes"
              item-title="description"
              item-value="id"
              placeholder="Select..."
            />
          </VCol>
        </VRow>
        <VRow>
          <VCol
            cols="6"
            sm="3"
          >
            <label for="selectedItem.description">Description</label>
          </VCol>
          <VCol
            cols="18"
            sm="9"
          >
            <VTextField v-model="selectedItem.description" />
          </VCol>
        </VRow>
        <VRow>
          <VCol
            cols="6"
            sm="3"
          >
            <label for="selectedItem.description">Notes</label>
          </VCol>
          <VCol
            cols="18"
            sm="9"
          >
            <VTextField v-model="selectedItem.notes" />
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
        <VRow>
          <VCol
            cols="6"
            sm="3"
          >
            <label for="selectedDate">Due Date</label>
          </VCol>
          <VCol
            cols="12"
            sm="6"
          >
            <DatePicker
              v-model="selectedDate"
              date-format="dd-mm-yy"
            />
          </VCol>
        </VRow>
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
              :key="`donation-file-${donationFormKey}`"
              v-model="selectedItem.documentDto"
              upload-type="donations"
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

  <!-- Delete Confirmation Dialog -->
  <VDialog
    v-model="deleteDialog"
    max-width="400px"
  >
    <VCard>
      <VCardTitle>Confirm Deletion</VCardTitle>
      <VCardText>
        Are you sure you want to delete
        <strong>{{ selectedItem.cause?.description }}</strong>?
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
.donations-filters {
  :deep(.donations-filters-date-row) {
    margin-top: -4px;
  }

  :deep(.donations-filters-date-row .v-col) {
    padding-top: 0;
  }

  :deep(.donations-date-field .p-inputtext) {
    font-size: 0.8125rem;
    padding-block: 0.35rem;
    padding-inline: 0.5rem;
  }

  :deep(.donations-date-field .p-datepicker-input-icon-container) {
    font-size: 0.875rem;
  }
}
</style>

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
