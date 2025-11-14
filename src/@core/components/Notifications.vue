<script lang="ts" setup>
import type { Notification } from "@/types/notification"
import { useRouter } from "vue-router"
import { PerfectScrollbar } from "vue3-perfect-scrollbar"

interface Props {
  notifications: Notification[];
  badgeProps?: object;
  location?: any;
}

interface Emit {
  (e: "read", value: number[]): void;

  (e: "unread", value: number[]): void;

  (e: "remove", value: number): void;

  (e: "click:notification", value: Notification): void;
}

const props = withDefaults(defineProps<Props>(), {
  location: "bottom end",
  badgeProps: undefined,
})

const onMenuOpen = ref(true)
const router = useRouter()

const emit = defineEmits<Emit>()

const isAllMarkRead = computed(() => {
  return props.notifications.some((item) => item.read === false)
})

const markAllReadOrUnread = () => {
  const allNotificationsIds = props.notifications.map((item) => item.id)

  if (!isAllMarkRead.value) {
    emit("unread", allNotificationsIds)
  } else {
    emit("read", allNotificationsIds)
  }
}

const handleClick = (notification: Notification) => {
  emit("click:notification", notification)
}

const handleAvatarClick = (notification: Notification) => {
  if (notification.expense != null) {
    onMenuOpen.value = false
    router.push(`/home/${notification.expense.dueDateString}`)
  }
}

const totalUnreadNotifications = computed(
  () => props.notifications.filter((item) => !item.read).length,
)
</script>

<template>
  <IconBtn id="notification-btn">
    <VBadge
      dot
      v-bind="props.badgeProps"
      :model-value="props.notifications.some((n) => !n.read)"
      color="error"
      bordered
      offset-x="1"
      offset-y="1"
    >
      <VIcon icon="ri-notification-2-line"/>
    </VBadge>

    <VMenu
      activator="parent"
      width="380"
      :location="props.location"
      offset="15px"
      v-model:open="onMenuOpen"
      :close-on-content-click="false"
    >
      <VCard class="d-flex flex-column">
        <!-- 👉 Header -->
        <VCardItem class="notification-section">
          <h5 class="text-h5 text-truncate">Notifications</h5>

          <template #append>
            <VChip
              v-show="!!isAllMarkRead"
              size="small"
              class="me-3"
              variant="tonal"
              color="primary"
            >
              {{ totalUnreadNotifications }} new
            </VChip>

            <IconBtn
              v-show="props.notifications.length"
              @click="markAllReadOrUnread"
            >
              <VIcon
                color="high-emphasis"
                :icon="!isAllMarkRead ? 'ri-mail-line' : 'ri-mail-open-line'"
              />

              <VTooltip activator="parent" location="start">
                {{ !isAllMarkRead ? "Mark all as unread" : "Mark all as read" }}
              </VTooltip>
            </IconBtn>
          </template>
        </VCardItem>

        <VDivider/>

        <!-- 👉 Notifications list -->
        <PerfectScrollbar
          :options="{ wheelPropagation: false }"
          style="max-block-size: 27rem"
        >
          <VList class="py-0">
            <template
              v-for="(notification, index) in props.notifications"
              :key="notification.title"
            >
              <VDivider v-if="index > 0"/>
              <VListItem
                link
                lines="one"
                min-height="66px"
                class="list-item-hover-class py-3"
                @click="handleClick(notification)"
              >
                <!-- Slot: Prepend -->
                <!-- Handles Avatar: Image, Icon, Text -->
                <div class="d-flex align-start gap-3">
                  <div>
                    <VAvatar
                      :color="notification.color"
                      :variant="'tonal'"
                      @click.stop="handleAvatarClick(notification)"
                    >
                      <span v-if="notification.text != ''">{{
                          avatarText(notification.text)
                        }}</span>
                      <!--VImg
                        v-if="notification.img"
                        :src="notification.img"
                      /-->
                      <VIcon
                        v-if="notification.icon"
                        :icon="notification.icon"
                      />
                    </VAvatar>
                  </div>

                  <div>
                    <h6 class="text-h6 mb-1">{{ notification.title }}</h6>
                    <p
                      class="text-body-2 mb-2"
                      style="
                        letter-spacing: 0.4px !important;
                        line-height: 18px;
                      "
                    >
                      {{ notification.subTitle }}
                    </p>
                    <p
                      class="text-sm text-disabled mb-0"
                      style="
                        letter-spacing: 0.4px !important;
                        line-height: 18px;
                      "
                    >
                      {{ notification.createdDateString }}
                    </p>
                  </div>

                  <VSpacer/>

                  <div class="d-flex flex-column align-end gap-2">
                    <VIcon
                      :color="!notification.read ? 'primary' : '#a8aaae'"
                      :class="`${
                        notification.read ? 'visible-in-hover' : ''
                      } ms-1`"
                      size="10"
                      icon="ri-circle-fill"
                      @click.stop="
                        $emit(notification.read ? 'unread' : 'read', [
                          notification.id,
                        ])
                      "
                    />

                    <div style="block-size: 20px; inline-size: 20px">
                      <VIcon
                        size="20"
                        icon="ri-close-line"
                        color="secondary"
                        class="visible-in-hover"
                        @click="$emit('remove', notification.id)"
                      />
                    </div>
                  </div>
                </div>
              </VListItem>
            </template>

            <VListItem
              v-show="!props.notifications.length"
              class="text-center text-medium-emphasis"
              style="block-size: 56px"
            >
              <VListItemTitle>No Notification Found!</VListItemTitle>
            </VListItem>
          </VList>
        </PerfectScrollbar>

        <VDivider/>

        <!-- 👉 Footer -->
        <VCardText v-show="props.notifications.length" class="pa-4">
          <VBtn block size="small"> View All Notifications</VBtn>
        </VCardText>
      </VCard>
    </VMenu>
  </IconBtn>
</template>

<style lang="scss">
.notification-section {
  padding: 14px !important;
}

.list-item-hover-class {
  .visible-in-hover {
    display: none;
  }

  &:hover {
    .visible-in-hover {
      display: block;
    }
  }
}
</style>
