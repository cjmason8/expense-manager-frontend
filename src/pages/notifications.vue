<template>
  <VDataTable
    :headers="headers"
    :items="notificationsStore.notifications"
    :items-per-page="10"
    class="text-no-wrap"
  >
    <template #item.read="{ item }">
      <VCheckbox v-model="item.read" @change="markRead(item)"></VCheckbox>
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
          </tr>
        </table>
      </div>
    </template>
  </VDataTable>
</template>

<script setup lang="ts">
import { useNotificationsStore } from "@/stores/notificationsStore";
import { useRefDataStore } from "@/stores/refDataStore";
//import { Expense } from "@/types/expense";
import { Notification } from "@/types/notification";
import { ref } from "vue";

const editDialog = ref(false);

const notificationsStore = useNotificationsStore();
notificationsStore.getNotifications();

const refDataStore = useRefDataStore();
refDataStore.getRefData("expenseType");

// let transactionTypeId = ref<number>();

// const defaultItem = ref<Expense>();

//const selectedItem = ref<Expense>(defaultItem.value);

const headers = [
  { title: "EXPENSE", key: "expense.transactionType.description" },
  { title: "MESSAGE", key: "message" },
  { title: "DUE DATE", key: "expense.dueDateString" },
  { title: "CREATED", key: "createdDateString" },
  { title: "AMOUNT", key: "expense.amount" },
  { title: "MARK READ", key: "read" },
  { title: "ACTIONS", key: "actions" },
];

const markRead = (item: Notification) => {
  if (item.read) {
    notificationsStore.markRead(item.id);
  } else {
    notificationsStore.markUnRead(item.id);
  }
};

const editItem = (item: Notification) => {
  // editedIndex.value = donations.value.indexOf(item);
  // selectedItem.value = { ...item };
  // selectedDate = parseDate(selectedItem.value.dueDateString);
  // causeId.value = selectedItem.value.cause?.id;
  // addEditDialog.value = true;
  // dialogTitle.value = "Edit Donation";
};

// const closeAddEdit = () => {
//   addEditDialog.value = false;
//   editedIndex.value = -1;
//   selectedItem.value = { ...defaultItem.value };
//   selectedDate = new Date();
//   causeId.value = -1;
// };

// const saveAddEdit = () => {
//   selectedItem.value.dueDateString = format(selectedDate, "dd-MM-yyyy");
//   selectedItem.value.cause = refDataStore.refData.find(
//     (refData) => refData.id == causeId.value
//   );
//   if (dialogTitle.value?.indexOf("Edit") != -1) {
//     if (editedIndex.value > -1) {
//       Object.assign(donations.value[editedIndex.value], selectedItem.value);

//       donationsStore.updateDonation(selectedItem.value);
//     } else {
//       donations.value.push(selectedItem.value);
//     }
//   } else {
//     console.log("Response3:", selectedItem.value);
//     donations.value.push(selectedItem.value);
//     donationsStore.addDonation(selectedItem.value);
//   }

//   closeAddEdit();
// };
</script>

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
