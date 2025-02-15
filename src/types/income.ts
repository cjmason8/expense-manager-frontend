import { Document } from "./document";
import { RefData } from "./refData";

export class Income {
  id?: number;
  transactionType: RefData = new RefData();
  amount: number = -1;
  dueDateString: string = "";
  recurringType: RefData = new RefData();
  startDateString: string = "";
  endDateString: string = "";
  notes: string = "";
  documentDto: Document = new Document();
  metaDataChunk: string = "";

  constructor() {}
}
