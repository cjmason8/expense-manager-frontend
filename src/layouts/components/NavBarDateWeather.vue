<script lang="ts" setup>
import { useRoute } from 'vue-router'
import type { WeatherForecast, WeatherForecastDay } from '@/types/weather'
import { apiFetch } from '@/utils/apiFetch'

const FORECAST_REFRESH_MS = 30 * 60 * 1000
const CLOCK_REFRESH_MS = 60 * 1000
const VISIBLE_DAYS = 5

const route = useRoute()

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

// Vuetify's built-in hover handling leaves a tooltip open when another overlay opened after it.
const hoveredDate = ref<string | null>(null)

function onDayEnter(day: WeatherForecastDay) {
  hoveredDate.value = day.date
}

function onDayLeave(day: WeatherForecastDay) {
  if (hoveredDate.value === day.date)
    hoveredDate.value = null
}

function closeTooltip() {
  hoveredDate.value = null
}

const todayLabel = computed(() => now.value.toLocaleDateString('en-AU', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
}))

const visibleDays = computed(() => {
  const today = new Date(now.value.getFullYear(), now.value.getMonth(), now.value.getDate())

  return (forecast.value?.days ?? [])
    .filter(day => parseLocalDate(day.date) >= today)
    .slice(0, VISIBLE_DAYS)
})

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

function fullDateLabel(day: WeatherForecastDay) {
  return parseLocalDate(day.date).toLocaleDateString('en-AU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

function tempDetail(day: WeatherForecastDay) {
  return [
    day.maxTemp != null ? `Max ${day.maxTemp}°` : null,
    day.minTemp != null ? `Min ${day.minTemp}°` : null,
  ].filter(Boolean).join(' · ')
}

function rainDetail(day: WeatherForecastDay) {
  return [
    day.rainChance ? `Chance of rain ${day.rainChance}` : null,
    day.rainRange,
  ].filter(Boolean).join(' · ')
}

function dayIcon(day: WeatherForecastDay) {
  return (day.iconCode != null && iconByCode[day.iconCode]) || 'ri-cloudy-2-line'
}

function tempLabel(day: WeatherForecastDay) {
  if (day.maxTemp == null)
    return day.minTemp == null ? '' : `${day.minTemp}°`

  return day.minTemp == null ? `${day.maxTemp}°` : `${day.maxTemp}° / ${day.minTemp}°`
}

let loadingForecast = false

async function loadForecast() {
  if (loadingForecast)
    return

  loadingForecast = true
  try {
    const response = await apiFetch('/weather/forecast', { cache: 'no-store' })
    if (response.ok)
      forecast.value = await response.json() as WeatherForecast
  }
  catch {
    // The forecast is optional; keep the last result if a refresh fails.
  }
  finally {
    loadingForecast = false
  }
}

function refresh() {
  now.value = new Date()
  loadForecast()
}

watch(() => route.fullPath, () => {
  closeTooltip()
  refresh()
})

function onVisibilityChange() {
  if (document.visibilityState === 'visible')
    refresh()
  else
    closeTooltip()
}

let clockTimer: ReturnType<typeof setInterval> | undefined
let forecastTimer: ReturnType<typeof setInterval> | undefined

onMounted(() => {
  loadForecast()
  clockTimer = setInterval(() => {
    now.value = new Date()
  }, CLOCK_REFRESH_MS)
  forecastTimer = setInterval(loadForecast, FORECAST_REFRESH_MS)
  document.addEventListener('visibilitychange', onVisibilityChange)
  window.addEventListener('scroll', closeTooltip, { capture: true, passive: true })
})

onUnmounted(() => {
  clearInterval(clockTimer)
  clearInterval(forecastTimer)
  document.removeEventListener('visibilitychange', onVisibilityChange)
  window.removeEventListener('scroll', closeTooltip, { capture: true })
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
      v-if="forecast && visibleDays.length"
      vertical
      class="d-none d-md-block navbar-date-weather__divider"
    />
    <div
      v-if="forecast && visibleDays.length"
      class="d-none d-md-flex align-center gap-6"
    >
      <div
        v-for="(day, index) in visibleDays"
        :key="day.date"
        class="navbar-date-weather__day align-center gap-2"
        :class="index < 3 ? 'd-flex' : 'd-none d-lg-flex'"
        @mouseenter="onDayEnter(day)"
        @mouseleave="onDayLeave(day)"
      >
        <VIcon
          :icon="dayIcon(day)"
          size="20"
        />
        <span class="text-medium-emphasis">{{ dayLabel(day) }}</span>
        <span>{{ tempLabel(day) }}</span>
        <VTooltip
          :model-value="hoveredDate === day.date"
          activator="parent"
          :open-on-hover="false"
          location="bottom"
          max-width="380"
          @update:model-value="value => !value && onDayLeave(day)"
        >
          <div class="navbar-date-weather__tooltip">
            <div class="d-flex align-center gap-2 font-weight-medium">
              <VIcon
                :icon="dayIcon(day)"
                size="18"
              />
              {{ fullDateLabel(day) }}
            </div>
            <div
              v-if="day.precis"
              class="font-weight-medium"
            >
              {{ day.precis }}
            </div>
            <div v-if="tempDetail(day)">
              {{ tempDetail(day) }}
            </div>
            <div v-if="rainDetail(day)">
              {{ rainDetail(day) }}
            </div>
            <div v-if="day.forecastText">
              {{ day.forecastText }}
            </div>
            <div v-if="day.uvAlert">
              <span class="font-weight-medium">UV:</span> {{ day.uvAlert }}
            </div>
            <div v-if="day.fireDanger">
              <span class="font-weight-medium">Fire danger:</span> {{ day.fireDanger }}
            </div>
            <div class="text-caption navbar-date-weather__source">
              Bureau of Meteorology · {{ forecast.location }}<span v-if="day.forecastText && forecast.detailArea"> (detail: {{ forecast.detailArea }})</span><span v-if="issuedLabel"> · issued {{ issuedLabel }}</span>
            </div>
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

.navbar-date-weather__tooltip {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-block: 4px;
  white-space: normal;
}

.navbar-date-weather__source {
  opacity: 0.8;
  margin-block-start: 4px;
}
</style>
