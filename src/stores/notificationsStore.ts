import { apiFetch } from '@/utils/apiFetch'
import type { Notification } from '@/types/notification'

export const useNotificationsStore = defineStore('notifications', () => {
  const notifications = ref<Notification[]>([])

  const getNotifications = async () => {
    const response = await apiFetch('/notifications')

    notifications.value = await response.json()
    notifications.value.forEach(notification => {
      if (
        notification.expense != null
        && notification.expense.transactionType != null
      ) {
        notification.title = notification.expense.transactionType?.description
        notification.text = 'Expense'
        notification.color = 'primary' // primary, info, success, error
      }
      else if (
        notification.message.startsWith('Unhandled Email with title - ')
        || notification.message.startsWith('Unhandled Email: ')
      ) {
        notification.title = 'Unhandled Email'
        notification.icon = 'ri-mail-line'
        notification.color = 'error' // primary, info, success, error
        notification.text = ''
      }
      else if (notification.message.startsWith('Uploaded ')) {
        notification.title = 'Email processed'
        notification.icon = 'ri-file-upload-line'
        notification.color = 'success'
        notification.text = ''
      }
      notification.subTitle = notification.message
        .replace('Unhandled Email with title - ', '')
        .replace('Unhandled Email: ', '')
    })
    console.log(JSON.stringify(notifications.value))
  }

  const markRead = async (id?: number) => {
    if (id) {
      const response = await apiFetch(`/notifications/markRead/${id}`)

      await response.json()
    }
  }

  const markRemoved = async (id?: number) => {
    if (id) {
      const response = await apiFetch(`/notifications/markRemoved/${id}`)

      await response.json()
    }
  }

  const markUnRead = async (id?: number) => {
    if (id) {
      const response = await apiFetch(`/notifications/markUnRead/${id}`)

      await response.json()
    }
  }

  return {
    notifications,
    getNotifications,
    markRead,
    markUnRead,
    markRemoved,
  }
})
