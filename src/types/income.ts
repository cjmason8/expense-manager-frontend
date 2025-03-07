import { Document } from "./document";
import { RefData } from "./refData";

export class Income {
  id?: number;
  transactionType?: RefData;
  amount?: number;
  dueDateString: string = "";
  recurringType?: RefData;
  notes: string = "";
  documentDto?: Document;
  metaDataChunk?: string = "";

  constructor() {}
}
