import { Document } from "./document";
import { RefData } from "./refData";

export class Expense {
  id?: number;
  transactionType?: RefData;
  amount?: number;
  dueDateString: string = "";
  recurringType?: RefData;
  startDateString: string = "";
  endDateString: string = "";
  notes: string = "";
  documentDto?: Document = new Document();
  metaDataChunk?: string = "";
  paid: boolean = false;

  constructor() {}
}
