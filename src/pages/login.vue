<script setup lang="ts">
import { VNodeRenderer } from '@layouts/components/VNodeRenderer'
import { themeConfig } from '@themeConfig'
import { useAuthStore } from '@/stores/authStore'

definePage({
  meta: {
    layout: 'blank',
    public: true,
  },
})

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const form = ref({
  userName: '',
  password: '',
  newPassword: '',
  confirmPassword: '',
})

const isPasswordVisible = ref(false)
const isNewPasswordVisible = ref(false)
const loading = ref(false)

onMounted(() => {
  void authStore.clearSessionForLoginPage()
})

async function navigateAfterLogin() {
  const raw = route.query.redirect
  const redirect = typeof raw === 'string' ? raw : null
  if (redirect && redirect.startsWith('/'))
    await router.push(redirect)
  else
    await router.push({ name: 'root' })
}

async function loginUser() {
  if (!form.value.userName || !form.value.password)
    return
  loading.value = true
  try {
    const ok = await authStore.login({
      userName: form.value.userName,
      password: form.value.password,
    })

    if (authStore.needsNewPassword)
      return

    if (!ok)
      return

    await navigateAfterLogin()
  }
  finally {
    loading.value = false
  }
}

async function setNewPassword() {
  if (!form.value.newPassword || form.value.newPassword !== form.value.confirmPassword) {
    authStore.loginError = 'Passwords do not match.'
    return
  }
  loading.value = true
  try {
    const ok = await authStore.confirmNewPassword(form.value.newPassword)
    if (!ok)
      return

    await navigateAfterLogin()
  }
  finally {
    loading.value = false
  }
}

function backToLogin() {
  authStore.cancelNewPassword()
  form.value.password = ''
  form.value.newPassword = ''
  form.value.confirmPassword = ''
}
</script>

<template>
  <div class="auth-logo d-flex align-center gap-x-3">
    <VNodeRenderer :nodes="themeConfig.app.logo" />
    <h1 class="auth-title">
      {{ themeConfig.app.title }}
    </h1>
  </div>

  <div class="auth-wrapper d-flex align-center justify-center">
    <VCard
      flat
      :max-width="500"
      width="100%"
      class="auth-login-card pa-4"
    >
      <VCardText>
        <VAlert
          v-if="authStore.loginError"
          type="error"
          variant="tonal"
          class="mb-4"
        >
          {{ authStore.loginError }}
        </VAlert>

        <VForm
          v-if="authStore.needsNewPassword"
          @submit.prevent="setNewPassword"
        >
          <p class="text-body-2 mb-4">
            First sign-in for <strong>{{ authStore.pendingUserName }}</strong> — choose a new password.
          </p>
          <VRow>
            <VCol cols="12">
              <VTextField
                v-model="form.newPassword"
                autofocus
                label="New password"
                autocomplete="new-password"
                :type="isNewPasswordVisible ? 'text' : 'password'"
                :append-inner-icon="isNewPasswordVisible ? 'ri-eye-off-line' : 'ri-eye-line'"
                :disabled="loading"
                @click:append-inner="isNewPasswordVisible = !isNewPasswordVisible"
              />
            </VCol>

            <VCol cols="12">
              <VTextField
                v-model="form.confirmPassword"
                label="Confirm new password"
                autocomplete="new-password"
                :type="isNewPasswordVisible ? 'text' : 'password'"
                :disabled="loading"
              />
            </VCol>

            <VCol cols="12">
              <VBtn
                block
                type="submit"
                :loading="loading"
                :disabled="!form.newPassword || !form.confirmPassword"
              >
                Set password and sign in
              </VBtn>
            </VCol>

            <VCol cols="12">
              <VBtn
                block
                variant="text"
                :disabled="loading"
                @click="backToLogin"
              >
                Back
              </VBtn>
            </VCol>
          </VRow>
        </VForm>

        <VForm
          v-else
          @submit.prevent="loginUser"
        >
          <VRow>
            <VCol cols="12">
              <VTextField
                v-model="form.userName"
                autofocus
                label="User name"
                autocomplete="username"
                :disabled="loading"
              />
            </VCol>

            <VCol cols="12">
              <VTextField
                v-model="form.password"
                label="Password"
                autocomplete="current-password"
                :type="isPasswordVisible ? 'text' : 'password'"
                :append-inner-icon="isPasswordVisible ? 'ri-eye-off-line' : 'ri-eye-line'"
                :disabled="loading"
                @click:append-inner="isPasswordVisible = !isPasswordVisible"
              />
            </VCol>

            <VCol cols="12">
              <VBtn
                block
                type="submit"
                :loading="loading"
                :disabled="!form.userName || !form.password"
              >
                Login
              </VBtn>
            </VCol>
          </VRow>
        </VForm>
      </VCardText>
    </VCard>
  </div>
</template>

<style lang="scss">
@use "@core/scss/template/pages/page-auth";

.auth-login-card {
  background-color: rgb(var(--v-theme-surface));
}
</style>
