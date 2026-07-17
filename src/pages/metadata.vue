<script setup lang="ts">
import { useMetadataKeysStore } from '@/stores/metadataKeysStore'
import { useMetadataValuesStore } from '@/stores/metadataValuesStore'

const metadataKeysStore = useMetadataKeysStore()
const metadataValuesStore = useMetadataValuesStore()

const selectedKeyId = ref<number | null>(null)
const selectedValueId = ref<number | null>(null)
const keyName = ref('')
const valueText = ref('')

const deleteKeyDialog = ref(false)
const deleteValueDialog = ref(false)

const metadataKeys = computed(() => metadataKeysStore.metadataKeys)

const selectedKey = computed(() =>
  metadataKeys.value.find(key => key.id === selectedKeyId.value),
)

const metadataValues = computed(() =>
  metadataValuesStore.valuesForKey(selectedKeyId.value),
)

const selectedValue = computed(() =>
  metadataValues.value.find(value => value.id === selectedValueId.value),
)

const canSaveKey = computed(() =>
  selectedKeyId.value != null
  && keyName.value.trim()
  && keyName.value.trim() !== selectedKey.value?.name,
)

const canSaveValue = computed(() =>
  selectedValueId.value != null
  && valueText.value.trim()
  && valueText.value.trim() !== selectedValue.value?.value,
)

void metadataKeysStore.getMetadataKeys()

watch(selectedKeyId, async keyId => {
  selectedValueId.value = null
  valueText.value = ''
  keyName.value = selectedKey.value?.name ?? ''

  if (keyId != null)
    await metadataValuesStore.getMetadataValuesByKey(keyId)
})

watch(selectedValueId, () => {
  valueText.value = selectedValue.value?.value ?? ''
})

function onKeySelected() {
  keyName.value = selectedKey.value?.name ?? ''
  selectedValueId.value = null
  valueText.value = ''
}

function resetToDefault() {
  selectedKeyId.value = null
  selectedValueId.value = null
  keyName.value = ''
  valueText.value = ''
}

async function saveKey() {
  if (!selectedKey.value || !canSaveKey.value)
    return

  await metadataKeysStore.updateMetadataKey({
    ...selectedKey.value,
    name: keyName.value.trim(),
  })
  resetToDefault()
}

async function saveValue() {
  if (!selectedValue.value || !selectedKey.value || !canSaveValue.value)
    return

  await metadataValuesStore.updateMetadataValue({
    ...selectedValue.value,
    value: valueText.value.trim(),
    metadataKey: selectedKey.value,
  })
  resetToDefault()
}

async function confirmDeleteKey() {
  if (selectedKeyId.value == null)
    return

  const keyId = selectedKeyId.value

  await metadataKeysStore.deleteMetadataKey(keyId)
  metadataValuesStore.clearValuesForKey(keyId)
  deleteKeyDialog.value = false
  resetToDefault()
}

async function confirmDeleteValue() {
  if (selectedValueId.value == null || selectedKeyId.value == null)
    return

  await metadataValuesStore.deleteMetadataValue(
    selectedValueId.value,
    selectedKeyId.value,
  )
  deleteValueDialog.value = false
  resetToDefault()
}
</script>

<template>
  <VContainer>
    <VCard>
      <VCardTitle>Metadata</VCardTitle>
      <VCardText>
        <VRow>
          <VCol
            cols="12"
            md="4"
          >
            <VSelect
              v-model="selectedKeyId"
              :items="metadataKeys"
              item-title="name"
              item-value="id"
              label="Metadata key"
              placeholder="Select key..."
              clearable
              @update:model-value="onKeySelected"
            />
          </VCol>
        </VRow>

        <VRow v-if="selectedKeyId != null">
          <VCol
            cols="12"
            md="4"
          >
            <VTextField
              v-model="keyName"
              label="Key name"
            />
          </VCol>
          <VCol
            cols="12"
            md="8"
            class="d-flex align-center gap-4"
          >
            <VBtn
              color="success"
              :disabled="!canSaveKey"
              @click="saveKey"
            >
              Save
            </VBtn>
            <VBtn
              color="error"
              variant="tonal"
              class="metadata-delete-btn"
              @click="deleteKeyDialog = true"
            >
              Delete key
            </VBtn>
          </VCol>
        </VRow>

        <VDivider
          v-if="selectedKeyId != null"
          class="my-6"
        />

        <template v-if="selectedKeyId != null">
          <VRow>
            <VCol
              cols="12"
              md="4"
            >
              <VSelect
                v-model="selectedValueId"
                :items="metadataValues"
                item-title="value"
                item-value="id"
                label="Metadata value"
                placeholder="Select value..."
                clearable
              />
            </VCol>
          </VRow>

          <VRow v-if="selectedValueId != null">
            <VCol
              cols="12"
              md="4"
            >
              <VTextField
                v-model="valueText"
                label="Value"
              />
            </VCol>
            <VCol
              cols="12"
              md="8"
              class="d-flex align-center gap-4"
            >
              <VBtn
                color="success"
                :disabled="!canSaveValue"
                @click="saveValue"
              >
                Save
              </VBtn>
              <VBtn
                color="error"
                variant="tonal"
                class="metadata-delete-btn"
                @click="deleteValueDialog = true"
              >
                Delete value
              </VBtn>
            </VCol>
          </VRow>
        </template>
      </VCardText>
    </VCard>

    <VDialog
      v-model="deleteKeyDialog"
      max-width="480px"
    >
      <VCard title="Delete metadata key">
        <VCardText>
          Are you sure you want to delete the key
          <strong>{{ selectedKey?.name }}</strong>
          and all of its values?
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn
            variant="outlined"
            @click="deleteKeyDialog = false"
          >
            Cancel
          </VBtn>
          <VBtn
            color="error"
            @click="confirmDeleteKey"
          >
            Delete
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <VDialog
      v-model="deleteValueDialog"
      max-width="480px"
    >
      <VCard title="Delete metadata value">
        <VCardText>
          Are you sure you want to delete the value
          <strong>{{ selectedValue?.value }}</strong>?
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn
            variant="outlined"
            @click="deleteValueDialog = false"
          >
            Cancel
          </VBtn>
          <VBtn
            color="error"
            @click="confirmDeleteValue"
          >
            Delete
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </VContainer>
</template>

<style scoped>
.metadata-delete-btn {
  margin-left: 24px;
}
</style>
