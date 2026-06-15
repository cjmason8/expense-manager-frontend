import { useDocumentStore } from '@/stores/documentStore'
import type { Document } from '@/types/document'

const downloadingIds = ref<Set<string | number>>(new Set())

export function useDocumentDownload() {
  const documentStore = useDocumentStore()

  const isDownloading = (id?: string | number) => {
    if (id == null || id === '')
      return false

    return downloadingIds.value.has(id)
  }

  const viewDocumentation = async (document?: Document | null) => {
    if (!document?.id || !document.fileName)
      return

    const { id, fileName } = document
    if (downloadingIds.value.has(id))
      return

    downloadingIds.value = new Set(downloadingIds.value).add(id)
    try {
      const blob = await documentStore.getFileById(id, fileName)
      const fileURL = URL.createObjectURL(blob)

      window.open(fileURL)
    }
    catch (error) {
      console.error('Error downloading document:', error)
    }
    finally {
      const next = new Set(downloadingIds.value)

      next.delete(id)
      downloadingIds.value = next
    }
  }

  return {
    isDownloading,
    viewDocumentation,
  }
}
