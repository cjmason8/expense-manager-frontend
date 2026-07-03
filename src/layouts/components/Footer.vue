<script setup lang="ts">
import versionRaw from '../../../VERSION?raw'

const version = versionRaw.trim()
</script>

<template>
  <div class="h-100 d-flex align-center justify-end px-6">
    <span class="text-caption text-medium-emphasis">v{{ version }}</span>
  </div>
</template>
