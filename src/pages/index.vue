<template>
  <table style="border-spacing: 30px" max-width="900px">
    <tr>
      <td>
        <VCard>
          <VCardTitle
            >Week Beginning: {{ expenseStore.homeInfo?.thisWeek }}</VCardTitle
          ></VCard
        >
      </td>
      <td style="float: right">
        <table>
          <tr>
            <td width="300px">
              <table width="100%">
                <tr>
                  <td>
                    <vBtn color="primary" @click="addIncome()">Add Income</vBtn>
                  </td>
                  <td>
                    <vBtn color="primary" @click="addExpense()"
                      >Add Expense</vBtn
                    >
                  </td>
                </tr>
              </table>
            </td>
            <td width="50px">
              <IconBtn size="small" @click="prevWeek()">
                <VIcon icon="ri-arrow-left-double-line" />
              </IconBtn>
            </td>
            <td width="50px" @click="prevWeek()">Prev</td>
            <td width="50px" @click="nextWeek()">Next</td>
            <td width="50px">
              <IconBtn size="small" @click="nextWeek()">
                <VIcon icon="ri-arrow-right-double-line" />
              </IconBtn>
            </td>
            <td>
              <DatePicker
                v-model="selectedDate"
                dateFormat="dd-mm-yy"
                @date-select="gotoWeek()"
              />
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td valign="top">
        <VCard>
          <VCardTitle>Incomes</VCardTitle>
          <VDataTable
            :headers="incomeHeaders"
            :items="expenseStore.homeInfo?.incomes"
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
                        v-if="item.documentDto"
                        size="small"
                        @click="viewDocumentation(item.documentDto)"
                      >
                        <VIcon icon="ri-download-line" />
                      </IconBtn>
                    </td>
                    <td style="min-width: 35px">
                      <IconBtn size="small" @click="editIncomeItem(item)">
                        <VIcon icon="ri-pencil-line" />
                      </IconBtn>
                    </td>
                    <td style="min-width: 35px">
                      <IconBtn size="small" @click="deleteIncomesItem(item)">
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
        <VCard>
          <VCardTitle>Expenses</VCardTitle>
          <VDataTable
            :headers="headers"
            :items="expenseStore.homeInfo?.expenses"
            :items-per-page="10"
            class="text-no-wrap"
          >
            <template #item.paid="{ item }">
              <VCheckbox
                v-model="item.paid"
                @change="setPaid(item)"
              ></VCheckbox>
            </template>

            <!-- Actions -->
            <template #item.actions="{ item }">
              <div class="d-flex gap-1">
                <table>
                  <tr>
                    <td style="min-width: 35px">
                      <IconBtn
                        v-if="item.documentDto"
                        size="small"
                        @click="viewDocumentation(item.documentDto)"
                      >
                        <VIcon icon="ri-download-line" />
                      </IconBtn>
                    </td>
                    <td style="min-width: 35px">
                      <IconBtn
                        size="small"
                        @click="editExpensesItem(item, false)"
                      >
                        <VIcon icon="ri-pencil-line" />
                      </IconBtn>
                    </td>
                    <td style="min-width: 35px">
                      <IconBtn
                        size="small"
                        @click="deleteExpensesItem(item, false)"
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
    <tr>
      <td></td>
      <td>
        <VCard
          v-if="
            expenseStore.homeInfo &&
            expenseStore.homeInfo.unpaidExpenses &&
            expenseStore.homeInfo.unpaidExpenses.length > 0
          "
        >
          <VCardTitle>Unpaid Expenses</VCardTitle>
          <VDataTable
            :headers="headers"
            :items="expenseStore.homeInfo?.unpaidExpenses"
            :items-per-page="10"
            class="text-no-wrap"
          >
            <template #item.paid="{ item }">
              <VCheckbox
                v-model="item.paid"
                @change="setPaid(item)"
              ></VCheckbox>
            </template>

            <!-- Actions -->
            <template #item.actions="{ item }">
              <div class="d-flex gap-1">
                <table>
                  <tr>
                    <td style="min-width: 35px">
                      <IconBtn
                        v-if="item.documentDto"
                        size="small"
                        @click="viewDocumentation(item.documentDto)"
                      >
                        <VIcon icon="ri-download-line" />
                      </IconBtn>
                    </td>
                    <td style="min-width: 35px">
                      <IconBtn
                        size="small"
                        @click="editExpensesItem(item, true)"
                      >
                        <VIcon icon="ri-pencil-line" />
                      </IconBtn>
                    </td>
                    <td style="min-width: 35px">
                      <IconBtn
                        size="small"
                        @click="deleteExpensesItem(item, true)"
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

  <!-- 👉 Add/Edit Dialog  -->
  <VDialog v-model="addEditDialog" max-width="900px">
    <VCard :title="dialogTitle">
      <VCardText>
        <VRow>
          <VCol cols="6" sm="3">
            <label for="transactionTypeId">Expense Type</label>
          </VCol>
          <VCol cols="12" sm="6">
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
          <VCol cols="6" sm="3">
            <label for="selectedItem.amount">Amount</label>
          </VCol>
          <VCol cols="18" sm="9">
            <VTextField v-model="selectedItem.amount" />
          </VCol>
        </VRow>
        <VRow>
          <VCol cols="6" sm="3">
            <label for="recurring">Recurring</label>
          </VCol>
          <VCol cols="18" sm="9">
            <VCheckbox v-model="recurring"></VCheckbox>
          </VCol>
        </VRow>
        <VRow v-if="recurring">
          <VCol cols="6" sm="3">
            <label for="recurringTypeId">Recurring Type</label>
          </VCol>
          <VCol cols="12" sm="6">
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
          <VCol cols="6" sm="3">
            <label for="selectedDate">Start Date</label>
          </VCol>
          <VCol cols="12" sm="6">
            <DatePicker v-model="startDate" dateFormat="dd-mm-yy" />
          </VCol>
        </VRow>
        <VRow v-if="recurring">
          <VCol cols="6" sm="3">
            <label for="selectedDate">End Date</label>
          </VCol>
          <VCol cols="12" sm="6">
            <DatePicker v-model="endDate" dateFormat="dd-mm-yy" />
          </VCol>
        </VRow>
        <VRow v-if="!recurring">
          <VCol cols="6" sm="3">
            <label for="selectedDate">Due Date</label>
          </VCol>
          <VCol cols="12" sm="6">
            <DatePicker v-model="dueDate" dateFormat="dd-mm-yy" />
          </VCol>
        </VRow>
        <VRow>
          <VCol cols="6" sm="3">
            <label for="selectedItem.description">Notes</label>
          </VCol>
          <VCol cols="18" sm="9">
            <VTextField v-model="selectedItem.notes" />
          </VCol>
        </VRow>
        <VRow>
          <VCol cols="6" sm="3">
            <label for="selectedItem.metaDataChunk">Metadata</label>
          </VCol>
          <VCol cols="18" sm="9">
            <VTextarea v-model="selectedItem.metaDataChunk" rows="2" />
          </VCol>
        </VRow>
        <VRow>
          <VCol cols="6" sm="3">
            <label for="file">File</label>
          </VCol>
          <VCol cols="18" sm="6">
            <VCard style="width: 650px">
              <VCardTitle>Upload File</VCardTitle>
              <VCardText>
                <VFileInput
                  style="width: 600px"
                  v-model="file"
                  label="Choose a file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg"
                  show-size
                  @change="handleFileChange"
                ></VFileInput>

                <VProgressLinear
                  v-if="uploading"
                  indeterminate
                  color="primary"
                  class="mt-2"
                ></VProgressLinear>

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
                ></VImg>
              </VCardText>
            </VCard>
          </VCol>
        </VRow>
      </VCardText>

      <VCardText>
        <div class="self-align-end d-flex gap-4 justify-end">
          <VBtn color="error" variant="outlined" @click="closeAddEdit">
            Cancel
          </VBtn>
          <VBtn color="success" variant="elevated" @click="saveAddEdit">
            Save
          </VBtn>
        </div>
      </VCardText>
    </VCard>
  </VDialog>

  <!-- 👉 Add/Edit Income Dialog  -->
  <VDialog v-model="addEditIncomeDialog" max-width="900px">
    <VCard :title="dialogTitle">
      <VCardText>
        <VRow>
          <VCol cols="6" sm="3">
            <label for="transactionTypeId">Income Type</label>
          </VCol>
          <VCol cols="12" sm="6">
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
          <VCol cols="6" sm="3">
            <label for="selectedItem.amount">Amount</label>
          </VCol>
          <VCol cols="18" sm="9">
            <VTextField v-model="selectedIncomeItem.amount" />
          </VCol>
        </VRow>
        <VRow>
          <VCol cols="6" sm="3">
            <label for="selectedDate">Due Date</label>
          </VCol>
          <VCol cols="12" sm="6">
            <DatePicker v-model="dueDate" dateFormat="dd-mm-yy" />
          </VCol>
        </VRow>
        <VRow>
          <VCol cols="6" sm="3">
            <label for="selectedItem.description">Notes</label>
          </VCol>
          <VCol cols="18" sm="9">
            <VTextField v-model="selectedIncomeItem.notes" />
          </VCol>
        </VRow>
        <VRow>
          <VCol cols="6" sm="3">
            <label for="selectedItem.metaDataChunk">Metadata</label>
          </VCol>
          <VCol cols="18" sm="9">
            <VTextarea v-model="selectedIncomeItem.metaDataChunk" rows="2" />
          </VCol>
        </VRow>
        <VRow>
          <VCol cols="6" sm="3">
            <label for="file">File</label>
          </VCol>
          <VCol cols="18" sm="6">
            <VCard style="width: 650px">
              <VCardTitle>Upload File</VCardTitle>
              <VCardText>
                <VFileInput
                  style="width: 600px"
                  v-model="file"
                  label="Choose a file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg"
                  show-size
                  @change="handleFileChange"
                ></VFileInput>

                <VProgressLinear
                  v-if="uploading"
                  indeterminate
                  color="primary"
                  class="mt-2"
                ></VProgressLinear>

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
                ></VImg>
              </VCardText>
            </VCard>
          </VCol>
        </VRow>
      </VCardText>

      <VCardText>
        <div class="self-align-end d-flex gap-4 justify-end">
          <VBtn color="error" variant="outlined" @click="closeAddEditIncome">
            Cancel
          </VBtn>
          <VBtn color="success" variant="elevated" @click="saveAddEditIncome">
            Save
          </VBtn>
        </div>
      </VCardText>
    </VCard>
  </VDialog>

  <!-- Delete Confirmation Dialog -->
  <VDialog v-model="deleteDialog" max-width="400px">
    <VCard>
      <VCardTitle>Confirm Deletion</VCardTitle>
      <VCardText>
        Are you sure you want to delete
        <strong>{{ selectedItem.transactionType?.description }}</strong
        >?
      </VCardText>
      <VCardActions>
        <VBtn color="blue darken-1" @click="closeDelete">Cancel</VBtn>
        <VBtn color="red darken-1" @click="deleteExpensesItemConfirm"
          >Delete</VBtn
        >
      </VCardActions>
    </VCard>
  </VDialog>

  <!-- Delete Income Confirmation Dialog -->
  <VDialog v-model="deleteIncomeDialog" max-width="400px">
    <VCard>
      <VCardTitle>Confirm Deletion</VCardTitle>
      <VCardText>
        Are you sure you want to delete
        <strong>{{ selectedIncomeItem.transactionType?.description }}</strong
        >?
      </VCardText>
      <VCardActions>
        <VBtn color="blue darken-1" @click="closeDeleteIncome">Cancel</VBtn>
        <VBtn color="red darken-1" @click="deleteIncomesItemConfirm"
          >Delete</VBtn
        >
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<script setup lang="ts">
import { useDocumentStore } from "@/stores/documentStore";
import { useExpensesStore } from "@/stores/expensesStore";
import { useIncomesStore } from "@/stores/incomesStore";
import { useRefDataStore } from "@/stores/refDataStore";
import { Document } from "@/types/document";
import { Expense } from "@/types/expense";
import { Income } from "@/types/income";
import { RefData } from "@/types/refData";
import { format } from "date-fns";
import DatePicker from "primevue/datepicker";
import { VCardTitle } from "vuetify/components";

