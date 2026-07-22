import { apiFetch } from '@/utils/apiFetch'
import type { Notification } from '@/types/notification'

export const useNotificationsStore = defineStore('notifications', () => {
  const notifications = ref<Notification[]>([])
  const loading = ref(false)

  const unreadNotifications = computed(() =>
    notifications.value.filter(notification => !notification.read && !notification.removed),
  )

  function decorateNotifications(list: Notification[]) {
    list.forEach(notification => {
      if (
        notification.expense != null
        && notification.expense.transactionType != null
      ) {
        notification.title = notification.expense.transactionType?.description
        notification.text = 'Expense'
        notification.color = 'primary'
      }
      else if (
        notification.message.startsWith('Unhandled Email with title - ')
        || notification.message.startsWith('Unhandled Email: ')
      ) {
        notification.title = 'Unhandled Email'
        notification.icon = 'ri-mail-line'
        notification.color = 'error'
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

    return list
  }

  const fetchNotifications = async (includeRemoved = false) => {
    loading.value = true
    try {
      const response = await apiFetch(
        includeRemoved ? '/notifications?includeRemoved=true' : '/notifications',
      )

      return decorateNotifications(await response.json())
    }
    finally {
      loading.value = false
    }
  }

  const getNotifications = async (includeRemoved = false) => {
    const data = await fetchNotifications(includeRemoved)

    if (!includeRemoved)
      notifications.value = data

    return data
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
    unreadNotifications,
    loading,
    fetchNotifications,
    getNotifications,
    markRead,
    markUnRead,
    markRemoved,
  }
})
