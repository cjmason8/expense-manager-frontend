import type { App } from 'vue'
import { Amplify } from 'aws-amplify'

const userPoolId = import.meta.env.VITE_COGNITO_USER_POOL_ID as string | undefined
const userPoolClientId = import.meta.env.VITE_COGNITO_CLIENT_ID as string | undefined

if (!userPoolId || !userPoolClientId) {
  console.warn(
    '[expense-manager] Missing VITE_COGNITO_USER_POOL_ID or VITE_COGNITO_CLIENT_ID — Cognito login will not work.',
  )
}
else {
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId,
        userPoolClientId,
      },
    },
  })
}

export default function (_app: App) {
  // Configuration runs at import time so Amplify is ready before authStore / axios.
}