const addEditDialog = ref(false);
const addEditIncomeDialog = ref(false);
const deleteDialog = ref(false);
const deleteIncomeDialog = ref(false);

const recurringTypes = ref<RefData[]>([]);
const expenseTypes = ref<RefData[]>([]);
const incomeTypes = ref<RefData[]>([]);

const refDataStore = useRefDataStore();
const incomeStore = useIncomesStore();

refDataStore.getRefData("expenseType").then((res) => {
  expenseTypes.value = res;
});
refDataStore.getRefData("incomeType").then((res) => {
  incomeTypes.value = res;
});
refDataStore.getRefData("recurringType").then((res) => {
  recurringTypes.value = res;
});

let transactionTypeId = ref<number>();
let recurringTypeId = ref<number>();

let recurring = ref(false);

const expenseStore = useExpensesStore();
expenseStore.getTransactionsForWeek();

const documentStore = useDocumentStore();

let selectedDate = ref<Date | null>(null);
let startDate: Date | null = null;
let endDate: Date | null = null;
let dueDate: Date | null = null;

const headers = [
  { title: "NAME", key: "transactionType.description" },
  { title: "AMOUNT", key: "amount" },
  { title: "DUE DATE", key: "dueDateString" },
  { title: "PAID", key: "paid" },
  { title: "NOTES", key: "notes" },
  { title: "ACTIONS", key: "actions" },
];
const incomeHeaders = [
  { title: "NAME", key: "transactionType.description" },
  { title: "AMOUNT", key: "amount" },
  { title: "DUE DATE", key: "dueDateString" },
  { title: "NOTES", key: "notes" },
  { title: "ACTIONS", key: "actions" },
];

