import type { Document } from './document'

export type EntityType = 'RECIPE' | 'NOTES'

export interface EntityEntry {
  id?: number
  name: string
  description: string
  type: EntityType
  documentDto?: Document
  metaDataChunk?: string
}
