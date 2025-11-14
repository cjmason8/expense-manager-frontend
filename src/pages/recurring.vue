<script setup lang="ts">
import { format } from 'date-fns'
import DatePicker from 'primevue/datepicker'
import { VCardTitle, VCheckbox } from 'vuetify/components'
import { useDocumentStore } from '@/stores/documentStore'
import { useExpensesStore } from '@/stores/expensesStore'
import { useRefDataStore } from '@/stores/refDataStore'
import type { Expense } from '@/types/expense'
import type { Income } from '@/types/income'
import type { RefData } from '@/types/refData'

const expenseStore = useExpensesStore()

const includeAll = ref(false)

expenseStore.getRecurring(false)

const documentStore = useDocumentStore()

const headers = [
  { title: 'NAME', key: 'transactionType.description' },
  { title: 'AMOUNT', key: 'amount' },
  { title: 'NOTES', key: 'notes' },
  { title: 'RECURRING TYPE', key: 'recurringType.description' },
  { title: 'START DATE', key: 'startDateString' },
  { title: 'END DATE', key: 'endDateString' },
  { title: 'ACTIONS', key: 'actions' },
]

const incomeHeaders = [
  { title: 'NAME', key: 'transactionType.description' },
  { title: 'AMOUNT', key: 'amount' },
  { title: 'RECURRING TYPE', key: 'recurringType.description' },
  { title: 'START DATE', key: 'startDateString' },
  { title: 'END DATE', key: 'endDateString' },
  { title: 'ACTIONS', key: 'actions' },
]

const editDialog = ref(false)
const deleteDialog = ref(false)

const defaultExpenseItem = ref<Expense>({
  dueDateString: '',
  startDateString: '',
  endDateString: '',
  notes: '',
  paid: false,
})

const defaultIncomeItem = ref<Income>({
  dueDateString: '',
  notes: '',
})

const recurringTypes = ref<RefData[]>([])
const expenseTypes = ref<RefData[]>([])
const incomeTypes = ref<RefData[]>([])

const refDataStore = useRefDataStore()

refDataStore.getRefData('expenseType').then(res => {
  expenseTypes.value = res
})
refDataStore.getRefData('incomeType').then(res => {
  incomeTypes.value = res
})
refDataStore.getRefData('recurringType').then(res => {
  recurringTypes.value = res
})

const selectedExpenseItem = ref<Expense>(defaultExpenseItem.value)
const selectedIncomeItem = ref<Income>(defaultIncomeItem.value)
const editedExpenseIndex = ref(-1)
const editedIncomeIndex = ref(-1)
let startDate: Date | null = null
let endDate: Date | null = null
const transactionTypeId = ref<number>()
const recurringTypeId = ref<number>()

const recurring = ref(false)

const includeAllFilter = () => {
  expenseStore.getRecurring(includeAll.value)
  console.log(includeAll)
}

const closeEdit = () => {
  editDialog.value = false
  editedExpenseIndex.value = -1
  selectedExpenseItem.value = { ...defaultExpenseItem.value }
  startDate = null
  endDate = null
  recurring.value = false
}

const closeDelete = () => {
  deleteDialog.value = false
  editedExpenseIndex.value = -1
  selectedExpenseItem.value = { ...defaultExpenseItem.value }
}

const editExpensesItem = (item: Expense) => {
  if (expenseStore.homeInfo)
    editedExpenseIndex.value = expenseStore.homeInfo.expenses.indexOf(item) as number

  selectedExpenseItem.value = { ...item }
  transactionTypeId.value = selectedExpenseItem.value.transactionType?.id
  recurringTypeId.value = selectedExpenseItem.value.recurringType?.id
  startDate = parseDate(selectedExpenseItem.value.startDateString)
  recurring.value = startDate != null
  endDate = parseDate(selectedExpenseItem.value.endDateString)
  editDialog.value = true
}

const deleteExpensesItem = (item: Expense) => {
  if (expenseStore.homeInfo)
    editedExpenseIndex.value = expenseStore.homeInfo?.expenses.indexOf(item) as number

  selectedExpenseItem.value = { ...item }
  deleteDialog.value = true
}

const deleteIncomesItem = (item: Income) => {
  if (expenseStore.homeInfo)
    editedIncomeIndex.value = expenseStore.homeInfo?.incomes.indexOf(item) as number

  selectedIncomeItem.value = { ...item }
  deleteDialog.value = true
}

const saveEdit = () => {
  if (startDate != null)
    selectedExpenseItem.value.dueDateString = format(startDate, 'dd-MM-yyyy')

  if (endDate != null)
    selectedExpenseItem.value.dueDateString = format(endDate, 'dd-MM-yyyy')

  selectedExpenseItem.value.transactionType = expenseTypes.value.find(
    refData => refData.id === transactionTypeId.value,
  )
  if (editedExpenseIndex.value > -1 && expenseStore.homeInfo) {
    console.log(selectedExpenseItem.value.amount)
    Object.assign(expenseStore.homeInfo.expenses[editedExpenseIndex.value], selectedExpenseItem.value)
    expenseStore.updateExpense(selectedExpenseItem.value)
  }

  closeEdit()
}

