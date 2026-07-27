export class Document {
  id: string | number = ''
  fileName: string = ''
  originalFileName: string = ''
  isFolder: boolean = false
  isArchived: boolean = false
  folderPath: string = ''
  metaDataChunk?: string = ''

  constructor() {
  }
}
