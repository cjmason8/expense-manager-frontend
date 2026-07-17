import axios from 'axios'

import { apiFetch } from '@/utils/apiFetch'
import type { MetadataKey } from '@/types/metadataKey'
import type { MetadataValue } from '@/types/metadataValue'

export const useMetadataValuesStore = defineStore('metadataValues', () => {
  /** Values keyed by metadata key id */
  const valuesByKeyId = ref<Record<number, MetadataValue[]>>({})

  const getMetadataValuesByKey = async (metadataKeyId: number) => {
    const response = await apiFetch(`/metadataValues/key/${metadataKeyId}`)
    const values = await response.json() as MetadataValue[]

    valuesByKeyId.value = {
      ...valuesByKeyId.value,
      [metadataKeyId]: values,
    }

    return values
  }

  const ensureValuesForKey = async (metadataKeyId: number) => {
    if (valuesByKeyId.value[metadataKeyId])
      return valuesByKeyId.value[metadataKeyId]

    return getMetadataValuesByKey(metadataKeyId)
  }

  const valuesForKey = (metadataKeyId?: number | null) => {
    if (metadataKeyId == null)
      return []

    return valuesByKeyId.value[metadataKeyId] ?? []
  }

  const addMetadataValue = async (value: string, metadataKey: MetadataKey) => {
    if (metadataKey.id == null)
      return

    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      }

      const response = await axios.post(
        '/metadataValues',
        JSON.stringify({
          value,
          metadataKey: { id: metadataKey.id, name: metadataKey.name },
        }),
        config,
      )

      const created = response.data as MetadataValue
      const keyId = metadataKey.id
      const existing = valuesByKeyId.value[keyId] ?? []

      valuesByKeyId.value = {
        ...valuesByKeyId.value,
        [keyId]: [...existing, created].sort((a, b) => a.value.localeCompare(b.value)),
      }

      return created
    }
    catch (error) {
      console.error('Error:', error)
    }
  }

  const updateMetadataValue = async (metadataValue: MetadataValue) => {
    if (metadataValue.id == null)
      return

    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      }

      const response = await axios.put(
        `/metadataValues/${metadataValue.id}`,
        JSON.stringify(metadataValue),
        config,
      )

      const updated = response.data as MetadataValue
      const keyId = updated.metadataKey?.id

      if (keyId != null && valuesByKeyId.value[keyId]) {
        valuesByKeyId.value = {
          ...valuesByKeyId.value,
          [keyId]: valuesByKeyId.value[keyId]
            .map(item => item.id === updated.id ? updated : item)
            .sort((a, b) => a.value.localeCompare(b.value)),
        }
      }

      return updated
    }
    catch (error) {
      console.error('Error:', error)
    }
  }

  const deleteMetadataValue = async (id?: number, metadataKeyId?: number) => {
    if (id == null)
      return

    try {
      await axios.delete(`/metadataValues/${id}`)

      if (metadataKeyId != null && valuesByKeyId.value[metadataKeyId]) {
        valuesByKeyId.value = {
          ...valuesByKeyId.value,
          [metadataKeyId]: valuesByKeyId.value[metadataKeyId].filter(item => item.id !== id),
        }
      }
    }
    catch (error) {
      console.error('Error:', error)
    }
  }

  const clearValuesForKey = (metadataKeyId: number) => {
    const next = { ...valuesByKeyId.value }

    delete next[metadataKeyId]
    valuesByKeyId.value = next
  }

  return {
    valuesByKeyId,
    getMetadataValuesByKey,
    ensureValuesForKey,
    valuesForKey,
    addMetadataValue,
    updateMetadataValue,
    deleteMetadataValue,
    clearValuesForKey,
  }
})
