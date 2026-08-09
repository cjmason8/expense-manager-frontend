<script setup lang="ts">
const model = defineModel<string[]>({ default: () => [] })

const newNote = ref('')

function addNote() {
  const text = newNote.value.trim()
  if (!text)
    return

  model.value = [...model.value, text]
  newNote.value = ''
}

function flushPendingNote(): string[] {
  addNote()

  return [...model.value]
}

function getNotes(): string[] {
  return [...model.value]
}

function removeNote(index: number) {
  model.value = model.value.filter((_, i) => i !== index)
}

function updateNote(index: number, value: string) {
  const next = [...model.value]
  next[index] = value
  model.value = next
}

defineExpose({ flushPendingNote, getNotes })
</script>

<template>
  <div class="recipe-notes-editor">
    <div
      v-if="model.length === 0"
      class="text-medium-emphasis text-body-2 mb-3"
    >
      No notes yet.
    </div>

    <div
      v-for="(note, index) in model"
      :key="index"
      class="recipe-notes-editor__row"
    >
      <VTextarea
        :model-value="note"
        rows="2"
        auto-grow
        hide-details
        @update:model-value="updateNote(index, $event)"
      />
      <IconBtn
        size="small"
        color="error"
        @click="removeNote(index)"
      >
        <VIcon icon="ri-delete-bin-line" />
        <VTooltip
          activator="parent"
          location="top"
        >
          Remove note
        </VTooltip>
      </IconBtn>
    </div>

    <div class="recipe-notes-editor__add">
      <VTextarea
        v-model="newNote"
        rows="2"
        auto-grow
        hide-details
        placeholder="Add a note..."
        @keyup.ctrl.enter="addNote"
        @keyup.meta.enter="addNote"
      />
      <VBtn
        color="primary"
        variant="tonal"
        :disabled="!newNote.trim()"
        @click="addNote"
      >
        Add note
      </VBtn>
    </div>
  </div>
</template>

<style scoped lang="scss">
.recipe-notes-editor {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.recipe-notes-editor__row {
  display: grid;
  gap: 8px;
  grid-template-columns: 1fr auto;
}

.recipe-notes-editor__add {
  display: grid;
  gap: 8px;
  grid-template-columns: 1fr auto;
}
</style>
