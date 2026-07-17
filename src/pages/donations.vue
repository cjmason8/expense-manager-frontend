<script setup lang="ts">
import { format } from 'date-fns'
import DatePicker from 'primevue/datepicker'
import { ref } from 'vue'
import { VCardActions, VCardText } from 'vuetify/components'
import { useDonationsStore } from '@/stores/donationsStore'
import { useRefDataStore } from '@/stores/refDataStore'
import type { Donation } from '@/types/donation'
import { RefData } from '@/types/refData'

let selectedDate = new Date()

const addEditDialog = ref(false)
const deleteDialog = ref(false)
const causes = ref<RefData[]>([])
const donations = ref<Donation[]>([])
const donationsStore = useDonationsStore()

donationsStore.getDonations().then(res => {
  donations.value = res
})

const refDataStore = useRefDataStore()

refDataStore.getRefData('cause').then(res => {
  causes.value = res
})

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
const filterCauseId = ref<number | null>()
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

const filter = () => {
  donations.value = donations.value.filter(
    donation => donation.cause?.id === filterCauseId.value,
  )
}

const clear = () => {
  donationsStore.getDonations().then(res => {
    donations.value = res
  })
  filterCauseId.value = null
}

const findDonationIndex = (id?: number) => {
  if (id == null)
    return -1

  return donations.value.findIndex(donation => donation.id === id)
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
      donations.value.splice(idx, 1, { ...selectedItem.value })
  }
  else {
    await donationsStore.addDonation(selectedItem.value)
    donations.value = await donationsStore.getDonations()
  }

  closeAddEdit()
}

const deleteItemConfirm = () => {
  donations.value.splice(editedIndex.value, 1)
  donationsStore.deleteDonation(selectedItem.value)
  closeDelete()
}

</script>

<template>
  <VCard
    title="Filter"
    max-width="700px"
  >
    <VCardText>
      <VRow>
        <VCol
          cols="6"
          sm="3"
        >
          <label for="filterCauseId">Cause</label>
        </VCol>
        <VCol
          cols="12"
          sm="6"
        >
          <VSelect
            v-model="filterCauseId"
            :items="causes"
            item-title="description"
            item-value="id"
            placeholder="Select..."
          />
        </VCol>
      </VRow>
      <VRow>
        <VSpacer />
        <VBtn
          color="primary"
          style="margin-right: 10px"
          @click="filter"
        >
          Filter
        </VBtn>
        <VBtn
          color="primary"
          @click="clear"
        >
          Clear
        </VBtn>
      </VRow>
    </VCardText>
  </VCard>
  <VCardTitle>
    <VSpacer />
    <VBtn
      color="primary"
      @click="addDonation"
    >
      Add Donation
    </VBtn>
  </VCardTitle>
  <VDataTable
    :headers="headers"
    :items="donations"
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