const defaultItem = ref<Expense>({
  dueDateString: "",
  startDateString: "",
  endDateString: "",
  notes: "",
  paid: false,
});

const selectedItem = ref<Expense>(defaultItem.value);
const defaultIncomeItem = ref<Income>({
  dueDateString: "",
  notes: "",
});

const selectedIncomeItem = ref<Income>(defaultIncomeItem.value);
let dialogTitle = ref<string>();
const editedIndex = ref(-1);

const addExpense = () => {
  addEditDialog.value = true;
  dialogTitle.value = "Add Expense";
};

const addIncome = () => {
  addEditIncomeDialog.value = true;
  dialogTitle.value = "Add Income";
};

const prevWeek = () => {
  expenseStore.getTransactionsForWeek(expenseStore.homeInfo?.previousWeek);
};
const nextWeek = () => {
  expenseStore.getTransactionsForWeek(expenseStore.homeInfo?.nextWeek);
};
const gotoWeek = () => {
  if (selectedDate.value != null) {
    expenseStore.getTransactionsForWeek(
      format(selectedDate.value, "dd-MM-yyyy")
    );
  }
};

const setPaid = (item: Expense) => {
  if (item.paid) {
    expenseStore.payExpense(item.id);
  } else {
    expenseStore.unPayExpense(item.id);
  }
};

