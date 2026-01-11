<script setup lang="ts">
    import { computed } from 'vue'
    import Textarea from 'primevue/textarea'
    
    const props = defineProps<{
      modelValue: string
      hasConflicts: boolean
    }>()
    
    const emit = defineEmits<{
      'update:modelValue': [value: string]
    }>()
    
    const localValue = computed({
      get: () => props.modelValue,
      set: (val) => emit('update:modelValue', val)
    })
    
    const lineCount = computed(() => props.modelValue.split('\n').length)
    const charCount = computed(() => props.modelValue.length)
    </script>
    
    <template>
      <div class="section-container">
        <div class="merged-card">
          <!-- Compact Header -->
          <div class="merged-header">
            <div class="flex items-center gap-2">
              <i class="pi pi-file-edit"></i>
              <span class="font-semibold"> Final Result</span>
            </div>
            <div class="status-badge" :class="hasConflicts ? 'status-error' : 'status-success'">
              <i :class="hasConflicts ? 'pi pi-exclamation-triangle' : 'pi pi-check-circle'"></i>
              <span>{{ hasConflicts ? 'Has Conflicts' : 'Ready' }}</span>
            </div>
          </div>
    
          <!-- Textarea -->
          <div class="merged-content">
            <Textarea
              v-model="localValue"
              class="merged-textarea"
              placeholder="Your merged result will appear here..." />
          </div>
    
          <!-- Compact Footer -->
          <div class="merged-footer">
            <span>{{ lineCount }} lines</span>
            <span>•</span>
            <span>{{ charCount }} chars</span>
            <span v-if="hasConflicts" class="conflict-warning">
              <i class="pi pi-exclamation-triangle"></i>
              Resolve conflicts to export
            </span>
          </div>
        </div>
      </div>
    </template>
    
    <style scoped>
    .section-container {
      max-width: 1600px;
      margin: 0 auto 1.5rem auto;
    }
    
    .merged-card {
      background: var(--surface-0);
      border: 1px solid var(--surface-200);
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }
    
    .merged-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1rem;
      background: var(--surface-100);
      border-bottom: 1px solid var(--surface-200);
      font-size: 0.875rem;
    }
    
    .status-badge {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.375rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    
    .status-success {
      background: rgb(34, 197, 94, 0.1);
      color: rgb(34, 197, 94);
    }
    
    .status-error {
      background: rgb(239, 68, 68, 0.1);
      color: rgb(239, 68, 68);
    }
    
    .merged-content {
      height: 400px;
      display: flex;
      flex-direction: column;
    }
    
    .merged-textarea {
      width: 100%;
      height: 100%;
      border: none;
      border-radius: 0;
      font-family: 'Courier New', monospace;
      font-size: 13px;
      resize: none;
      flex: 1;
    }
    
    .merged-footer {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem 1rem;
      background: var(--surface-50);
      border-top: 1px solid var(--surface-200);
      font-size: 0.75rem;
      color: var(--surface-600);
    }
    
    .conflict-warning {
      margin-left: auto;
      color: var(--red-600);
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }
    </style>