import { RentalPayment } from "./rentalPayment"

export class RentalPaymentYear {
  wodongaRentalPayments: RentalPayment[] = []
  sthKingsvilleRentalPayments: RentalPayment[] = []
  previousYear?: number
  nextYear?: number

  constructor() {
  }
}
