<script setup lang="ts">
import DatePicker from 'primevue/datepicker'
import { computed, ref, watch } from 'vue'
import { useNotificationsStore } from '@/stores/notificationsStore'

import type { Notification } from '@/types/notification'
import type { RefData } from '@/types/refData'

const showAll = ref(false)
const selectedExpenseTypeId = ref<number | null>(null)
const messageFilter = ref('')
const dateFilterType = ref<'created' | 'due'>('created')
const dateFrom = ref<Date | null>(null)
const dateTo = ref<Date | null>(null)
const appliedExpenseTypeId = ref<number | null>(null)
const appliedMessageFilter = ref('')
const appliedDateFilterType = ref<'created' | 'due'>('created')
const appliedDateFrom = ref<Date | null>(null)
const appliedDateTo = ref<Date | null>(null)

const notificationsStore = useNotificationsStore()
const pageNotifications = ref<Notification[]>([])
const pageLoading = ref(false)

async function loadPageNotifications(includeAll = false) {
  pageLoading.value = true
  try {
    pageNotifications.value = includeAll
      ? await notificationsStore.fetchNotifications(true)
      : await notificationsStore.getNotifications(false)
  }
  finally {
    pageLoading.value = false
  }
}

void loadPageNotifications()

const baseNotifications = computed(() => {
  if (showAll.value)
    return pageNotifications.value

  return pageNotifications.value.filter(
    notification => !notification.read && !notification.removed,
  )
})

const expenseTypeOptions = computed(() => {
  const typesById = new Map<number, RefData>()

  for (const notification of baseNotifications.value) {
    const transactionType = notification.expense?.transactionType
    if (transactionType?.id != null && transactionType.description)
      typesById.set(transactionType.id, transactionType)
  }

  return [...typesById.values()].sort((a, b) => a.description.localeCompare(b.description))
})

watch(expenseTypeOptions, options => {
  if (selectedExpenseTypeId.value != null
    && !options.some(type => type.id === selectedExpenseTypeId.value))
    selectedExpenseTypeId.value = null

  if (appliedExpenseTypeId.value != null
    && !options.some(type => type.id === appliedExpenseTypeId.value))
    appliedExpenseTypeId.value = null
})

