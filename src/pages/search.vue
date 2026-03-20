<script setup lang="ts">
import type { ChartData } from 'chart.js'
import { format } from 'date-fns'
import DatePicker from 'primevue/datepicker'
import { useTheme } from 'vuetify'
import BarChart from '@core/libs/chartjs/components/BarChart'
import { getLatestBarChartConfig } from '@core/libs/chartjs/chartjsConfig'
import { hexToRgb } from '@core/utils/colorConverter'
import { useDocumentStore } from '@/stores/documentStore'
import { useExpensesStore } from '@/stores/expensesStore'
import { useRefDataStore } from '@/stores/refDataStore'
import { Document } from '@/types/document'
import { Expense } from '@/types/expense'
import type { RefData } from '@/types/refData'

definePage({
  meta: {
    // Expand main content past boxed max-width (uses right margin) on this page only
    layoutWrapperClasses: 'search-layout-full-width',
  },
})

interface SearchParams {
  transactionType: RefData | null
  keyWords: string
  startDateString: string
  endDateString: string
  metaDataChunk: string
}

const refDataStore = useRefDataStore()
const expenseStore = useExpensesStore()
const documentStore = useDocumentStore()
const vuetifyTheme = useTheme()

function extractGraphPayloadFromSearchResult(result: Record<string, unknown>): unknown {
  const directKeys = [
    'expenseGraphDto',
    'expense_graph_dto',
    'expenseGraphDTO',
    'expenseGraph',
    'chartData',
    'chart',
    'graph',
    'graphDto',
    'graph_dto',
  ] as const

  for (const key of directKeys) {
    const v = result[key]
    if (v != null && typeof v === 'object')
      return v
  }

  return null
}

function unwrapGraphPayload(dto: unknown): unknown {
  if (dto == null || typeof dto !== 'object')
    return dto

  const o = dto as Record<string, unknown>
  if (o.chartData && typeof o.chartData === 'object')
    return o.chartData

  if (o.data && typeof o.data === 'object') {
    const inner = o.data as Record<string, unknown>
    if (Array.isArray(inner.labels) || Array.isArray(inner.datasets))
      return o.data
  }

  return dto
}

function normalizeChartLabels(labels: unknown): string[] {
  if (Array.isArray(labels))
    return labels.map(l => String(l))

  if (typeof labels === 'string')
    return labels.split(',').map(s => s.trim()).filter(Boolean)

  return []
}

function normalizeChartDataArray(data: unknown): number[] {
  if (Array.isArray(data))
    return data.map(v => (typeof v === 'number' ? v : Number(v) || 0))

  if (data && typeof data === 'object')
    return Object.values(data as Record<string, unknown>).map(v => Number(v) || 0)

  return []
}

function pickBackgroundColor(
  raw: unknown,
  fallback: string,
): string | string[] {
  if (typeof raw === 'string')
    return raw

  if (Array.isArray(raw) && raw.length && raw.every(x => typeof x === 'string'))
    return raw as string[]

  return fallback
}

function toBarChartData(dto: unknown, defaultDatasetColor: string): ChartData<'bar'> | null {
  const node = unwrapGraphPayload(dto)
  if (node == null || typeof node !== 'object')
    return null

  const p = node as Record<string, unknown>
  const labels = normalizeChartLabels(p.labels)

  if (Array.isArray(p.datasets)) {
    const datasets = (p.datasets as unknown[])
      .map((ds, i) => {
        if (ds == null || typeof ds !== 'object')
          return null

        const d = ds as Record<string, unknown>
        const data = normalizeChartDataArray(d.data)

        return {
          label: String(d.label ?? `Series ${i + 1}`),
          data,
          backgroundColor: pickBackgroundColor(d.backgroundColor, defaultDatasetColor),
        }
      })
      .filter((x): x is NonNullable<typeof x> => x != null)

    if (!datasets.length)
      return null

    const maxLen = Math.max(0, ...datasets.map(ds => ds.data.length))
    if (!maxLen)
      return null

    const finalLabels = Array.from({ length: maxLen }, (_, i) => {
      const fromApi = labels[i]
      if (fromApi != null && String(fromApi) !== '')
        return String(fromApi)

      return String(i + 1)
    })

    return {
      labels: finalLabels,
      datasets,
    }
  }

  if (labels.length && p.data !== undefined) {
    const data = normalizeChartDataArray(p.data)

    return {
      labels,
      datasets: [
        {
          label: String(p.label ?? 'Amount'),
          data,
          backgroundColor: defaultDatasetColor,
        },
      ],
    }
  }

  return null
}

