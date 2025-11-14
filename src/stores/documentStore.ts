import axios from 'axios'
import type { Document } from '@/types/document'

export const useDocumentStore = defineStore('document', () => {
  const uploadFile = async (file: File, type?: string, path?: string) => {
    const formData = new FormData()

    formData.append('uploadFile', file)

    let url = `/api/documents/upload?type=${type}`
    if (path)
      url += `&path=${path}`

    try {
      const response = await axios.post(url, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      return response.data
    }
    catch (error) {
      console.error('Upload failed:', error)
    }
  }

  const deleteDocument = async (document: Document) => {
    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      }

      const response = await axios.delete(
        `/api/documents/${document.id}`,
        config,
      )

      console.log('Response:', response.data)

      return response.data
    }
    catch (error) {
      console.error('Error:', error)
    }
  }

  const archiveFolder = async (document: Document) => {
    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      }

      const response = await axios.get(
        `/api/documents/${document.id}/archive`,
        config,
      )

      console.log('Response:', response.data)
    }
    catch (error) {
      console.error('Error:', error)
    }
  }

  const getDocuments = async (folderPath: string, includeArchived: boolean) => {
    try {
      const response = await axios.post(
        '/api/documents/list',
        { folderPath, includeArchived },
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        },
      )

      return response.data
    }
    catch (error) {
      console.error('Upload failed:', error)
    }
  }

  const getFileById = async (id: number, fileName: string) => {
    const mediaType = getMediaType(fileName)

    const response = await axios.get(`/api/documents/get/${id}`, {
      responseType: 'arraybuffer',
      headers: { 'Content-Type': mediaType, 'Accept': mediaType },
    })

    return new Blob([response.data], { type: mediaType })
  }

  const updateDocument = async (document: Document) => {
    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      }

      console.log(`request data:${JSON.stringify(document)}`)

      const response = await axios.put(
        `/api/documents/${document.id}`,
        JSON.stringify(document),
        config,
      )

      console.log('Response:', response.data)

      return response.data
    }
    catch (error) {
      console.error('Error:', error)
    }
  }

  const addDocument = async (document: Document) => {
    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      }

      console.log(JSON.stringify(document))

      const response = await axios.post(
        '/api/documents',
        JSON.stringify(document),
        config,
      )

      console.log('Response:', response.data)

      return response.data
    }
    catch (error) {
      console.error('Error:', error)
    }
  }

  function getMediaType(fileName: string) {
    let mediaType = 'application/pdf'
    if (fileName.endsWith('doc') || fileName.endsWith('docx'))
      mediaType = 'application/msword'
    else if (fileName.endsWith('xls') || fileName.endsWith('xlsx'))
      mediaType = 'application/vnd.ms-excel'
    else if (fileName.endsWith('jpg') || fileName.endsWith('jpeg'))
      mediaType = 'image/jpeg'

    return mediaType
  }

  return {
    uploadFile,
    getFileById,
    getDocuments,
    deleteDocument,
    archiveFolder,
    updateDocument,
    addDocument,
  }
})
