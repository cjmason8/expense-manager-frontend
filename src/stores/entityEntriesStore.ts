import axios from 'axios'

import { apiFetch } from '@/utils/apiFetch'
import type { EntityEntry, EntityType } from '@/types/entityEntry'

const jsonHeaders = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
}

export const useEntityEntriesStore = defineStore('entityEntries', () => {
  const getEntityEntries = async (type?: EntityType, includeArchived = false) => {
    const params = new URLSearchParams()
    if (type)
      params.set('type', type)
    if (includeArchived)
      params.set('includeArchived', 'true')

    const query = params.toString()
    const url = query ? `/entities?${query}` : '/entities'
    const response = await apiFetch(url, { cache: 'no-store' })

    if (!response.ok)
      throw new Error(`Failed to load entities (${response.status})`)

    return await response.json() as EntityEntry[]
  }

  const getEntityEntry = async (id: number) => {
    const response = await apiFetch(`/entities/${id}`, { cache: 'no-store' })

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