const viewDocumentation = (documentDto: Document) => {
  if (documentDto) {
    documentStore
      .getFileById(documentDto.id, documentDto.fileName)
      .then((res) => {
        var fileURL = URL.createObjectURL(res);
        window.open(fileURL);
      });
  }
};

const editExpensesItem = (item: Expense, unPaid: boolean) => {
  if (expenseStore.homeInfo) {
    if (unPaid && expenseStore.homeInfo.unpaidExpenses) {
      editedIndex.value = expenseStore.homeInfo.unpaidExpenses.indexOf(
        item
      ) as number;
    } else {
      editedIndex.value = expenseStore.homeInfo.expenses.indexOf(
        item
      ) as number;
    }
  }
  selectedItem.value = { ...item };
  transactionTypeId.value = selectedItem.value.transactionType?.id;
  recurringTypeId.value = selectedItem.value.recurringType?.id;
  dueDate = parseDate(selectedItem.value.dueDateString);
  startDate = parseDate(selectedItem.value.startDateString);
  endDate = parseDate(selectedItem.value.endDateString);
  addEditDialog.value = true;
  if (unPaid) {
    dialogTitle.value = "Edit Unpaid Expense";
  } else {
    dialogTitle.value = "Edit Expense";
  }
};

const deleteExpensesItem = (item: Expense, unPaid: boolean) => {
  if (expenseStore.homeInfo) {
    if (unPaid && expenseStore.homeInfo.unpaidExpenses) {
      editedIndex.value = expenseStore.homeInfo.unpaidExpenses.indexOf(
        item
      ) as number;
    } else {
      editedIndex.value = expenseStore.homeInfo?.expenses.indexOf(
        item
      ) as number;
    }
  }
  selectedItem.value = { ...item };
  deleteDialog.value = true;
};

const deleteIncomesItem = (item: Income) => {
  editedIndex.value = expenseStore.homeInfo?.incomes.indexOf(item) as number;
  selectedIncomeItem.value = { ...item };
  deleteIncomeDialog.value = true;
};

