<script lang="ts" setup>
import type { WeatherForecast, WeatherForecastDay } from '@/types/weather'
import { apiFetch } from '@/utils/apiFetch'

const FORECAST_REFRESH_MS = 30 * 60 * 1000
const CLOCK_REFRESH_MS = 60 * 1000

// BOM forecast_icon_code values.
const iconByCode: Record<number, string> = {
  1: 'ri-sun-line',
  2: 'ri-moon-clear-line',
  3: 'ri-sun-cloudy-line',
  4: 'ri-cloudy-line',
  6: 'ri-haze-line',
  8: 'ri-drizzle-line',
  9: 'ri-windy-line',
  10: 'ri-mist-line',
  11: 'ri-showers-line',
  12: 'ri-heavy-showers-line',
  13: 'ri-haze-line',
  14: 'ri-temp-cold-line',
  15: 'ri-snowy-line',
  16: 'ri-thunderstorms-line',
  17: 'ri-drizzle-line',
  18: 'ri-heavy-showers-line',
  19: 'ri-typhoon-line',
}

const now = ref(new Date())
const forecast = ref<WeatherForecast | null>(null)

const todayLabel = computed(() => now.value.toLocaleDateString('en-AU', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
}))

const issuedLabel = computed(() => {
  if (!forecast.value?.issuedAt)
    return ''

  return new Date(forecast.value.issuedAt).toLocaleString('en-AU', {
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
  })
})

function parseLocalDate(value: string) {
  const [year, month, day] = value.split('-').map(Number)

  return new Date(year, month - 1, day)
}

function dayLabel(day: WeatherForecastDay) {
  const date = parseLocalDate(day.date)

  if (date.toDateString() === now.value.toDateString())
    return 'Today'

  return date.toLocaleDateString('en-AU', { weekday: 'short' })
}

function dayIcon(day: WeatherForecastDay) {
  return (day.iconCode != null && iconByCode[day.iconCode]) || 'ri-cloudy-2-line'
}

function tempLabel(day: WeatherForecastDay) {
  if (day.maxTemp == null)
    return day.minTemp == null ? '' : `${day.minTemp}°`

  return day.minTemp == null ? `${day.maxTemp}°` : `${day.maxTemp}° / ${day.minTemp}°`
}

async function loadForecast() {
  try {
    const response = await apiFetch('/weather/forecast', { cache: 'no-store' })
    if (response.ok)
      forecast.value = await response.json() as WeatherForecast
  }
  catch {
    // The forecast is optional; keep the last result if a refresh fails.
  }
}

let clockTimer: ReturnType<typeof setInterval> | undefined
let forecastTimer: ReturnType<typeof setInterval> | undefined

onMounted(() => {
  loadForecast()
  clockTimer = setInterval(() => {
    now.value = new Date()
  }, CLOCK_REFRESH_MS)
  forecastTimer = setInterval(loadForecast, FORECAST_REFRESH_MS)
})

onUnmounted(() => {
  clearInterval(clockTimer)
  clearInterval(forecastTimer)
})
</script>

<template>
  <div class="navbar-date-weather d-flex align-center gap-6">
    <div class="d-flex align-center gap-2 text-no-wrap">
      <VIcon
        icon="ri-calendar-line"
        size="20"
      />
      <span>{{ todayLabel }}</span>
    </div>
    <VDivider
      v-if="forecast?.days.length"
      vertical
      class="d-none d-md-block navbar-date-weather__divider"
    />
    <div
      v-if="forecast?.days.length"
      class="d-none d-md-flex align-center gap-6"
    >
      <div
        v-for="day in forecast.days"
        :key="day.date"
        class="navbar-date-weather__day d-flex align-center gap-2"
      >
        <VIcon
          :icon="dayIcon(day)"
          size="20"
        />
        <span class="text-medium-emphasis">{{ dayLabel(day) }}</span>
        <span>{{ tempLabel(day) }}</span>
        <VTooltip
          activator="parent"
          location="bottom"
        >
          <div>{{ day.precis }}</div>
          <div v-if="day.rainChance">
            Chance of rain: {{ day.rainChance }}<span v-if="day.rainRange"> ({{ day.rainRange }})</span>
          </div>
          <div class="text-caption mt-1">
            Bureau of Meteorology — {{ forecast.location }}<span v-if="issuedLabel">, issued {{ issuedLabel }}</span>
          </div>
        </VTooltip>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.navbar-date-weather {
  font-size: 0.875rem;
}

.navbar-date-weather__divider {
  block-size: 24px;
  align-self: center;
}

.navbar-date-weather__day {
  cursor: default;
  white-space: nowrap;
}
</style>
