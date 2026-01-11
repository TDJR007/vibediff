<script setup lang="ts">
    import { computed } from 'vue'
    import InputText from 'primevue/inputtext'
    import Button from 'primevue/button'
    
    const props = defineProps<{
      searchQuery: string
      diffCount: number
    }>()
    
    const emit = defineEmits<{
      'update:searchQuery': [value: string]
      'createNew': []
    }>()
    
    const localSearchQuery = computed({
      get: () => props.searchQuery,
      set: (val) => emit('update:searchQuery', val)
    })
    
    const countText = computed(() => {
      return `${props.diffCount} ${props.diffCount === 1 ? 'diff' : 'diffs'}`
    })
    </script>
    
    <template>
      <div class="action-section">
        <!-- New Diff button -->
        <div class="button-container">
          <Button
            label="New Diff"
            icon="pi pi-plus"
            class="p-button-outlined p-button-sm"
            @click="$emit('createNew')"
          />
        </div>
    
        <!-- Search + Count -->
        <div class="search-row">
          <!-- Search -->
          <div class="search-container">
            <i class="pi pi-search search-icon"></i>
            <InputText
              v-model="localSearchQuery"
              placeholder="    Search by name or content..."
              class="w-full search-input"
            />
          </div>
    
          <!-- Count -->
          <div class="count-container">
            <div class="count-box">
              <span class="count-text">{{ countText }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>
    
    <style scoped>
    .action-section {
      display: flex !important;
      flex-direction: column !important;
      gap: 1rem !important;
    }
    
    .button-container {
      margin-bottom: 0.5rem !important;
    }
    
    .search-row {
      display: flex !important;
      flex-direction: row !important;
      gap: 0.75rem !important;
      align-items: stretch !important;
    }
    
    .search-container {
      flex: 1 !important;
      min-width: 0 !important;
      position: relative !important;
    }
    
    .search-icon {
      position: absolute !important;
      left: 16px !important;
      top: 50% !important;
      transform: translateY(-50%) !important;
      color: #6b7280 !important;
      z-index: 10 !important;
      pointer-events: none !important;
    }
    
    .dark .search-icon {
      color: #9ca3af !important;
    }
    
    .search-input :deep(.p-inputtext) {
      padding-left: 3rem !important;
      width: 100% !important;
      padding-right: 1rem !important;
    }
    
    .count-container {
      flex-shrink: 0 !important;
    }
    
    .count-box {
      height: 100% !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      background-color: #f9fafb !important;
      border: 1px solid #e5e7eb !important;
      border-radius: 0.375rem !important;
      padding: 0.75rem 1.25rem !important;
      min-width: 100px !important;
    }
    
    .dark .count-box {
      background-color: #1f2937 !important;
      border-color: #374151 !important;
    }
    
    .count-text {
      font-size: 0.875rem !important;
      font-weight: 500 !important;
      color: #4b5563 !important;
      white-space: nowrap !important;
    }
    
    .dark .count-text {
      color: #d1d5db !important;
    }
    </style>