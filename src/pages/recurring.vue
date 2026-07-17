<script setup lang="ts">
import { format } from 'date-fns'
import DatePicker from 'primevue/datepicker'
import { VCardTitle, VCheckbox } from 'vuetify/components'
import { useExpensesStore } from '@/stores/expensesStore'
import { useIncomesStore } from '@/stores/incomesStore'
import { useRefDataStore } from '@/stores/refDataStore'
import type { Expense } from '@/types/expense'
import type { Income } from '@/types/income'
import type { RefData } from '@/types/refData'

const expenseStore = useExpensesStore()
const incomeStore = useIncomesStore()

const includeAll = ref(false)

expenseStore.getRecurring(false)

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
const editIncomeDialog = ref(false)
const deleteDialog = ref(false)
const deleteIncomeDialog = ref(false)

const defaultExpenseItem = ref<Expense>({
  dueDateString: '',
  startDateString: '',
  endDateString: '',
  notes: '',
  paid: false,
})

const defaultIncomeItem = ref<Income>({
  dueDateString: '',
  startDateString: '',
  endDateString: '',
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
const expenseFormKey = ref(0)
const incomeFormKey = ref(0)
const editedExpenseIndex = ref(-1)
const editedIncomeIndex = ref(-1)
let startDate: Date | null = null
let endDate: Date | null = null
let dueDate: Date | null = null
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
  expenseFormKey.value += 1
}

const closeEditIncome = () => {
  editIncomeDialog.value = false
  editedIncomeIndex.value = -1
  selectedIncomeItem.value = { ...defaultIncomeItem.value }
  dueDate = null
  startDate = null
  endDate = null
  recurring.value = false
  incomeFormKey.value += 1
}

const closeDelete = () => {
  deleteDialog.value = false
  editedExpenseIndex.value = -1
  selectedExpenseItem.value = { ...defaultExpenseItem.value }
}

const closeDeleteIncome = () => {
  deleteIncomeDialog.value = false
  editedIncomeIndex.value = -1
  selectedIncomeItem.value = { ...defaultIncomeItem.value }
}

const findExpenseIndex = (list: Expense[] | undefined, id?: number) => {
  if (!list || id == null)
    return -1

  return list.findIndex(expense => expense.id === id)
}

const findIncomeIndex = (list: Income[] | undefined, id?: number) => {
  if (!list || id == null)
    return -1

  return list.findIndex(income => income.id === id)
}

const editExpensesItem = (item: Expense) => {
  if (expenseStore.homeInfo)
    editedExpenseIndex.value = findExpenseIndex(expenseStore.homeInfo.expenses, item.id)

  selectedExpenseItem.value = { ...item }
  expenseFormKey.value += 1
  transactionTypeId.value = selectedExpenseItem.value.transactionType?.id
  recurringTypeId.value = selectedExpenseItem.value.recurringType?.id
  startDate = parseDate(selectedExpenseItem.value.startDateString)
  recurring.value = startDate != null
  endDate = parseDate(selectedExpenseItem.value.endDateString)
  editDialog.value = true
}

const deleteExpensesItem = (item: Expense) => {
  if (expenseStore.homeInfo)
    editedExpenseIndex.value = findExpenseIndex(expenseStore.homeInfo.expenses, item.id)

  selectedExpenseItem.value = { ...item }
  deleteDialog.value = true
}

const editIncomesItem = (item: Income) => {
  if (expenseStore.homeInfo)
    editedIncomeIndex.value = findIncomeIndex(expenseStore.homeInfo.incomes, item.id)

  selectedIncomeItem.value = { ...item }
  incomeFormKey.value += 1
  transactionTypeId.value = selectedIncomeItem.value.transactionType?.id
  recurringTypeId.value = selectedIncomeItem.value.recurringType?.id
  startDate = parseDate(selectedIncomeItem.value.startDateString)
  endDate = parseDate(selectedIncomeItem.value.endDateString)
  recurring.value = true
  editIncomeDialog.value = true
}

const deleteIncomesItem = (item: Income) => {
  if (expenseStore.homeInfo)
    editedIncomeIndex.value = findIncomeIndex(expenseStore.homeInfo.incomes, item.id)

  selectedIncomeItem.value = { ...item }
  deleteIncomeDialog.value = true
}

const saveEditIncome = async () => {
  if (startDate != null)
    selectedIncomeItem.value.startDateString = format(startDate, 'dd-MM-yyyy')

  if (endDate != null)
    selectedIncomeItem.value.endDateString = format(endDate, 'dd-MM-yyyy')

  selectedIncomeItem.value.transactionType = incomeTypes.value.find(
    refData => refData.id === transactionTypeId.value,
  )
  if (recurringTypeId.value != null) {
    selectedIncomeItem.value.recurringType = recurringTypes.value.find(
      refData => refData.id === recurringTypeId.value,
    )
  }

  await incomeStore.updateIncome(selectedIncomeItem.value)

  const idx = findIncomeIndex(expenseStore.homeInfo?.incomes, selectedIncomeItem.value.id)
  if (idx > -1 && expenseStore.homeInfo)
    expenseStore.homeInfo.incomes.splice(idx, 1, { ...selectedIncomeItem.value })

  await expenseStore.getRecurring(includeAll.value)
  closeEditIncome()
}

const deleteIncomesItemConfirm = async () => {
  const idx = findIncomeIndex(expenseStore.homeInfo?.incomes, selectedIncomeItem.value.id)
  if (idx > -1)
    expenseStore.homeInfo?.incomes.splice(idx, 1)

  await incomeStore.deleteIncome(selectedIncomeItem.value)
  await expenseStore.getRecurring(includeAll.value)
  closeDeleteIncome()
}

const saveEdit = async () => {
  if (startDate != null)
    selectedExpenseItem.value.startDateString = format(startDate, 'dd-MM-yyyy')

  if (endDate != null)
    selectedExpenseItem.value.endDateString = format(endDate, 'dd-MM-yyyy')

  selectedExpenseItem.value.transactionType = expenseTypes.value.find(
    refData => refData.id === transactionTypeId.value,
  )
  if (editedExpenseIndex.value > -1 && expenseStore.homeInfo) {
    Object.assign(expenseStore.homeInfo.expenses[editedExpenseIndex.value], selectedExpenseItem.value)
    await expenseStore.updateExpense(selectedExpenseItem.value)
  }

  closeEdit()
}

const deleteExpensesItemConfirm = () => {
  expenseStore.homeInfo?.expenses.splice(editedExpenseIndex.value, 1)
  expenseStore.deleteExpense(selectedExpenseItem.value)
  closeDelete()
}

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
            :items-per-page="15"
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
    max-width="1100px"
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
            <MetadataEditor v-model="selectedExpenseItem.metaDataChunk" />
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
              :key="`expense-file-${expenseFormKey}`"
              v-model="selectedExpenseItem.documentDto"
              upload-type="expenses"
            />
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

  <!-- 👉 Edit Income Dialog  -->
  <VDialog
    v-model="editIncomeDialog"
    max-width="1100px"
  >
    <VCard title="Edit Recurring Income">
      <VCardText>
        <VRow>
          <VCol
            cols="6"
            sm="3"
          >
            <label for="transactionTypeId">Income Type</label>
          </VCol>
          <VCol
            cols="12"
            sm="6"
          >
            <VSelect
              v-model="transactionTypeId"
              :items="incomeTypes"
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
            <label for="selectedIncomeItem.amount">Amount</label>
          </VCol>
          <VCol
            cols="18"
            sm="9"
          >
            <VTextField v-model="selectedIncomeItem.amount" />
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
        <VRow v-if="recurring">
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
            <label for="selectedIncomeItem.notes">Notes</label>
          </VCol>
          <VCol
            cols="18"
            sm="9"
          >
            <VTextField v-model="selectedIncomeItem.notes" />
          </VCol>
        </VRow>
        <VRow>
          <VCol
            cols="6"
            sm="3"
          >
            <label for="selectedIncomeItem.metaDataChunk">Metadata</label>
          </VCol>
          <VCol
            cols="18"
            sm="9"
          >
            <MetadataEditor v-model="selectedIncomeItem.metaDataChunk" />
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
              :key="`income-file-${incomeFormKey}`"
              v-model="selectedIncomeItem.documentDto"
              upload-type="incomes"
            />
          </VCol>
        </VRow>
      </VCardText>

      <VCardText>
        <div class="self-align-end d-flex gap-4 justify-end">
          <VBtn
            color="error"
            variant="outlined"
            @click="closeEditIncome"
          >
            Cancel
          </VBtn>
          <VBtn
            color="success"
            variant="elevated"
            @click="saveEditIncome"
          >
            Save
          </VBtn>
        </div>
      </VCardText>
    </VCard>
  </VDialog>

  <!-- Delete Expense Confirmation Dialog -->
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

  <!-- Delete Income Confirmation Dialog -->
  <VDialog
    v-model="deleteIncomeDialog"
    max-width="400px"
  >
    <VCard>
      <VCardTitle>Confirm Deletion</VCardTitle>
      <VCardText>
        Are you sure you want to delete
        <strong>{{ selectedIncomeItem.transactionType?.description }}</strong>?
      </VCardText>
      <VCardActions>
        <VBtn
          color="blue darken-1"
          @click="closeDeleteIncome"
        >
          Cancel
        </VBtn>
        <VBtn
          color="red darken-1"
          @click="deleteIncomesItemConfirm"
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
