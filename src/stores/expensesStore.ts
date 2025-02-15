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

  return {
    homeInfo,
    getTransactionsForWeek,
  };
});
