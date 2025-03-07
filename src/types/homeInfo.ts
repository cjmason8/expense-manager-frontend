import { Expense } from "./expense";
import { Income } from "./income";

export class HomeInfo {
  expenses: Expense[] = [];
  unpaidExpenses?: Expense[] = [];
  incomes: Income[] = [];
  previousWeek: string = "";
  nextWeek: string = "";
  thisWeek: string = "";
  incomeTotal: string = "";
  expenseTotal: string = "";
  unpaidExpenseTotal: string = "";
  difference: string = "";
}
