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
                @date-select="
                  gotoWeek();
                  selectedDate = null;
                "
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
    <tr>
      <td></td>
      <td>
        <VCard>
          <VCardTitle>Unpaid Expenses</VCardTitle>
          <VDataTable
            :headers="headers"
            :items="expenseStore.homeInfo?.unpaidExpenses"
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
import { format } from "date-fns";
import DatePicker from "primevue/datepicker";
import { VCardTitle } from "vuetify/components";

const expenseStore = useExpensesStore();
expenseStore.getTransactionsForWeek();

let selectedDate: Date | null = null;

const headers = [
  { title: "NAME", key: "transactionType.description" },
  { title: "AMOUNT", key: "amount" },
  { title: "DUE DATE", key: "dueDateString" },
  { title: "PAID", key: "paid" },
  { title: "NOTES", key: "notes" },
];
const incomeHeaders = [
  { title: "NAME", key: "transactionType.description" },
  { title: "AMOUNT", key: "amount" },
  { title: "DUE DATE", key: "dueDateString" },
  { title: "NOTES", key: "notes" },
];

const prevWeek = () => {
  expenseStore.getTransactionsForWeek(expenseStore.homeInfo?.previousWeek);
};
const nextWeek = () => {
  expenseStore.getTransactionsForWeek(expenseStore.homeInfo?.nextWeek);
};
const gotoWeek = () => {
  expenseStore.getTransactionsForWeek(format(selectedDate, "dd-MM-yyyy"));
};
</script>

<style>
i {
  font-size: 24px; /* Adjust size */
  color: #1976d2; /* Vue green */
}
</style>
