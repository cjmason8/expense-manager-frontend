<script setup lang="ts">
const scroller = ref<HTMLElement | null>(null)
const hasOverflow = ref(false)
const canScrollStart = ref(false)
const canScrollEnd = ref(false)

let resizeObserver: ResizeObserver | null = null
let mutationObserver: MutationObserver | null = null

const updateOverflow = () => {
  const el = scroller.value
  if (!el) {
    hasOverflow.value = false
    canScrollStart.value = false
    canScrollEnd.value = false

    return
  }

  const maxScroll = el.scrollWidth - el.clientWidth
  const overflow = maxScroll > 1

  hasOverflow.value = overflow
  canScrollStart.value = overflow && el.scrollLeft > 1
  canScrollEnd.value = overflow && el.scrollLeft < maxScroll - 1
}

const scrollByPage = (direction: 'start' | 'end') => {
  const el = scroller.value
  if (!el)
    return

  const delta = Math.max(160, Math.floor(el.clientWidth * 0.6))
  el.scrollBy({ left: direction === 'end' ? delta : -delta, behavior: 'smooth' })
}

onMounted(() => {
  const el = scroller.value
  if (!el)
    return

  updateOverflow()
  requestAnimationFrame(updateOverflow)

  resizeObserver = new ResizeObserver(() => updateOverflow())
  resizeObserver.observe(el)
  if (el.firstElementChild)
    resizeObserver.observe(el.firstElementChild)

  mutationObserver = new MutationObserver(() => {
    requestAnimationFrame(updateOverflow)
  })
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
      'is-scrollable': hasOverflow,
      'has-overflow-start': canScrollStart,
      'has-overflow-end': canScrollEnd,
    }"
  >
    <button
      v-show="canScrollStart"
      type="button"
      class="table-scroll-area__cue table-scroll-area__cue--start"
      aria-label="Scroll table left"
      @click="scrollByPage('start')"
    >
      <VIcon
        icon="ri-arrow-left-s-line"
        size="20"
      />
    </button>

    <div
      ref="scroller"
      class="table-scroll-area__scroller"
      @scroll.passive="updateOverflow"
    >
      <slot />
    </div>

    <button
      v-show="canScrollEnd"
      type="button"
      class="table-scroll-area__cue table-scroll-area__cue--end"
      aria-label="Scroll table right"
      @click="scrollByPage('end')"
    >
      <VIcon
        icon="ri-arrow-right-s-line"
        size="20"
      />
    </button>
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
    inline-size: 2.5rem;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.15s ease;
  }

  &::before {
    inset-inline-start: 0;
    background: linear-gradient(
      to right,
      rgba(var(--v-theme-surface), 1),
      rgba(var(--v-theme-surface), 0)
    );
  }

  &::after {
    inset-inline-end: 0;
    background: linear-gradient(
      to left,
      rgba(var(--v-theme-surface), 1),
      rgba(var(--v-theme-surface), 0)
    );
  }

  &.has-overflow-start::before,
  &.has-overflow-end::after {
    opacity: 1;
  }
}

.table-scroll-area__cue {
  position: absolute;
  z-index: 3;
  top: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 999px;
  background: rgb(var(--v-theme-surface));
  block-size: 2rem;
  box-shadow: 0 1px 4px rgba(var(--v-theme-on-surface), 0.18);
  color: rgb(var(--v-theme-on-surface));
  cursor: pointer;
  inline-size: 2rem;
  transform: translateY(-50%);

  &:hover {
    background: rgba(var(--v-theme-primary), 0.08);
    color: rgb(var(--v-theme-primary));
  }

  &--start {
    inset-inline-start: 0.35rem;
  }

  &--end {
    inset-inline-end: 0.35rem;
  }
}

.table-scroll-area__scroller {
  max-inline-size: 100%;
  min-inline-size: 0;
  overflow-x: auto;
  scrollbar-color: rgba(var(--v-theme-on-surface), 0.35) transparent;
  scrollbar-width: thin;

  &::-webkit-scrollbar {
    block-size: 10px;
  }

  &::-webkit-scrollbar-thumb {
    border-radius: 999px;
    background: rgba(var(--v-theme-on-surface), 0.35);
  }

  // Let this wrapper own horizontal scroll (Vuetify's inner wrapper would hide overflow hints)
  :deep(.v-table__wrapper) {
    overflow: visible;
  }
}

.table-scroll-area.is-scrollable .table-scroll-area__scroller {
  // Force a visible scrollbar gutter when content overflows (avoids macOS overlay-only scrollbars)
  overflow-x: scroll;
}
</style>
