<script setup lang="ts">
import { VNodeRenderer } from '@layouts/components/VNodeRenderer'
import { themeConfig } from '@themeConfig'

import tree1 from '@images/misc/tree1.png'
import authV2LoginIllustrationBorderedDark from '@images/pages/auth-v2-login-illustration-bordered-dark.png'
import authV2LoginIllustrationBorderedLight from '@images/pages/auth-v2-login-illustration-bordered-light.png'
import authV2LoginIllustrationDark from '@images/pages/auth-v2-login-illustration-dark.png'
import authV2LoginIllustrationLight from '@images/pages/auth-v2-login-illustration-light.png'
import authV2MaskDark from '@images/pages/mask-v2-dark.png'
import authV2MaskLight from '@images/pages/mask-v2-light.png'
import { useAuthStore } from '@/stores/authStore'

const authThemeImg = useGenerateImageVariant(
  authV2LoginIllustrationLight,
  authV2LoginIllustrationDark,
  authV2LoginIllustrationBorderedLight,
  authV2LoginIllustrationBorderedDark,
  true,
)

const authThemeMask = useGenerateImageVariant(authV2MaskLight, authV2MaskDark)

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
})

const isPasswordVisible = ref(false)
const loading = ref(false)

onMounted(() => {
  authStore.clearSessionForLoginPage()
})

async function loginUser() {
  if (!form.value.userName || !form.value.password)
    return
  loading.value = true
  try {
    const ok = await authStore.login({
      userName: form.value.userName,
      password: form.value.password,
    })
    if (!ok)
      return

    const raw = route.query.redirect
    const redirect = typeof raw === 'string' ? raw : null
    if (redirect && redirect.startsWith('/'))
      await router.push(redirect)
    else
      await router.push({ name: 'root' })
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <a href="javascript:void(0)">
    <div class="auth-logo d-flex align-center gap-x-3">
      <VNodeRenderer :nodes="themeConfig.app.logo" />
      <h1 class="auth-title">
        {{ themeConfig.app.title }}
      </h1>
    </div>
  </a>

  <VRow
    no-gutters
    class="auth-wrapper"
  >
    <VCol
      md="8"
      class="d-none d-md-flex position-relative"
    >
      <div
        class="d-flex align-center justify-end w-100 h-100 pa-10"
        :class="$vuetify.locale.isRtl ? 'pe-10' : 'pe-0'"
      >
        <VImg
          max-width="797"
          :src="authThemeImg"
          class="auth-illustration"
        />
      </div>

      <img
        class="auth-footer-mask"
        height="360"
        :src="authThemeMask"
      >

      <VImg
        :src="tree1"
        alt="tree image"
        height="190"
        width="90"
        class="auth-footer-tree"
      />
    </VCol>

    <VCol
      cols="12"
      md="4"
      class="auth-card-v2 d-flex align-center justify-center"
      style="background-color: rgb(var(--v-theme-surface));"
    >
      <VCard
        flat
        :max-width="500"
        class="mt-12 mt-sm-0 pa-4"
      >
        <VCardText>
          <h4 class="text-h4 mb-1">
            Sign in to <span class="text-capitalize">{{ themeConfig.app.title }}</span>
          </h4>
          <p class="mb-0">
            Enter your user name and password
          </p>
        </VCardText>
        <VCardText>
          <VAlert
            v-if="authStore.loginError"
            type="error"
            variant="tonal"
            class="mb-4"
          >
            {{ authStore.loginError }}
          </VAlert>

          <VForm @submit.prevent="loginUser">
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
    </VCol>
  </VRow>
</template>

<style lang="scss">
@use "@core/scss/template/pages/page-auth";
</style>
