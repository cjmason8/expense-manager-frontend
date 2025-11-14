<script setup lang="ts">
import { format } from 'date-fns'
import DatePicker from 'primevue/datepicker'
import { VCardTitle } from 'vuetify/components'
import { useDocumentStore } from '@/stores/documentStore'
import { useRentalPaymentStore } from '@/stores/rentalpaymentsStore'
import type { RentalPayment } from '@/types/rentalPayment'

const defaultItem = ref<RentalPayment>({
  totalRent: -1,
  adminFee: -1,
  managementFee: -1,
  otherFee: -1,
  statementFromString: '',
  statementToString: '',
  property: '',
})

let statementFromDate: Date | null = null
let statementToDate: Date | null = null

const editDialog = ref(false)
const deleteDialog = ref(false)

const selectedItem = ref<RentalPayment>(defaultItem.value)

const editedIndex = ref(-1)
const documentStore = useDocumentStore()
const rentalPaymentsStore = useRentalPaymentStore()

rentalPaymentsStore.getRentalPayments()

console.log(rentalPaymentsStore.rentalPayments?.previousYear)

const editItem = (item: RentalPayment) => {
  if (item.property === 'WODONGA') {
    editedIndex.value
      = rentalPaymentsStore.rentalPayments?.wodongaRentalPayments.indexOf(item)
  }
  else {
    editedIndex.value
      = rentalPaymentsStore.rentalPayments?.sthKingsvilleRentalPayments.indexOf(
        item,
      )
  }

  selectedItem.value = { ...item }
  statementFromDate = parseDate(selectedItem.value.statementFromString)
  statementToDate = parseDate(selectedItem.value.statementToString)
  editDialog.value = true
}

const deleteItem = (item: RentalPayment) => {
  if (item.property === 'WODONGA') {
    editedIndex.value
      = rentalPaymentsStore.rentalPayments?.wodongaRentalPayments.indexOf(item)
  }
  else {
    editedIndex.value
      = rentalPaymentsStore.rentalPayments?.sthKingsvilleRentalPayments.indexOf(
        item,
      )
  }

  selectedItem.value = { ...item }
  deleteDialog.value = true
}

const closeEdit = () => {
  editDialog.value = false
  editedIndex.value = -1
  selectedItem.value = { ...defaultItem.value }
}

const closeDelete = () => {
  deleteDialog.value = false
  editedIndex.value = -1
  selectedItem.value = { ...defaultItem.value }
}

const saveEdit = () => {
  if (statementFromDate != null) {
    selectedItem.value.statementFromString = format(
      statementFromDate,
      'dd-MM-yyyy',
    )
  }
  if (statementToDate != null)
    selectedItem.value.statementToString = format(statementToDate, 'dd-MM-yyyy')

  if (editedIndex.value > -1) {
    if (selectedItem.value.property === 'WODONGA') {
      Object.assign(
        rentalPaymentsStore.rentalPayments?.wodongaRentalPayments[
          editedIndex.value
        ],
        selectedItem.value,
      )
    }
    else {
      Object.assign(
        rentalPaymentsStore.rentalPayments?.sthKingsvilleRentalPayments[
          editedIndex.value
        ],
        selectedItem.value,
      )
    }

    rentalPaymentsStore.updateRentalPayment(selectedItem.value)
  }

  closeEdit()
}

const deleteItemConfirm = () => {
  if (selectedItem.value.property === 'WODONGA') {
    rentalPaymentsStore.rentalPayments?.wodongaRentalPayments.splice(
      editedIndex.value,
      1,
    )
  }
  else {
    rentalPaymentsStore.rentalPayments?.sthKingsvilleRentalPayments.splice(
      editedIndex.value,
      1,
    )
  }

  rentalPaymentsStore.deleteRentalPayment(selectedItem.value)
  closeDelete()
}

const headers = [
  { title: 'MANAGEMENT FEE', key: 'managementFee' },
  { title: 'ADMIN FEE', key: 'adminFee' },
  { title: 'OTHER', key: 'otherFee' },
  { title: 'STATEMENT FROM', key: 'statementFromString' },
  { title: 'STATEMENT TO', key: 'statementToString' },
  { title: 'TOTAL RENT', key: 'totalRent' },
  { title: 'ACTIONS', key: 'actions' },
]

const file = ref<File | null>(null)
const imageUrl = ref<string | null>(null)
const uploading = ref<boolean>(false)

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
  documentStore.uploadFile(file.value).then(res => {
    selectedItem.value.documentDto = res
  })
  uploading.value = false
}

// Watch for file changes to reset preview
watch(file, newFile => {
  if (!newFile)
    imageUrl.value = null
})

const prevYear = () => {
  rentalPaymentsStore.getRentalPayments(
    rentalPaymentsStore.rentalPayments?.previousYear,
  )
}