/** Fallback when API omits graph DTO: aggregate search results by expense type. */
function expensesToBarChartData(
  list: Expense[],
  defaultDatasetColor: string,
): ChartData<'bar'> | null {
  if (!list.length)
    return null

  const byType = new Map<string, number>()

  for (const e of list) {
    const label = e.transactionType?.description?.trim() || 'Other'
    const amt = typeof e.amount === 'number' ? e.amount : Number(e.amount) || 0

    byType.set(label, (byType.get(label) ?? 0) + amt)
  }

  const labels = [...byType.keys()]
  const data = labels.map(l => byType.get(l) ?? 0)

  if (!labels.length)
    return null

  return {
    labels,
    datasets: [
      {
        label: 'Amount (by type)',
        data,
        backgroundColor: defaultDatasetColor,
      },
    ],
  }
}

const expenseTypes = ref<RefData[]>([])
const expenses = ref<Expense[]>([])
const documents = ref<Document[]>([])

const loading = ref(false)
const startDate = ref<Date | null>(null)
const endDate = ref<Date | null>(null)
const searchExpenseTypeId = ref<number | null>(null)
const addEditDialog = ref(false)
const deleteDialog = ref(false)
const editedIndex = ref(-1)
const selectedItem = ref<Expense>(new Expense())
const dueDate = ref<Date | null>(null)
const selectedExpenseTypeId = ref<number | null>(null)
const addEditDocumentDialog = ref(false)
const deleteDocumentDialog = ref(false)
const selectedDocument = ref<Document>(new Document())
const documentEditedIndex = ref(-1)
const documentDialogTitle = ref('Edit Document')
const expenseGraphDto = ref<unknown>(null)

/** Bumps when search results change so vue-chartjs remounts with new data. */
const chartUpdateKey = ref(0)

const searchParams = ref<SearchParams>({
  transactionType: null,
  keyWords: '',
  startDateString: '',
  endDateString: '',
  metaDataChunk: '',
})

const expenseHeaders = [
  { title: 'NAME', key: 'transactionType.description' },
  { title: 'AMOUNT', key: 'amount' },
  { title: 'DUE DATE', key: 'dueDateString' },
  { title: 'PAID', key: 'paid' },
  { title: 'NOTES', key: 'notes' },
  { title: 'ACTIONS', key: 'actions' },
]

const documentHeaders = [
  { title: 'NAME', key: 'fileName' },
  { title: 'ACTIONS', key: 'actions' },
]

const primaryBarColor = computed(() => {
  const hex = String(vuetifyTheme.current.value.colors.primary ?? '#1976d2')
  const rgb = hexToRgb(hex)

  return rgb ? `rgba(${rgb}, 0.75)` : 'rgba(25, 118, 210, 0.75)'
})

const chartData = computed(() => {
  const fromApi = toBarChartData(expenseGraphDto.value, primaryBarColor.value)
  if (fromApi)
    return fromApi

  return expensesToBarChartData(expenses.value, primaryBarColor.value)
})

const barChartOptions = computed(() => {
  // getLatestBarChartConfig expects the full theme object ({ colors, variables }), not colors alone
  const base = getLatestBarChartConfig(vuetifyTheme.current.value)
  const yScale = { ...base.scales.y } as Record<string, unknown>

  delete yScale.max

  return {
    ...base,
    scales: {
      ...base.scales,
      y: yScale,
    },
  }
})

const expenseTypeFilter = (itemTitle: string, queryText: string) => {
  const normalizedItemTitle = itemTitle.toLowerCase()
  const normalizedQuery = queryText.toLowerCase()

  return normalizedItemTitle.includes(normalizedQuery)
}

const canSearch = computed(() => {
  return Boolean(
    searchExpenseTypeId.value
    || searchParams.value.keyWords.trim()
    || searchParams.value.metaDataChunk.trim()
    || startDate.value
    || endDate.value,
  )
})

const applyDateStrings = () => {
  searchParams.value.startDateString = startDate.value
    ? format(startDate.value, 'dd-MM-yyyy')
    : ''
  searchParams.value.endDateString = endDate.value
    ? format(endDate.value, 'dd-MM-yyyy')
    : ''
}

