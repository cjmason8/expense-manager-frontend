import { Expense } from "./expense";

export class Notification {
  id: number = -1;
  expense: Expense = new Expense();
  message: string = "";
  createdDateString: string = "";
  read: boolean = false;
  removed: boolean = false;
  title: string = "";
  text: string = "";
  subTitle: string = "";
  color: string = "";
  icon: string = "";

  constructor() {}
}
