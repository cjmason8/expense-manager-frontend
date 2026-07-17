import type { MetadataKey } from './metadataKey'

export class MetadataValue {
  id?: number
  value: string = ''
  metadataKey?: MetadataKey

  constructor() {
  }
}
