<script setup lang="ts">
    import DataTable from 'primevue/datatable'
    import Column from 'primevue/column'
    import DiffActionButtons from './DiffActionButtons.vue'
    import type { SavedDiff } from '@/composables/useDiffStorage'
    
    defineProps<{
      diffs: SavedDiff[]
      formatDate: (timestamp: number) => string
      getPreview: (text: string) => string
    }>()
    
    defineEmits<{
      load: [diff: SavedDiff]
      export: [diff: SavedDiff]
      delete: [diff: SavedDiff]
    }>()
    </script>
    
    <template>
      <div class="overflow-x-auto rounded-lg border border-surface-200 dark:border-surface-800 shadow-sm table-container">
        <DataTable
          :value="diffs"
          :paginator="diffs.length > 10"
          :rows="10"
          :rowsPerPageOptions="[10, 25, 50]"
          responsiveLayout="scroll"
          stripedRows
          tableStyle="min-width: 50rem"
        >
          <Column field="name" header="Name" :sortable="true" style="min-width: 220px">
            <template #body="{ data }">
              <span class="font-medium text-surface-900 dark:text-surface-0">
                {{ data.name }}
              </span>
            </template>
          </Column>
    
          <Column field="timestamp" header="Saved" :sortable="true" style="min-width: 160px">
            <template #body="{ data }">
              <span class="text-sm text-surface-600 dark:text-surface-400">
                {{ formatDate(data.timestamp) }}
              </span>
            </template>
          </Column>
    
          <Column header="Preview" style="min-width: 320px">
            <template #body="{ data }">
              <div class="text-sm font-mono text-surface-700 dark:text-surface-300 bg-surface-50 dark:bg-surface-900 p-3 rounded border border-surface-200/50 dark:border-surface-800/50">
                {{ getPreview(data.mergedText) }}
              </div>
            </template>
          </Column>
    
          <Column header="Actions" style="min-width: 220px; text-align: right;">
            <template #body="{ data }">
              <DiffActionButtons
                :diff="data"
                @load="$emit('load', data)"
                @export="$emit('export', data)"
                @delete="$emit('delete', data)"
              />
            </template>
          </Column>
        </DataTable>
      </div>
    </template>
    
    <style scoped>
    .table-container {
      margin-top: 2.5rem !important;
    }
    
    :deep(.p-datatable-tbody > tr:hover) {
      background: var(--surface-100);
      transition: background 0.2s;
    }
    </style>