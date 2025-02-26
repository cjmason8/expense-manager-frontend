import { HomeInfo } from "@/types/homeInfo";

export const useExpensesStore = defineStore("expenses", () => {
  const homeInfo = ref<HomeInfo>();

  const getTransactionsForWeek = async (week?: string) => {
    let url = "/api/week";
    if (week) {
      url += "/" + week;
    }
    const response = await fetch(url);
    homeInfo.value = await response.json();
  };

  const getRecurring = async (includeAll: boolean) => {
    let url = "/api/recurring/active";
    if (includeAll) {
      url = "/api/recurring/all";
    }
    const response = await fetch(url);
    homeInfo.value = await response.json();
  };

  const payExpense = async (id?: number) => {
    if (id) {
      let reqUrl = "/api/expenses/pay/" + id;
      const response = await fetch(reqUrl);
    }
  };

  const unPayExpense = async (id?: number) => {
    if (id) {
      let reqUrl = "/api/expenses/unpay/" + id;
      const response = await fetch(reqUrl);
    }
  };

  return {
    payExpense,
    unPayExpense,
    homeInfo,
    getTransactionsForWeek,
    getRecurring,
  };
});