const nextYear = () => {
  rentalPaymentsStore.getRentalPayments(
    rentalPaymentsStore.rentalPayments?.nextYear,
  )
}
</script>

<template>
  <table
    style="border-spacing: 30px"
    max-width="700px"
  >
    <tr>
      <td style="float: right">
        <table>
          <tr>
            <td width="50px">
              <IconBtn
                size="small"
                @click="prevYear"
              >
                <VIcon icon="ri-arrow-left-double-line" />
              </IconBtn>
            </td>
            <td
              width="50px"
              @click="prevYear"
            >
              Prev
            </td>
            <td
              width="50px"
              @click="nextYear"
            >
              Next
            </td>
            <td width="50px">
              <IconBtn
                size="small"
                @click="nextYear"
              >
                <VIcon icon="ri-arrow-right-double-line" />
              </IconBtn>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr />
    <tr>
      <td valign="top">
        <VCard
          v-if="
            rentalPaymentsStore.rentalPayments?.wodongaRentalPayments.length > 0
          "
        >
          <VCardTitle>Wodonga</VCardTitle>
          <VDataTable
            :headers="headers"
            :items="rentalPaymentsStore.rentalPayments?.wodongaRentalPayments"
            :items-per-page="20"
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
      </td>
      <td valign="top">
        <VCard
          v-if="
            rentalPaymentsStore.rentalPayments?.sthKingsvilleRentalPayments
              .length > 0
          "
        >
          <VCardTitle>South Kingsville</VCardTitle>
          <VDataTable
            :headers="headers"
            :items="
              rentalPaymentsStore.rentalPayments?.sthKingsvilleRentalPayments
            "
            :items-per-page="20"
            class="text-no-wrap"
          >
            <!-- Actions -->
            <template #item.actions="{ item }">
              <div class="d-flex gap-1">
                <table>
                  <tr>
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
      </td>
    </tr>
  </table>

  <!-- 👉 Edit Dialog  -->
  <VDialog
    v-model="editDialog"
    max-width="1000px"
  >
    <VCard title="Edit Rental Payment">
      <VCardText>
        <VRow>
          <VCol
            cols="6"
            sm="3"
          >
            <label for="selectedItem.property">Property</label>
          </VCol>
          <VCol
            cols="18"
            sm="9"
          >
            <VTextField v-model="selectedItem.property" />
          </VCol>
        </VRow>
        <VRow>
          <VCol
            cols="6"
            sm="3"
          >
            <label for="selectedItem.totalRent">Total Rent</label>
          </VCol>
          <VCol
            cols="18"
            sm="9"
          >
            <VTextField v-model="selectedItem.totalRent" />
          </VCol>
        </VRow>
        <VRow>
          <VCol
            cols="6"
            sm="3"
          >
            <label for="selectedItem.managementFee">Management Fee</label>
          </VCol>
          <VCol
            cols="18"
            sm="9"
          >
            <VTextField v-model="selectedItem.managementFee" />
          </VCol>
          <VCol
            cols="6"
            sm="3"
          >
            <label for="selectedItem.adminFee">Admin Fee</label>
          </VCol>
          <VCol
            cols="18"
            sm="9"
          >
            <VTextField v-model="selectedItem.adminFee" />
          </VCol>
        </VRow>
        <VRow>
          <VCol
            cols="6"
            sm="3"
          >
            <label for="selectedItem.other">Other</label>
          </VCol>
          <VCol
            cols="18"
            sm="9"
          >
            <VTextField v-model="selectedItem.otherFee" />
          </VCol>
        </VRow>
        <VRow>
          <VCol
            cols="6"
            sm="3"
          >
            <label for="statementFromDate">Statement From</label>
          </VCol>
          <VCol
            cols="12"
            sm="6"
          >
            <DatePicker
              v-model="statementFromDate"
              date-format="dd-mm-yy"
            />
          </VCol>
        </VRow>
        <VRow>
          <VCol
            cols="6"
            sm="3"
          >
            <label for="statementToDate">Statement To</label>
          </VCol>
          <VCol
            cols="6"
            sm="6"
          >
            <DatePicker
              v-model="statementToDate"
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
      </VCardText>

      <VCardText>
        <div class="self-align-end d-flex gap-4 justify-end">
          <VBtn
            color="error"
            variant="outlined"
            @click="closeEdit"
          >
            Cancel
          </VBtn>
          <VBtn
            color="success"
            variant="elevated"
            @click="saveEdit"
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
        <strong>{{ selectedItem.property }}'s payment starting
          {{ selectedItem.statementFromString }}</strong>?
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
i {
  font-size: 24px; /* Adjust size */
  color: #1976d2; /* Vue green */
}
</style>
