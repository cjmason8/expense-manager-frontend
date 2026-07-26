<script setup lang="ts">
const model = defineModel<string>({ default: '' })
</script>

<template>
  <div class="markdown-editor">
    <VTextarea
      v-model="model"
      rows="6"
      auto-grow
      hide-details
      placeholder="Supports Markdown, e.g. [Recipe site](https://example.com/recipe)"
    />
    <div
      v-if="model?.trim()"
      class="markdown-editor__preview"
    >
      <div class="text-caption text-medium-emphasis mb-1">
        Preview
      </div>
      <MarkdownContent :content="model" />
    </div>
    <div class="text-caption text-medium-emphasis mt-1">
      Use [link text](url) for links, **bold**, and *italic*.
    </div>
  </div>
</template>

<style scoped lang="scss">
.markdown-editor__preview {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 6px;
  margin-top: 0.75rem;
  padding: 0.75rem;
}
</style>
