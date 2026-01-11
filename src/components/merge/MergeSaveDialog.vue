<script setup lang="ts">
    import { computed } from 'vue'
    import Dialog from 'primevue/dialog'
    import InputText from 'primevue/inputtext'
    import Button from 'primevue/button'
    
    const props = withDefaults(defineProps<{
      visible: boolean
      diffName: string
      nameExists?: boolean
    }>(), {
      nameExists: false
    })
    
    const emit = defineEmits<{
      'update:visible': [value: boolean]
      'update:diff-name': [value: string]
      save: []
    }>()
    
    const localVisible = computed({
      get: () => props.visible,
      set: (val) => emit('update:visible', val)
    })
    
    const localDiffName = computed({
      get: () => props.diffName,
      set: (val) => emit('update:diff-name', val)
    })
    
    const handleSave = () => {
      if (props.diffName.trim()) {
        emit('save')
      }
    }
    </script>
    
    <template>
      <Dialog
        v-model:visible="localVisible"
        modal
        header="Save Diff to Library"
        :style="{ width: '500px' }">
        <div class="space-y-4">
          <div>
            <label for="diff-name" class="block text-sm font-semibold mb-2">
              Diff Name
            </label>
            <InputText
              id="diff-name"
              v-model="localDiffName"
              class="w-full"
              placeholder="Enter a name for this diff..."
              @keyup.enter="handleSave"
              autofocus />
          </div>
    
          <div v-if="nameExists"
            class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
            <div class="flex items-start gap-2">
              <i class="pi pi-exclamation-triangle text-yellow-600 dark:text-yellow-400 mt-0.5"></i>
              <div class="flex-1">
                <p class="text-sm font-semibold text-yellow-800 dark:text-yellow-300">
                  This name already exists
                </p>
                <p class="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                  Saving will overwrite the existing diff with the same name.
                </p>
              </div>
            </div>
          </div>
    
          <p v-else class="text-sm text-surface-600 dark:text-surface-400">
            <i class="pi pi-info-circle mr-1"></i>
            Give your diff a memorable name so you can find it later.
          </p>
        </div>
    
        <template #footer>
          <Button
            label="Cancel"
            icon="pi pi-times"
            severity="secondary"
            outlined
            @click="localVisible = false" />
          <Button
            :label="nameExists ? 'Overwrite' : 'Save'"
            :icon="nameExists ? 'pi pi-exclamation-triangle' : 'pi pi-check'"
            :severity="nameExists ? 'warning' : 'primary'"
            @click="handleSave"
            :disabled="!diffName.trim()" />
        </template>
      </Dialog>
    </template>