function sortNewestFirst(list: Notification[]) {
  return [...list].sort((a, b) => b.id - a.id)
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function getFilterDate(notification: Notification) {
  const dateString = appliedDateFilterType.value === 'created'
    ? notification.createdDateString
    : notification.expense?.dueDateString ?? ''

  const parsed = parseDate(dateString)

  return parsed ? startOfDay(parsed) : null
}

function matchesDateFilter(notification: Notification) {
  const filterDate = getFilterDate(notification)
  const from = appliedDateFrom.value ? startOfDay(appliedDateFrom.value) : null
  const to = appliedDateTo.value ? startOfDay(appliedDateTo.value) : null

  if (!from && !to)
    return true

  if (!filterDate)
    return false

  if (from && !to)
    return filterDate >= from

  if (!from && to)
    return filterDate <= to

  const rangeStart = from! <= to! ? from! : to!
  const rangeEnd = from! <= to! ? to! : from!

  return filterDate >= rangeStart && filterDate <= rangeEnd
}

function applyFilters(list: Notification[]) {
  let filtered = list

  if (appliedExpenseTypeId.value != null) {
    filtered = filtered.filter(
      notification => notification.expense?.transactionType?.id === appliedExpenseTypeId.value,
    )
  }

  const query = appliedMessageFilter.value.trim().toLowerCase()
  if (query) {
    filtered = filtered.filter(
      notification => notification.message?.toLowerCase().includes(query),
    )
  }

  if (appliedDateFrom.value || appliedDateTo.value)
    filtered = filtered.filter(matchesDateFilter)

  return filtered
}

function runFilter() {
  appliedExpenseTypeId.value = selectedExpenseTypeId.value
  appliedMessageFilter.value = messageFilter.value
  appliedDateFilterType.value = dateFilterType.value
  appliedDateFrom.value = dateFrom.value
  appliedDateTo.value = dateTo.value
}

function clearFilters() {
  selectedExpenseTypeId.value = null
  messageFilter.value = ''
  dateFilterType.value = 'created'
  dateFrom.value = null
  dateTo.value = null
  appliedExpenseTypeId.value = null
  appliedMessageFilter.value = ''
  appliedDateFilterType.value = 'created'
  appliedDateFrom.value = null
  appliedDateTo.value = null
}

watch(showAll, includeAll => {
  clearFilters()
  void loadPageNotifications(includeAll)
})

function syncNotificationReadState(id: number, read: boolean) {
  for (const notification of pageNotifications.value) {
    if (notification.id === id) {
      notification.read = read
      break
    }
  }

  for (const notification of notificationsStore.notifications) {
    if (notification.id === id) {
      notification.read = read
      break
    }
  }
}

const displayedNotifications = computed(() => {
  if (pageLoading.value && showAll.value)
    return []

  return sortNewestFirst(applyFilters(baseNotifications.value))
})

const headers = [
  { title: 'EXPENSE', key: 'expense.transactionType.description', width: '230px', minWidth: '230px' },
  { title: 'MESSAGE', key: 'message', minWidth: '400px' },
  { title: 'DUE DATE', key: 'expense.dueDateString', width: '130px', minWidth: '130px' },
  { title: 'CREATED', key: 'createdDateString', width: '130px', minWidth: '130px' },
  { title: 'AMOUNT', key: 'expense.amount', width: '100px', minWidth: '100px' },
  { title: 'MARK READ', key: 'read', width: '110px', minWidth: '110px', sortable: false },
  { title: 'REMOVED', key: 'removed', width: '110px', minWidth: '110px', sortable: false },
]

const markRead = (item: Notification) => {
  if (item.removed)
    return

  if (item.read) {
    void notificationsStore.markRead(item.id)
    syncNotificationReadState(item.id, true)
  }
  else {
    void notificationsStore.markUnRead(item.id)
    syncNotificationReadState(item.id, false)
  }
}
</script>

<template>
  <div class="notifications-page">
    <VCard class="notifications-card">
    <VCardText class="pb-0 notifications-filters">
      <VRow
        class="align-center"
        dense
      >
        <VCol
          cols="12"
          md="3"
        >
          <VCheckbox
            v-model="showAll"
            label="Show All"
            hide-details
            density="compact"
            :disabled="notificationsStore.loading || pageLoading"
          />
        </VCol>
        <VCol
          cols="12"
          md="4"
        >
          <VSelect
            v-model="selectedExpenseTypeId"
            :items="expenseTypeOptions"
            item-title="description"
            item-value="id"
            label="Expense type"
            placeholder="All"
            clearable
            hide-details
            density="compact"
          />
        </VCol>
        <VCol
          cols="12"
          md="3"
        >
          <VTextField
            v-model="messageFilter"
            label="Search message"
            placeholder="Filter by message text..."
            clearable
            hide-details
            density="compact"
            @keyup.enter="runFilter"
          />
        </VCol>
        <VCol
          cols="12"
          md="2"
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
      <VRow
        class="align-center notifications-filters-date-row"
        dense
      >
        <VCol
          cols="12"
          md="3"
        />
        <VCol
          cols="12"
          md="2"
          class="notifications-date-type-col"
        >
          <VRadioGroup
            v-model="dateFilterType"
            hide-details
            density="compact"
          >
            <VRadio
              label="Created"
              value="created"
              density="compact"
              hide-details
            />
            <VRadio
              label="Due date"
              value="due"
              density="compact"
              hide-details
            />
          </VRadioGroup>
        </VCol>
        <VCol
          cols="12"
          md="3"
        >
          <label class="text-caption mb-0 d-inline-block">From</label>
          <DatePicker
            v-model="dateFrom"
            class="w-100 notifications-date-field"
            date-format="dd-mm-yy"
            show-icon
            placeholder="From"
            size="small"
          />
        </VCol>
        <VCol
          cols="12"
          md="3"
        >
          <label class="text-caption mb-0 d-inline-block">To</label>
          <DatePicker
            v-model="dateTo"
            class="w-100 notifications-date-field"
            date-format="dd-mm-yy"
            show-icon
            placeholder="To"
            size="small"
          />
        </VCol>
      </VRow>
    </VCardText>

    <VDataTable
      :headers="headers"
      :items="displayedNotifications"
      :items-per-page="15"
      :loading="pageLoading"
      loading-text="Loading notifications..."
      class="notifications-table"
    >
      <template #item.read="{ item }">
        <VCheckbox
          v-model="item.read"
          :disabled="item.removed"
          hide-details
          density="compact"
          @update:model-value="markRead(item)"
        />
      </template>

      <template #item.removed="{ item }">
        <VCheckbox
          :model-value="item.removed"
          disabled
          hide-details
          density="compact"
        />
      </template>
    </VDataTable>
    </VCard>
  </div>
</template>

<style scoped lang="scss">
.notifications-filters {
  :deep(.notifications-filters-date-row) {
    margin-top: -4px;
  }

  :deep(.notifications-filters-date-row .v-col) {
    padding-top: 0;
  }

  :deep(.notifications-date-type-col) {
    padding-top: 0 !important;
  }

  :deep(.notifications-date-type-col .v-radio) {
    min-height: 28px;
  }

  :deep(.notifications-date-field .p-inputtext) {
    font-size: 0.8125rem;
    padding-block: 0.35rem;
    padding-inline: 0.5rem;
  }

  :deep(.notifications-date-field .p-datepicker-input-icon-container) {
    font-size: 0.875rem;
  }
}

.notifications-table {
  inline-size: 100%;
}

.notifications-table :deep(table) {
  inline-size: 100%;
  table-layout: fixed;
}

.notifications-table :deep(th),
.notifications-table :deep(td) {
  overflow: hidden;
  text-overflow: ellipsis;
}

.notifications-table :deep(th:nth-child(2)),
.notifications-table :deep(td:nth-child(2)) {
  white-space: normal;
  word-break: break-word;
}

.notifications-table :deep(th:nth-child(3)),
.notifications-table :deep(td:nth-child(3)),
.notifications-table :deep(th:nth-child(4)),
.notifications-table :deep(td:nth-child(4)) {
  white-space: nowrap;
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
