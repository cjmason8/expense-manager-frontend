import axios from 'axios'
import type { RefData } from '@/types/refData'

export const useRefDataStore = defineStore('refData', () => {
  const refData = ref<RefData[]>([])

  const getRefData = async (type?: string) => {
    let url = '/refDatas'
    if (type)
      url = `/refDatas/type/${type}`

    const response = await fetch(url)

    return await response.json()
  }

  const updateRefData = async (newRefData: RefData) => {
    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      }

      console.log(`request data:${JSON.stringify(refData)}`)

      const response = await axios.put(
        `/refDatas/${newRefData.id}`,
        JSON.stringify(newRefData),
        config,
      )

      console.log('Response:', response.data)
    }
    catch (error) {
      console.error('Error:', error)
    }
  }

  const addRefData = async (newRefData: RefData) => {
    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      }

      console.log(JSON.stringify(newRefData))

      const response = await axios.post(
        '/refDatas',
        JSON.stringify(newRefData),
        config,
      )

      console.log('Response:', response.data)

      return response.data
    }
    catch (error) {
      console.error('Error:', error)
    }
  }

  const deleteRefData = async (refDataToDelete: RefData) => {
    try {
      const config = {
        headers: {},
      }

      const response = await axios.delete(
        `/refDatas/${refDataToDelete.id}`,
        config,
      )

      console.log('Response:', response.data)
    }
    catch (error) {
      console.error('Error:', error)
    }
  }

  return {
    refData,
    getRefData,
    addRefData,
    updateRefData,
    deleteRefData,
  }
})
