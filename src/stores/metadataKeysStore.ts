import axios from 'axios'

import { apiFetch } from '@/utils/apiFetch'
import type { MetadataKey } from '@/types/metadataKey'

export const useMetadataKeysStore = defineStore('metadataKeys', () => {
  const metadataKeys = ref<MetadataKey[]>([])

  const getMetadataKeys = async () => {
    const response = await apiFetch('/metadataKeys')
    const keys = await response.json() as MetadataKey[]

    metadataKeys.value = keys

    return keys
  }

  const addMetadataKey = async (name: string) => {
    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      }

      const response = await axios.post(
        '/metadataKeys',
        JSON.stringify({ name }),
        config,
      )

      const created = response.data as MetadataKey

      metadataKeys.value = [...metadataKeys.value, created].sort((a, b) =>
        a.name.localeCompare(b.name),
      )

      return created
    }
    catch (error) {
      console.error('Error:', error)
    }
  }

  const updateMetadataKey = async (metadataKey: MetadataKey) => {
    if (metadataKey.id == null)
      return

    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      }

      const response = await axios.put(
        `/metadataKeys/${metadataKey.id}`,
        JSON.stringify(metadataKey),
        config,
      )

      const updated = response.data as MetadataKey

      metadataKeys.value = metadataKeys.value
        .map(key => key.id === updated.id ? updated : key)
        .sort((a, b) => a.name.localeCompare(b.name))

      return updated
    }
    catch (error) {
      console.error('Error:', error)
    }
  }

  const deleteMetadataKey = async (id?: number) => {
    if (id == null)
      return

    try {
      await axios.delete(`/metadataKeys/${id}`)
      metadataKeys.value = metadataKeys.value.filter(key => key.id !== id)
    }
    catch (error) {
      console.error('Error:', error)
    }
  }

  return {
    metadataKeys,
    getMetadataKeys,
    addMetadataKey,
    updateMetadataKey,
    deleteMetadataKey,
  }
})
