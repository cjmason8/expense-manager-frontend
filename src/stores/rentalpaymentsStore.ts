import axios from 'axios'

import { apiFetch } from '@/utils/apiFetch'
import type { RefData } from '@/types/refData'
import type { RentalPayment } from '@/types/rentalPayment'
import { RentalPaymentYear } from '@/types/rentalPaymentYear'

export const useRentalPaymentStore = defineStore('rentalPayment', () => {
  const rentalPayments = ref<RentalPaymentYear>(new RentalPaymentYear())
  const types = ref<RefData[]>([])
  const rentalPayment = ref()

  const addRentalPayment = async (rentalpayment: RentalPayment) => {
    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      }

      console.log(JSON.stringify(rentalpayment))

      const response = await axios.post(
        '/rentalPayments',
        JSON.stringify(rentalpayment),
        config,
      )

      console.log('Response:', response.data)

      return response.data
    }
    catch (error) {
      console.error('Error:', error)
    }
  }

  const updateRentalPayment = async (rentalpayment: RentalPayment) => {
    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      }

      console.log(JSON.stringify(rentalpayment))

      const response = await axios.put(
        `/rentalPayments/${rentalpayment.id}`,
        JSON.stringify(rentalpayment),
        config,
      )

      console.log('Response:', response.data)

      return response.data
    }
    catch (error) {
      console.error('Error:', error)
    }
  }

  const deleteRentalPayment = async (payment: RentalPayment) => {
    try {
      const config = {
        headers: {},
      }

      const response = await axios.delete(
        `/rentalPayments/${payment.id}`,
        config,
      )

      console.log('Response:', response.data)
    }
    catch (error) {
      console.error('Error:', error)
    }
  }

  const getRentalPayment = async (id: number) => {
    const url = `/rentalPayments/${id}`

    const response = await apiFetch(url)

    rentalPayment.value = await response.json()
  }

  const getRentalPayments = async (year?: number) => {
    if (year !== undefined && year !== null) {
      const response1 = await apiFetch(
        `/rentalPayments/getByProperty/WODONGA/${year}`,
      )

      const tmp1 = await response1.json()

      rentalPayments.value.wodongaRentalPayments = tmp1.rentalPayments

      const response2 = await apiFetch(
        `/rentalPayments/getByProperty/STH_KINGSVILLE/${year}`,
      )

      const tmp2 = await response2.json()

      rentalPayments.value.sthKingsvilleRentalPayments = tmp2.rentalPayments
      rentalPayments.value.nextYear = tmp2.nextYear
      rentalPayments.value.previousYear = tmp2.previousYear
    }
    else {
      const response1 = await apiFetch(
        '/rentalPayments/getByProperty/WODONGA',
      )

      const tmp1 = await response1.json()

      rentalPayments.value.wodongaRentalPayments = tmp1.rentalPayments

      const response2 = await apiFetch(
        '/rentalPayments/getByProperty/STH_KINGSVILLE',
      )

      const tmp2 = await response2.json()

      rentalPayments.value.sthKingsvilleRentalPayments = tmp2.rentalPayments
      rentalPayments.value.nextYear = tmp2.nextYear
      rentalPayments.value.previousYear = tmp2.previousYear
    }
  }

  const getTypes = async (type: string) => {
    const response = await apiFetch(`/rentalPayments/type/${type}`)

    types.value = await response.json()
  }

  return {
    rentalPayments,
    addRentalPayment,
    updateRentalPayment,
    deleteRentalPayment,
    getRentalPayments,
    getTypes,
    getRentalPayment,
  }
})
