import axios from 'axios'
import type { Document } from '@/types/document'
import type { Income } from '@/types/income'
import type { RefData } from '@/types/refData'

interface IncomeSearchParams {
  transactionType?: RefData
  keyWords?: string
  startDateString?: string
  endDateString?: string
  metaDataChunk?: string
}

interface IncomeSearchResult {
  incomes: Income[]
  documents: Document[]
  incomeGraphDto?: unknown
}

export const useIncomesStore = defineStore('incomes', () => {
  const deleteIncome = async (income: Income) => {
    try {
      const config = {
        headers: {},
      }

      const response = await axios.delete(`/incomes/${income.id}`, config)

      console.log('Response:', response.data)
    }
    catch (error) {
      console.error('Error:', error)
    }
  }

  const updateIncome = async (income: Income) => {
    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      }

      console.log(`request data:${JSON.stringify(income)}`)

      const response = await axios.put(
        `/incomes/${income.id}`,
        JSON.stringify(income),
        config,
      )

      console.log('Response:', response.data)
    }
    catch (error) {
      console.error('Error:', error)
    }
  }

  const addIncome = async (income: Income) => {
    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      }

      console.log(JSON.stringify(income))

      const response = await axios.post(
        '/incomes',
        JSON.stringify(income),
        config,
      )

      console.log('Response:', response.data)
    }
    catch (error) {
      console.error('Error:', error)
    }
  }

  const searchIncomes = async (searchParams: IncomeSearchParams) => {
    const response = await axios.post<IncomeSearchResult>(
      '/search/incomes',
      searchParams,
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      },
    )

    return response.data
  }

  return {
    addIncome,
    updateIncome,
    deleteIncome,
    searchIncomes,
  }
})