const deleteExpensesItemConfirm = () => {
  expenseStore.homeInfo?.expenses.splice(editedExpenseIndex.value, 1)
  expenseStore.deleteExpense(selectedExpenseItem.value)
  closeDelete()
}

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
    selectedExpenseItem.value.documentDto = res
  })
  uploading.value = false
}

// Watch for file changes to reset preview
watch(file, newFile => {
  if (!newFile)
    imageUrl.value = null
})
</script>

<template>
  <table
    style="border-spacing: 10px"
    max-width="500px"
  >
    <tr>
      <td />
      <td style="float: right">
        <table>
          <tr>
            <td width="50px">
              Include All
            </td>
            <td width="50px">
              <VCheckbox
                v-model="includeAll"
                @change="includeAllFilter"
              />
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td valign="top">
        <VCard max-width="750px">
          <VCardTitle>Incomes</VCardTitle>
          <VDataTable
            :headers="incomeHeaders"
            :items="expenseStore.homeInfo?.incomes"
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
                        @click="editIncomesItem(item)"
                      >
                        <VIcon icon="ri-pencil-line" />
                      </IconBtn>
                    </td>
                    <td style="min-width: 35px">
                      <IconBtn
                        size="small"
                        @click="deleteIncomesItem(item)"
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
      <td>
        <VCard max-width="800px">
          <VCardTitle>Expenses</VCardTitle>
          <VDataTable
            :headers="headers"
            :items="expenseStore.homeInfo?.expenses"
            :items-per-page="10"
            class="text-no-wrap"
            density="compact"
          >
            <template #item.paid="{ item }">
              <VCheckbox
                v-model="item.paid"
                dense
                hide-details
              />
            </template>

            <!-- Actions -->
            <template #item.actions="{ item }">
              <div class="d-flex gap-1">
                <table>
                  <tr>
                    <td style="min-width: 35px">
                      <IconBtn
                        size="small"
                        @click="editExpensesItem(item)"
                      >
                        <VIcon icon="ri-pencil-line" />
                      </IconBtn>
                    </td>
                    <td style="min-width: 35px">
                      <IconBtn
                        size="small"
                        @click="deleteExpensesItem(item)"
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
    max-width="700px"
  >
    <VCard title="Edit Recurring Expense">
      <VCardText>
        <VRow>
          <VCol
            cols="6"
            sm="3"
          >
            <label for="transactionTypeId">Expense Type</label>
          </VCol>
          <VCol
            cols="12"
            sm="6"
          >
            <VSelect
              v-model="transactionTypeId"
              :items="expenseTypes"
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
            <label for="selectedExpenseItem.amount">Amount</label>
          </VCol>
          <VCol
            cols="18"
            sm="9"
          >
            <VTextField v-model="selectedExpenseItem.amount" />
          </VCol>
        </VRow>
        <VRow>
          <VCol
            cols="6"
            sm="3"
          >
            <label for="recurring">Recurring</label>
          </VCol>
          <VCol
            cols="18"
            sm="9"
          >
            <VCheckbox v-model="recurring" />
          </VCol>
        </VRow>
        <VRow v-if="recurring">
          <VCol
            cols="6"
            sm="3"
          >
            <label for="recurringTypeId">Recurring Type</label>
          </VCol>
          <VCol
            cols="12"
            sm="6"
          >
            <VSelect
              v-model="recurringTypeId"
              :items="recurringTypes"
              item-title="description"
              item-value="id"
              placeholder="Select..."
            />
          </VCol>
        </VRow>
        <VRow v-if="startDate != null">
          <VCol
            cols="6"
            sm="3"
          >
            <label for="selectedDate">Start Date</label>
          </VCol>
          <VCol
            cols="12"
            sm="6"
          >
            <DatePicker
              v-model="startDate"
              date-format="dd-mm-yy"
            />
          </VCol>
        </VRow>
        <VRow v-if="recurring">
          <VCol
            cols="6"
            sm="3"
          >
            <label for="selectedDate">End Date</label>
          </VCol>
          <VCol
            cols="12"
            sm="6"
          >
            <DatePicker
              v-model="endDate"
              date-format="dd-mm-yy"
            />
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
            <VTextField v-model="selectedExpenseItem.notes" />
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
              v-model="selectedExpenseItem.metaDataChunk"
              rows="2"
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
        <strong>{{ selectedExpenseItem.transactionType?.description }}</strong>?
      </VCardText>
      <VCardActions>
        <VBtn
          color="blue darken-1"
          @click="closeDelete"
        >
          Cancel
        </VBtn>
        <VBtn
          color="red darken-1"
          @click="deleteExpensesItemConfirm"
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
