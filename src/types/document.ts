export class Document {
  id: number = -1
  fileName: string = ""
  originalFileName: string = ""
  isFolder: boolean = false
  folderPath: string = ""
  metaDataChunk?: string = ""

  constructor() {
  }
}