const runSearch = async () => {
  applyDateStrings()
  searchParams.value.transactionType = searchExpenseTypeId.value
    ? expenseTypes.value.find(refData => refData.id === searchExpenseTypeId.value) ?? null
    : null

  if (!canSearch.value)
    return

  loading.value = true
  try {
    const result = await expenseStore.searchExpenses(searchParams.value)
    const raw = result as Record<string, unknown>

    expenses.value = result.expenses ?? []
    documents.value = result.documents ?? []
    expenseGraphDto.value
      = extractGraphPayloadFromSearchResult(raw)
      ?? result.expenseGraphDto
      ?? null
    chartUpdateKey.value += 1
  }
  finally {
    loading.value = false
  }
}

const editExpense = (item: Expense) => {
  editedIndex.value = expenses.value.indexOf(item)
  selectedItem.value = { ...item }
  selectedExpenseTypeId.value = item.transactionType?.id
  dueDate.value = parseDate(item.dueDateString)
  addEditDialog.value = true
}

const closeEditExpense = () => {
  addEditDialog.value = false
  editedIndex.value = -1
  selectedItem.value = new Expense()
  dueDate.value = null
  selectedExpenseTypeId.value = null
}

const saveEditExpense = async () => {
  if (selectedExpenseTypeId.value) {
    selectedItem.value.transactionType = expenseTypes.value.find(
      refData => refData.id === selectedExpenseTypeId.value,
    )
  }
  if (dueDate.value)
    selectedItem.value.dueDateString = format(dueDate.value, 'dd-MM-yyyy')

  await expenseStore.updateExpense(selectedItem.value)
  if (editedIndex.value > -1)
    expenses.value[editedIndex.value] = { ...selectedItem.value }

  closeEditExpense()
}

const promptDeleteExpense = (item: Expense) => {
  editedIndex.value = expenses.value.indexOf(item)
  selectedItem.value = { ...item }
  deleteDialog.value = true
}

const closeDeleteExpense = () => {
  deleteDialog.value = false
  editedIndex.value = -1
  selectedItem.value = new Expense()
}

const deleteExpense = async () => {
  await expenseStore.deleteExpense(selectedItem.value)
  if (editedIndex.value > -1)
    expenses.value.splice(editedIndex.value, 1)

  closeDeleteExpense()
}

const clearSearch = () => {
  searchParams.value = {
    transactionType: null,
    keyWords: '',
    startDateString: '',
    endDateString: '',
    metaDataChunk: '',
  }
  searchExpenseTypeId.value = null
  startDate.value = null
  endDate.value = null
  expenses.value = []
  documents.value = []
  expenseGraphDto.value = null
  chartUpdateKey.value += 1
}

const viewDocumentation = (document: Document) => {
  documentStore.getFileById(document.id, document.fileName).then(res => {
    const fileURL = URL.createObjectURL(res)

    window.open(fileURL)
  })
}

const editDocument = (item: Document) => {
  documentEditedIndex.value = documents.value.indexOf(item)
  selectedDocument.value = { ...item }
  documentDialogTitle.value = item.isFolder ? 'Edit Folder' : 'Edit Document'
  addEditDocumentDialog.value = true
}

const closeEditDocument = () => {
  addEditDocumentDialog.value = false
  selectedDocument.value = new Document()
  documentEditedIndex.value = -1
}

const saveEditDocument = async () => {
  if (selectedDocument.value.isFolder)
    await documentStore.updateDirectory(selectedDocument.value)
  else
    await documentStore.updateDocument(selectedDocument.value)

  if (documentEditedIndex.value > -1)
    documents.value[documentEditedIndex.value] = { ...selectedDocument.value }

  closeEditDocument()
}

const promptDeleteDocument = (item: Document) => {
  documentEditedIndex.value = documents.value.indexOf(item)
  selectedDocument.value = { ...item }
  deleteDocumentDialog.value = true
}

const closeDeleteDocument = () => {
  deleteDocumentDialog.value = false
  selectedDocument.value = new Document()
  documentEditedIndex.value = -1
}

const deleteDocument = async () => {
  await documentStore.deleteDocument(selectedDocument.value)
  if (documentEditedIndex.value > -1)
    documents.value.splice(documentEditedIndex.value, 1)

  closeDeleteDocument()
}

onMounted(async () => {
  expenseTypes.value = await refDataStore.getRefData('expenseType')
})
</script>

