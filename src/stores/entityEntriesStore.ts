import axios from 'axios'

import { apiFetch } from '@/utils/apiFetch'
import type { EntityEntry, EntityType } from '@/types/entityEntry'

const jsonHeaders = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
}

export const useEntityEntriesStore = defineStore('entityEntries', () => {
  const getEntityEntries = async (type?: EntityType) => {
    const url = type ? `/entities?type=${type}` : '/entities'
    const response = await apiFetch(url)

    if (!response.ok)
      throw new Error(`Failed to load entities (${response.status})`)

    return await response.json() as EntityEntry[]
  }

  const getEntityEntry = async (id: number) => {
    const response = await apiFetch(`/entities/${id}`)

    if (!response.ok)
      throw new Error(`Failed to load entity (${response.status})`)

    return await response.json() as EntityEntry
  }

  const addEntityEntry = async (entityEntry: EntityEntry) => {
    const response = await axios.post('/entities', entityEntry, {
      headers: jsonHeaders,
    })

    return response.data as EntityEntry
  }

  const updateEntityEntry = async (entityEntry: EntityEntry) => {
    const response = await axios.put(
      `/entities/${entityEntry.id}`,
      entityEntry,
      { headers: jsonHeaders },
    )

    return response.data as EntityEntry
  }

  const deleteEntityEntry = async (id: number) => {
    await axios.delete(`/entities/${id}`, {
      headers: jsonHeaders,
    })
  }

  return {
    getEntityEntries,
    getEntityEntry,
    addEntityEntry,
    updateEntityEntry,
    deleteEntityEntry,
  }
})
