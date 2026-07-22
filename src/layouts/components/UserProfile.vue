<script setup lang="ts">
import avatar1 from '@images/avatars/avatar-1.png'
import { useAuthStore } from '@/stores/authStore'

const router = useRouter()
const authStore = useAuthStore()

const displayName = computed(() => {
  const u = authStore.user?.trim()
  if (!u)
    return 'User'

  return u.charAt(0).toUpperCase() + u.slice(1)
})

const roleLabel = computed(() => {
  const r = authStore.roles?.trim()

  return r || '—'
})

async function handleLogout() {
  await authStore.logout()
  await router.push('/login')
}
</script>

<template>
  <VBadge
    dot
    bordered
    location="bottom right"
    offset-x="3"
    offset-y="3"
    color="success"
  >
    <VAvatar
      class="cursor-pointer"
      size="38"
    >
      <VImg :src="avatar1" />

      <!-- SECTION Menu -->
      <VMenu
        activator="parent"
        width="230"
        location="bottom end"
        offset="15px"
      >
        <VList>
          <!-- 👉 User Avatar & Name -->
          <VListItem>
            <template #prepend>
              <VListItemAction start>
                <VBadge
                  dot
                  location="bottom right"
                  offset-x="3"
                  offset-y="3"
                  color="success"
                >
                  <VAvatar
                    color="primary"
                    variant="tonal"
                  >
                    <VImg :src="avatar1" />
                  </VAvatar>
                </VBadge>
              </VListItemAction>
            </template>

            <h6 class="text-sm font-weight-medium">
              {{ displayName }}
            </h6>
            <VListItemSubtitle class="text-capitalize text-disabled">
              {{ roleLabel }}
            </VListItemSubtitle>
          </VListItem>

          <VDivider class="my-1" />

          <VListItem>
            <VBtn
              block
              color="error"
              append-icon="ri-logout-box-r-line"
              @click="handleLogout"
            >
              Logout
            </VBtn>
          </VListItem>
        </VList>
      </VMenu>
      <!-- !SECTION -->
    </VAvatar>
  </VBadge>
</template>