<template>
  <VContainer
    fluid
    class="pa-0 pt-1"
  >
    <VCard class="mb-1">
      <VCardTitle>Search</VCardTitle>
      <VCardText>
        <VRow>
          <VCol
            cols="12"
            md="4"
          >
            <VAutocomplete
              v-model="searchExpenseTypeId"
              :items="expenseTypes"
              :custom-filter="expenseTypeFilter"
              item-title="description"
              item-value="id"
              label="Expense Type"
              clearable
            />
          </VCol>
          <VCol
            cols="12"
            md="4"
          >
            <VTextField
              v-model="searchParams.keyWords"
              label="Keywords"
              clearable
            />
          </VCol>
          <VCol
            cols="12"
            md="4"
          >
            <VTextarea
              v-model="searchParams.metaDataChunk"
              label="Metadata"
              rows="1"
              clearable
            />
          </VCol>
        </VRow>
        <VRow>
          <VCol
            cols="12"
            md="4"
          >
            <label class="text-caption mb-1 d-inline-block">Start Date</label>
            <DatePicker
              v-model="startDate"
              class="w-100"
              date-format="dd-mm-yy"
              show-icon
            />
          </VCol>
          <VCol
            cols="12"
            md="4"
          >
            <label class="text-caption mb-1 d-inline-block">End Date</label>
            <DatePicker
              v-model="endDate"
              class="w-100"
              date-format="dd-mm-yy"
              show-icon
            />
          </VCol>
          <VCol
            cols="12"
            md="4"
            class="d-flex align-end ga-2"
          >
            <VBtn
              color="primary"
              :disabled="!canSearch || loading"
              @click="runSearch"
            >
              Search
            </VBtn>
            <VBtn
              variant="outlined"
              :disabled="loading"
              @click="clearSearch"
            >
              Clear
            </VBtn>
          </VCol>
        </VRow>
      </VCardText>
    </VCard>

    <VCard class="mb-1">
      <VCardText>
        Displaying {{ expenses.length }} expense(s) and {{ documents.length }} document(s)
      </VCardText>
    </VCard>

    <VCard
      v-if="chartData"
      class="mb-1"
    >
      <VCardTitle>Expense graph</VCardTitle>
      <VCardText class="pt-0">
        <div class="search-expense-chart">
          <BarChart
            :key="chartUpdateKey"
            chart-id="search-expense-graph"
            :chart-data="chartData"
            :chart-options="barChartOptions"
            :styles="{ width: '100%', height: '100%' }"
          />
        </div>
      </VCardText>
    </VCard>

    <VRow class="ma-0">
      <VCol
        cols="12"
        md="5"
      >
        <VCard>
          <VCardTitle>Documents</VCardTitle>
          <VDataTable
            :headers="documentHeaders"
            :items="documents"
            :items-per-page="10"
            class="text-no-wrap"
          >
            <template #item.actions="{ item }">
              <div class="d-flex gap-1">
                <IconBtn
                  v-if="!item.isFolder"
                  size="small"
                  @click="viewDocumentation(item)"
                >
                  <VIcon icon="ri-download-line" />
                </IconBtn>
                <IconBtn
                  size="small"
                  @click="editDocument(item)"
                >
                  <VIcon icon="ri-pencil-line" />
                </IconBtn>
                <IconBtn
                  size="small"
                  @click="promptDeleteDocument(item)"
                >
                  <VIcon icon="ri-delete-bin-line" />
                </IconBtn>
              </div>
            </template>
          </VDataTable>
        </VCard>
      </VCol>

      <VCol
        cols="12"
        md="7"
      >
        <VCard>
          <VCardTitle>Expenses</VCardTitle>
          <VDataTable
            :headers="expenseHeaders"
            :items="expenses"
            :items-per-page="10"
          >
            <template #item.paid="{ item }">
              <VIcon :icon="item.paid ? 'ri-checkbox-line' : 'ri-checkbox-blank-line'" />
            </template>
            <template #item.actions="{ item }">
              <div class="d-flex gap-1">
                <IconBtn
                  v-if="item.documentDto"
                  size="small"
                  @click="viewDocumentation(item.documentDto)"
                >
                  <VIcon icon="ri-download-line" />
                </IconBtn>
                <IconBtn
                  size="small"
                  @click="editExpense(item)"
                >
                  <VIcon icon="ri-pencil-line" />
                </IconBtn>
                <IconBtn
                  size="small"
                  @click="promptDeleteExpense(item)"
                >
                  <VIcon icon="ri-delete-bin-line" />
                </IconBtn>
              </div>
            </template>
          </VDataTable>
        </VCard>
      </VCol>
    </VRow>
  </VContainer>

  <VDialog
    v-model="addEditDialog"
    max-width="900px"
  >
    <VCard title="Edit Expense">
      <VCardText>
        <VRow>
          <VCol
            cols="6"
            sm="3"
          >
            <label for="selectedExpenseTypeId">Expense Type</label>
          </VCol>
          <VCol
            cols="12"
            sm="6"
          >
            <VSelect
              v-model="selectedExpenseTypeId"
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
            <label for="selectedItem.amount">Amount</label>
          </VCol>
          <VCol
            cols="18"
            sm="9"
          >
            <VTextField v-model="selectedItem.amount" />
          </VCol>
        </VRow>
        <VRow>
          <VCol
            cols="6"
            sm="3"
          >
            <label for="dueDate">Due Date</label>
          </VCol>
          <VCol
            cols="12"
            sm="6"
          >
            <DatePicker
              v-model="dueDate"
              date-format="dd-mm-yy"
            />
          </VCol>
        </VRow>
        <VRow>
          <VCol
            cols="6"
            sm="3"
          >
            <label for="selectedItem.paid">Paid</label>
          </VCol>
          <VCol
            cols="18"
            sm="9"
          >
            <VCheckbox v-model="selectedItem.paid" />
          </VCol>
        </VRow>
        <VRow>
          <VCol
            cols="6"
            sm="3"
          >
            <label for="selectedItem.notes">Notes</label>
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
            @click="closeEditExpense"
          >
            Cancel
          </VBtn>
          <VBtn
            color="success"
            variant="elevated"
            @click="saveEditExpense"
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
        <strong>{{ selectedItem.transactionType?.description }}</strong>?
      </VCardText>
      <VCardActions>
        <VBtn
          color="blue darken-1"
          @click="closeDeleteExpense"
        >
          Cancel
        </VBtn>
        <VBtn
          color="red darken-1"
          @click="deleteExpense"
        >
          Delete
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>

  <VDialog
    v-model="addEditDocumentDialog"
    max-width="900px"
  >
    <VCard :title="documentDialogTitle">
      <VCardText>
        <VRow>
          <VCol
            cols="6"
            sm="3"
          >
            <label for="selectedDocument.fileName">Name</label>
          </VCol>
          <VCol
            cols="18"
            sm="9"
          >
            <VTextField v-model="selectedDocument.fileName" />
          </VCol>
        </VRow>
        <VRow>
          <VCol
            cols="6"
            sm="3"
          >
            <label for="selectedDocument.metaDataChunk">Metadata</label>
          </VCol>
          <VCol
            cols="18"
            sm="9"
          >
            <VTextarea
              v-model="selectedDocument.metaDataChunk"
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
            @click="closeEditDocument"
          >
            Cancel
          </VBtn>
          <VBtn
            color="success"
            variant="elevated"
            @click="saveEditDocument"
          >
            Save
          </VBtn>
        </div>
      </VCardText>
    </VCard>
  </VDialog>

  <VDialog
    v-model="deleteDocumentDialog"
    max-width="500px"
  >
    <VCard>
      <VCardTitle>Confirm Deletion</VCardTitle>
      <VCardText v-if="selectedDocument.isFolder">
        Are you sure you want to delete folder
        <strong>{{ selectedDocument.fileName }}</strong>? This also deletes nested files/folders.
      </VCardText>
      <VCardText v-else>
        Are you sure you want to delete file
        <strong>{{ selectedDocument.fileName }}</strong>?
      </VCardText>
      <VCardActions>
        <VBtn
          color="blue darken-1"
          @click="closeDeleteDocument"
        >
          Cancel
        </VBtn>
        <VBtn
          color="red darken-1"
          @click="deleteDocument"
        >
          Delete
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<style lang="scss">
// When app uses boxed content width, main area is capped (~1440px) leaving empty space on wide screens.
// This page opts into full viewport width for the main column only (documents/expense split unchanged).
.layout-wrapper.search-layout-full-width.layout-content-width-boxed .layout-page-content,
.layout-wrapper.search-layout-full-width.layout-content-width-boxed .layout-navbar {
  max-inline-size: none;
  inline-size: 100%;
}

.search-expense-chart {
  block-size: 11rem;
  inline-size: 100%;
}
</style>
