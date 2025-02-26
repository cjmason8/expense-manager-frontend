import { Document } from "./document";

export class RentalPayment {
  id?: number;
  totalRent: number = -1;
  adminFee: number = -1;
  managementFee: number = -1;
  otherFee: number = -1;
  statementFromString: string = "";
  statementToString: string = "";
  property: string = "";
  documentDto?: Document;

  constructor() {}
}
