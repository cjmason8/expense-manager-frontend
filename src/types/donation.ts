import { Document } from "@/types/document";
import { RefData } from "@/types/refData";

export class Donation {
  id?: number;
  cause?: RefData;
  amount: number = -1;
  dueDateString: string = "";
  description: string = "";
  notes: string = "";
  documentDto?: Document;
  metaDataChunk: string = "";

  constructor() {}
}
