import axios from 'axios'
import type { Donation } from '@/types/donation'

export const useDonationsStore = defineStore('donations', () => {
  const getDonations = async () => {
    const response = await fetch('/api/donations')

    return await response.json()
  }

  const updateDonation = async (donation: Donation) => {
    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      }

      console.log(`request data:${JSON.stringify(donation)}`)

      const response = await axios.put(
        `/api/donations/${donation.id}`,
        JSON.stringify(donation),
        config,
      )

      console.log('Response:', response.data)
    }
    catch (error) {
      console.error('Error:', error)
    }
  }

  const addDonation = async (donation: Donation) => {
    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      }

      console.log(JSON.stringify(donation))

      const response = await axios.post(
        '/api/donations',
        JSON.stringify(donation),
        config,
      )

      console.log('Response:', response.data)
    }
    catch (error) {
      console.error('Error:', error)
    }
  }

  const deleteDonation = async (donation: Donation) => {
    try {
      const config = {
        headers: {},
      }

      const response = await axios.delete(
        `/api/donations/${donation.id}`,
        config,
      )

      console.log('Response:', response.data)
    }
    catch (error) {
      console.error('Error:', error)
    }
  }

  return {
    getDonations,
    updateDonation,
    deleteDonation,
    addDonation,
  }
})
