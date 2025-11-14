import Aura from '@primevue/themes/aura'
import PrimeVue from 'primevue/config'
import type { App } from 'vue'

export default function (app: App) {
  app.use(PrimeVue, {
    locale: {
      firstDayOfWeek: 1,
    },
    theme: {
      preset: Aura,
      options: {
        prefix: 'p',
        darkModeSelector: 'system',
        cssLayer: false,
      },
    },
  })
}
