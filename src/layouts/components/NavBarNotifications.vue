<script lang="ts" setup>
import { useRoute } from 'vue-router'
import { useNotificationsStore } from '@/stores/notificationsStore'
import type { Notification } from '@/types/notification'

const notificationStore = useNotificationsStore()
const route = useRoute()

const refreshNotifications = () => {
  if (notificationStore.loading)
    return

  notificationStore.getNotifications()
}

refreshNotifications()

watch(() => route.fullPath, () => {
  refreshNotifications()
})

const onVisibilityChange = () => {
  if (document.visibilityState === 'visible')
    refreshNotifications()
}

onMounted(() => {
  document.addEventListener('visibilitychange', onVisibilityChange)
})

onUnmounted(() => {
  document.removeEventListener('visibilitychange', onVisibilityChange)
})

const removeNotification = (notificationId: number) => {
  notificationStore.notifications.forEach((item, index) => {
    if (notificationId === item.id) {
      notificationStore.notifications.splice(index, 1)
      notificationStore.markRemoved(item.id)
    }
  })
}

const markRead = (notificationId: number[]) => {
  notificationStore.notifications.forEach(item => {
    notificationId.forEach(id => {
      if (id === item.id) {
        item.read = true
        notificationStore.markRead(item.id)
      }
    })
  })
}

const markUnRead = (notificationId: number[]) => {
  notificationStore.notifications.forEach(item => {
    notificationId.forEach(id => {
      if (id === item.id) {
        item.read = false
        notificationStore.markUnRead(item.id)
      }
    })
  })
}

const handleNotificationClick = (notification: Notification) => {
  if (!notification.read)
    markRead([notification.id])
  else
    markUnRead([notification.id])
}
</script>

<template>
  <Notifications
    :notifications="notificationStore.unreadNotifications"
    @remove="removeNotification"
    @read="markRead"
    @unread="markUnRead"
    @click:notification="handleNotificationClick"
  />
</template>
