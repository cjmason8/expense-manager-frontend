import axios from 'axios'
import type { Income } from '@/types/income'

export const useIncomesStore = defineStore('incomes', () => {
  const deleteIncome = async (income: Income) => {
    try {
      const config = {
        headers: {},
      }

      const response = await axios.delete(`/api/incomes/${income.id}`, config)

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
        `/api/expenses/${income.id}`,
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
        '/api/incomes',
        JSON.stringify(income),
        config,
      )

      console.log('Response:', response.data)
    }
    catch (error) {
      console.error('Error:', error)
    }
  }

  return {
    addIncome,
    updateIncome,
    deleteIncome,
  }
})
