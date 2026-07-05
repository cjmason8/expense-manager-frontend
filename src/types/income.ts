import type { Document } from './document'
import type { RefData } from './refData'

export class Income {
  id?: number
  transactionType?: RefData
  amount?: number
  dueDateString: string = ''
  recurringType?: RefData
  startDateString: string = ''
  endDateString: string = ''
  notes: string = ''
  documentDto?: Document
  metaDataChunk?: string = ''

  constructor() {
  }
}
