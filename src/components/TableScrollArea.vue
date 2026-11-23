<script setup lang="ts">
const scroller = ref<HTMLElement | null>(null)
const canScrollStart = ref(false)
const canScrollEnd = ref(false)

let resizeObserver: ResizeObserver | null = null
let mutationObserver: MutationObserver | null = null

const updateOverflow = () => {
  const el = scroller.value
  if (!el) {
    canScrollStart.value = false
    canScrollEnd.value = false

    return
  }

  const maxScroll = el.scrollWidth - el.clientWidth
  const hasOverflow = maxScroll > 1

  canScrollStart.value = hasOverflow && el.scrollLeft > 1
  canScrollEnd.value = hasOverflow && el.scrollLeft < maxScroll - 1
}

onMounted(() => {
  const el = scroller.value
  if (!el)
    return

  updateOverflow()

  resizeObserver = new ResizeObserver(() => updateOverflow())
  resizeObserver.observe(el)
  if (el.firstElementChild)
    resizeObserver.observe(el.firstElementChild)

  mutationObserver = new MutationObserver(() => updateOverflow())
  mutationObserver.observe(el, { childList: true, subtree: true, characterData: true })
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  mutationObserver?.disconnect()
})
</script>

<template>
  <div
    class="table-scroll-area"
    :class="{
      'has-overflow-start': canScrollStart,
      'has-overflow-end': canScrollEnd,
    }"
  >
    <div
      ref="scroller"
      class="table-scroll-area__scroller"
      @scroll.passive="updateOverflow"
    >
      <slot />
    </div>
  </div>
</template>

<style scoped lang="scss">
.table-scroll-area {
  position: relative;
  max-inline-size: 100%;
  min-inline-size: 0;

  &::before,
  &::after {
    content: "";
    position: absolute;
    z-index: 2;
    inset-block: 0;
    inline-size: 1.75rem;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.15s ease;
  }

  &::before {
    inset-inline-start: 0;
    background: linear-gradient(
      to right,
      rgba(var(--v-theme-surface), 0.95),
      rgba(var(--v-theme-surface), 0)
    );
  }

  &::after {
    inset-inline-end: 0;
    background: linear-gradient(
      to left,
      rgba(var(--v-theme-surface), 0.95),
      rgba(var(--v-theme-surface), 0)
    );
  }

  &.has-overflow-start::before,
  &.has-overflow-end::after {
    opacity: 1;
  }

  // Persistent edge cue when more content exists to the right
  &.has-overflow-end::after {
    box-shadow: inset -10px 0 12px -12px rgba(var(--v-theme-on-surface), 0.45);
  }

  &.has-overflow-start::before {
    box-shadow: inset 10px 0 12px -12px rgba(var(--v-theme-on-surface), 0.45);
  }
}

.table-scroll-area__scroller {
  max-inline-size: 100%;
  min-inline-size: 0;
  overflow-x: auto;

  // Let this wrapper own horizontal scroll (Vuetify's inner wrapper would hide overflow hints)
  :deep(.v-table__wrapper) {
    overflow: visible;
  }
}
</style>
