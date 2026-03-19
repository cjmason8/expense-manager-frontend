import axios from 'axios'
import type { Expense } from '@/types/expense'
import type { HomeInfo } from '@/types/homeInfo'
import type { Document } from '@/types/document'
import type { RefData } from '@/types/refData'

interface ExpenseSearchParams {
  transactionType?: RefData
  keyWords?: string
  startDateString?: string
  endDateString?: string
  metaDataChunk?: string
}

interface ExpenseSearchResult {
  expenses: Expense[]
  documents: Document[]
  expenseGraphDto?: unknown
}

export const useExpensesStore = defineStore('expenses', () => {
  const homeInfo = ref<HomeInfo>()

  const getTransactionsForWeek = async (week?: string) => {
    let url = '/api/week'
    if (week)
      url += `/${week}`

    const response = await fetch(url)

    await response.json().then(res => {
      homeInfo.value = res
    })
  }

  const getRecurring = async (includeAll: boolean) => {
    let url = '/api/recurring/active'
    if (includeAll)
      url = '/api/recurring/all'

    const response = await fetch(url)

    homeInfo.value = await response.json()
  }

  const payExpense = async (id?: number) => {
    if (id) {
      const reqUrl = `/api/expenses/pay/${id}`

      await fetch(reqUrl)
    }
  }

  const unPayExpense = async (id?: number) => {
    if (id) {
      const reqUrl = `/api/expenses/unpay/${id}`

      await fetch(reqUrl)
    }
  }

  const deleteExpense = async (expense: Expense) => {
    try {
      const config = {
        headers: {},
      }

      const response = await axios.delete(
        `/api/expenses/${expense.id}`,
        config,
      )

      console.log('Response:', response.data)
    }
    catch (error) {
      console.error('Error:', error)
    }
  }

  const updateExpense = async (expense: Expense) => {
    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      }

      console.log(`request data:${JSON.stringify(expense)}`)

      const response = await axios.put(
        `/api/expenses/${expense.id}`,
        JSON.stringify(expense),
        config,
      )

      console.log('Response:', response.data)
    }
    catch (error) {
      console.error('Error:', error)
    }
  }

  const addExpense = async (expense: Expense) => {
    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      }

      console.log(JSON.stringify(expense))

      const response = await axios.post(
        '/api/expenses',
        JSON.stringify(expense),
        config,
      )

      console.log('Response:', response.data)
    }
    catch (error) {
      console.error('Error:', error)
    }
  }

  const searchExpenses = async (searchParams: ExpenseSearchParams) => {
    const response = await axios.post<ExpenseSearchResult>(
      '/api/search',
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
    addExpense,
    updateExpense,
    deleteExpense,
    payExpense,
    unPayExpense,
    homeInfo,
    getTransactionsForWeek,
    getRecurring,
    searchExpenses,
  }
})
