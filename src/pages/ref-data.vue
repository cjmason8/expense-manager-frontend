<template>
  <VCard title="Filter" max-width="700px">
    <VCardText>
      <VRow>
        <VCol cols="6" sm="3">
          <label for="filterTypeId">Type</label>
        </VCol>
        <VCol cols="12" sm="6">
          <VSelect
            v-model="filterTypeId"
            :items="types"
            item-title="value"
            item-value="id"
            placeholder="Select..."
          />
        </VCol>
      </VRow>
      <VRow>
        <vSpacer></vSpacer>
        <vBtn color="primary" @click="filter()" style="margin-right: 10px"
          >Filter</vBtn
        >
        <vBtn color="primary" @click="clear()">Clear</vBtn>
      </VRow>
    </VCardText>
  </VCard>
  <vCardTitle>
    <vSpacer></vSpacer>
    <vBtn color="primary" @click="addRefData()">Add Ref Data</vBtn>
  </vCardTitle>
  <VDataTable
    :headers="headers"
    :items="refData"
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
              <IconBtn size="small" @click="editItem(item)">
                <VIcon icon="ri-pencil-line" />
              </IconBtn>
            </td>
            <td style="min-width: 35px">
              <IconBtn size="small" @click="deleteItem(item)">
                <VIcon icon="ri-delete-bin-line" />
              </IconBtn>
            </td>
          </tr>
        </table>
      </div>
    </template>
  </VDataTable>

  <!-- 👉 Add/Edit Dialog  -->
  <VDialog v-model="addEditDialog" max-width="900px">
    <VCard :title="dialogTitle">
      <VCardText>
        <VRow>
          <VCol cols="6" sm="3">
            <label for="selectedItem.type">Type</label>
          </VCol>
          <VCol cols="12" sm="6">
            <VSelect
              v-model="selectedItem.type"
              :items="types"
              item-title="value"
              item-value="id"
              placeholder="Select..."
            />
          </VCol>
        </VRow>
        <VRow>
          <VCol cols="6" sm="3">
            <label for="selectedItem.description">Description</label>
          </VCol>
          <VCol cols="18" sm="9">
            <VTextField v-model="selectedItem.description" />
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

  <!-- Delete Confirmation Dialog -->
  <VDialog v-model="deleteDialog" max-width="400px">
    <VCard>
      <VCardTitle>Confirm Deletion</VCardTitle>
      <VCardText>
        Are you sure you want to delete
        <strong>{{ selectedItem.description }}</strong
        >?
      </VCardText>
      <VCardActions>
        <VBtn color="blue darken-1" @click="deleteDialog = false">Cancel</VBtn>
        <VBtn color="red darken-1" @click="deleteItemConfirm">Delete</VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<script setup lang="ts">
import { useRefDataStore } from "@/stores/refDataStore";
import { RefData } from "@/types/refData";
import { ref } from "vue";
import { VCardActions, VCardText } from "vuetify/components";

let selectedDate = new Date();

const addEditDialog = ref(false);
const deleteDialog = ref(false);

const refDataStore = useRefDataStore();
refDataStore.getRefData();

const defaultItem = ref<RefData>({
  value: "",
  type: "",
  typeDescription: "",
  description: "",
  metaDataChunk: "",
  deleted: false,
});

const selectedItem = ref<RefData>(defaultItem.value);
let dialogTitle = ref<string>();
const editedIndex = ref(-1);
const refData = ref<RefData[]>([]);

const headers = [
  { title: "ID", key: "id" },
  { title: "NAME", key: "description" },
  { title: "TYPE", key: "typeDescription" },
  { title: "ACTIONS", key: "actions" },
];

let filterTypeId = ref<string | null>();

const types = [
  { id: "CAUSE", value: "Cause" },
  { id: "EXPENSE_TYPE", value: "Expense Type" },
  { id: "INCOME_TYPE", value: "Income Type" },
  { id: "RECURRING_TYPE", value: "Recurring Type" },
];

const addRefData = () => {
  addEditDialog.value = true;
  dialogTitle.value = "Add Ref Data";
};

const filter = () => {
  refData.value = refData.value.filter(
    (refData) => refData.type == filterTypeId.value
  );
};

const clear = () => {
  refData.value = JSON.parse(
    JSON.stringify(refDataStore.refData.filter((ref) => !ref.deleted))
  );
  filterTypeId.value = null;
};

const editItem = (item: RefData) => {
  editedIndex.value = refData.value.indexOf(item);
  selectedItem.value = { ...item };
  addEditDialog.value = true;
  dialogTitle.value = "Edit Ref Data";
};

const deleteItem = (item: RefData) => {
  editedIndex.value = refData.value.indexOf(item);
  selectedItem.value = { ...item };
  deleteDialog.value = true;
};

const closeAddEdit = () => {
  addEditDialog.value = false;
  editedIndex.value = -1;
  selectedItem.value = { ...defaultItem.value };
  selectedDate = new Date();
};

const closeDelete = () => {
  deleteDialog.value = false;
  editedIndex.value = -1;
  selectedItem.value = { ...defaultItem.value };
};

const saveAddEdit = () => {
  const result = types.find((type) => type.id == selectedItem.value.type);
  if (result) {
    selectedItem.value.typeDescription = result.value;
  }
  if (dialogTitle.value?.indexOf("Edit") != -1) {
    if (editedIndex.value > -1) {
      Object.assign(refData.value[editedIndex.value], selectedItem.value);

      refDataStore.updateRefData(selectedItem.value);
    } else {
      refData.value.push(selectedItem.value);
    }
  } else {
    refDataStore.addRefData(selectedItem.value).then((res) => {
      refData.value.push(res);
    });
  }

  closeAddEdit();
};

const deleteItemConfirm = () => {
  refData.value.splice(editedIndex.value, 1);
  refDataStore.deleteRefData(selectedItem.value);
  closeDelete();
};

onMounted(() => {
  refData.value = JSON.parse(
    JSON.stringify(refDataStore.refData.filter((ref) => !ref.deleted))
  );
});
</script>

<style></style>
