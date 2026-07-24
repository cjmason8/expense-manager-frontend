<script lang="ts" setup>
import entityNavItems from '@/navigation/entity'
import { HorizontalNav } from '@layouts/components'
</script>

<template>
  <nav class="entity-top-nav">
    <HorizontalNav :nav-items="entityNavItems" />
  </nav>
</template>

<style scoped lang="scss">
.entity-top-nav {
  border-block-end: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  background: rgb(var(--v-theme-surface));
  inline-size: 100%;
  padding-block: 0.25rem;
  padding-inline: 1rem;

  :deep(.nav-items) {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
    list-style: none;
    margin: 0;
    padding: 0;
  }

  :deep(.nav-link a) {
    align-items: center;
    border-radius: 6px;
    color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
    display: flex;
    font-size: 0.9375rem;
    font-weight: 500;
    gap: 0.5rem;
    padding-block: 0.5rem;
    padding-inline: 0.875rem;
    text-decoration: none;
    transition: background-color 0.2s ease, color 0.2s ease;

    &:hover {
      background: rgba(var(--v-theme-on-surface), 0.06);
      color: rgb(var(--v-theme-on-surface));
    }

    &.router-link-active {
      background: rgba(var(--v-theme-primary), 0.12);
      color: rgb(var(--v-theme-primary));
    }
  }

  :deep(.nav-item-icon) {
    font-size: 1.125rem;
  }
}
</style>