const editIncomeItem = (item: Income) => {
  editedIndex.value = expenseStore.homeInfo?.incomes.indexOf(item) as number;
  selectedIncomeItem.value = { ...item };
  transactionTypeId.value = selectedIncomeItem.value.transactionType?.id;
  dueDate = parseDate(selectedIncomeItem.value.dueDateString);
  addEditDialog.value = true;
  dialogTitle.value = "Edit Income";
};

const closeAddEdit = () => {
  addEditDialog.value = false;
  editedIndex.value = -1;
  selectedItem.value = { ...defaultItem.value };
  dueDate = null;
  startDate = null;
  endDate = null;
  recurring.value = false;
};

const closeAddEditIncome = () => {
  addEditIncomeDialog.value = false;
  editedIndex.value = -1;
  selectedIncomeItem.value = { ...defaultIncomeItem.value };
  dueDate = null;
};

const closeDelete = () => {
  deleteDialog.value = false;
  editedIndex.value = -1;
  selectedItem.value = { ...defaultItem.value };
};

const closeDeleteIncome = () => {
  deleteIncomeDialog.value = false;
  editedIndex.value = -1;
  selectedIncomeItem.value = { ...defaultIncomeItem.value };
};

const saveAddEdit = () => {
  if (dueDate != null) {
    selectedItem.value.dueDateString = format(dueDate, "dd-MM-yyyy");
  }
  if (startDate != null) {
    selectedItem.value.dueDateString = format(startDate, "dd-MM-yyyy");
  }
  if (endDate != null) {
    selectedItem.value.dueDateString = format(endDate, "dd-MM-yyyy");
  }
  selectedItem.value.transactionType = expenseTypes.value.find(
    (refData) => refData.id == transactionTypeId.value
  );
  if (dialogTitle.value?.indexOf("Edit") != -1) {
    if (editedIndex.value > -1) {
      expenseStore.updateExpense(selectedItem.value);
    }
  } else {
    console.log("Response3:", selectedItem.value);
    expenseStore.addExpense(selectedItem.value);
  }
  if (dueDate) {
    expenseStore.getTransactionsForWeek(format(dueDate, "dd-MM-yyyy"));
  } else if (startDate) {
    expenseStore.getTransactionsForWeek(format(startDate, "dd-MM-yyyy"));
  }

  closeAddEdit();
};

const saveAddEditIncome = () => {
  if (dueDate != null) {
    selectedIncomeItem.value.dueDateString = format(dueDate, "dd-MM-yyyy");
  }
  selectedIncomeItem.value.transactionType = incomeTypes.value.find(
    (refData) => refData.id == transactionTypeId.value
  );
  if (dialogTitle.value?.indexOf("Edit") != -1) {
    if (editedIndex.value > -1) {
      incomeStore.updateIncome(selectedIncomeItem.value);
    }
  } else {
    incomeStore.addIncome(selectedIncomeItem.value);
  }
  if (dueDate) {
    expenseStore.getTransactionsForWeek(format(dueDate, "dd-MM-yyyy"));
  }

  closeAddEditIncome();
};

const deleteExpensesItemConfirm = () => {
  expenseStore.homeInfo?.expenses.splice(editedIndex.value, 1);
  expenseStore.deleteExpense(selectedItem.value);
  closeDelete();
};

const deleteIncomesItemConfirm = () => {
  expenseStore.homeInfo?.incomes.splice(editedIndex.value, 1);
  incomeStore.deleteIncome(selectedIncomeItem.value);
  closeDeleteIncome();
};

const file = ref<File | null>(null);
const imageUrl = ref<string | null>(null);
const uploading = ref<boolean>(false);

// Handle file selection and preview
const handleFileChange = () => {
  if (!file.value) {
    imageUrl.value = null;
    return;
  }

  if (file.value && file.value.type.startsWith("image/")) {
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      imageUrl.value = e.target?.result as string;
    };
    reader.readAsDataURL(file.value);
  } else {
    imageUrl.value = null;
  }
};

// Upload file to API
const uploadFile = async () => {
  if (!file.value) return;

  uploading.value = true;
  documentStore.uploadFile(file.value).then((res) => {
    selectedItem.value.documentDto = res;
  });
  uploading.value = false;
};

// Watch for file changes to reset preview
watch(file, (newFile) => {
  if (!newFile) imageUrl.value = null;
});

function parseDate(dateString: String) {
  if (!dateString || dateString == "") return null;
  const [day, month, year] = dateString.split("-");
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
}
</script>

<style>
i {
  font-size: 24px; /* Adjust size */
  color: #1976d2; /* Vue green */
}
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
