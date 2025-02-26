<template>
  <table style="border-spacing: 30px" max-width="900px">
    <tr>
      <td></td>
      <td style="float: right">
        <table>
          <tr>
            <td width="50px">Include All</td>
            <td width="50px">
              <VCheckbox
                v-model="includeAll"
                @change="includeAllFilter"
              ></VCheckbox>
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
            :headers="headers"
            :items="expenseStore.homeInfo?.incomes"
            :items-per-page="20"
            class="text-no-wrap"
          >
            <template #item.id="{ item }">
              <span class="text-h6">{{ item.id }}</span>
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
              <VCheckbox v-model="item.paid" dense hide-details></VCheckbox>
            </template>
          </VDataTable>
        </VCard>
      </td>
    </tr>
  </table>
</template>

<script setup lang="ts">
import { useExpensesStore } from "@/stores/expensesStore";
import { VCardTitle, VCheckbox } from "vuetify/components";

const includeAllFilter = () => {
  expenseStore.getRecurring(includeAll.value);
  console.log(includeAll);
};

let includeAll = ref(false);

const expenseStore = useExpensesStore();
expenseStore.getRecurring(false);

const headers = [
  { title: "NAME", key: "transactionType.description" },
  { title: "AMOUNT", key: "amount" },
  { title: "NOTES", key: "notes" },
  { title: "RECURRING TYPE", key: "recurringType.description" },
  { title: "START DATE", key: "startDateString" },
  { title: "END DATE", key: "endDateString" },
];
</script>

<style>
i {
  font-size: 24px; /* Adjust size */
  color: #1976d2; /* Vue green */
}
</style>
