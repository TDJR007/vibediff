<script setup lang="ts">
  import { ref, onMounted, computed } from 'vue'
  import { useRouter } from 'vue-router'
  import { useDiffStorage } from '@/composables/useDiffStorage'
  import type { SavedDiff } from '@/composables/useDiffStorage'
  import { useToast } from 'primevue/usetoast'
  import { useConfirm } from 'primevue/useconfirm'
  import Button from 'primevue/button'
  import DataTable from 'primevue/datatable'
  import Column from 'primevue/column'
  import InputText from 'primevue/inputtext'
  
  const router = useRouter()
  const toast = useToast()
  const confirm = useConfirm()
  const { savedDiffs, loadDiffs, deleteDiff, exportDiff } = useDiffStorage()
  
  const searchQuery = ref('')
  
  onMounted(() => {
    loadDiffs()
  })
  
  const filteredDiffs = computed(() => {
    if (!searchQuery.value) return savedDiffs.value
  
    const query = searchQuery.value.toLowerCase()
    return savedDiffs.value.filter(d =>
      d.name.toLowerCase().includes(query) ||
      d.mergedText.toLowerCase().includes(query)
    )
  })
  
  const loadDiffToMerge = (diff: SavedDiff) => {
    sessionStorage.setItem('vibediff-merge-data', JSON.stringify({
      left: diff.leftText,
      right: diff.rightText,
      diff: diff.diffResult,
      hunkSelections: diff.hunkSelections
    }))
    router.push('/merge')
  }
  
  const handleDelete = (diff: SavedDiff) => {
    confirm.require({
      message: `Delete "${diff.name}"?`,
      header: 'Confirm',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Delete',
      rejectLabel: 'Cancel',
      acceptClass: 'p-button-danger',
      accept: () => {
        deleteDiff(diff.name)
        toast.add({ severity: 'info', summary: 'Deleted', detail: `"${diff.name}" removed.`, life: 3000 })
      }
    })
  }
  
  const handleExport = (diff: SavedDiff) => {
    exportDiff(diff)
    toast.add({ severity: 'success', summary: 'Exported', detail: `"${diff.name}" downloaded.`, life: 3000 })
  }
  
  const formatDate = (timestamp: number) => new Date(timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
  const getPreview = (text: string) => text.slice(0, 80) + (text.length > 80 ? '...' : '')
  </script>
  
  <template>
    <div class="p-4 md:p-5 max-w-7xl mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <!-- Title section -->
        <div class="mb-6">
          <h1 class="text-2xl md:text-3xl font-bold text-primary-600 dark:text-primary-400 flex items-center gap-3 mb-1">
            <i class="pi pi-folder-open text-3xl opacity-80"></i>
            My Saved Diffs
          </h1>
          <p class="text-surface-600 dark:text-surface-400 text-sm md:text-base">
            Your personal merge history
          </p>
        </div>
  
        <!-- Action section - REORDERED: Button first, then Search -->
        <div class="action-section">
          
          <!-- New Diff button - MOVED TO TOP -->
          <div class="button-container">
            <Button
              label="New Diff"
              icon="pi pi-plus"
              class="p-button-outlined p-button-sm"
              @click="router.push('/')"
            />
          </div>
  
          <!-- Search + Count -->
          <div class="search-row">
            <!-- Search -->
            <div class="search-container">
              <i class="pi pi-search search-icon"></i>
              <InputText
                v-model="searchQuery"
                placeholder="    Search by name or content..."
                class="w-full search-input"
              />
            </div>
  
            <!-- Count -->
            <div class="count-container">
              <div class="count-box">
                <span class="count-text">
                  {{ filteredDiffs.length }} {{ filteredDiffs.length === 1 ? 'diff' : 'diffs' }}
                </span>
              </div>
            </div>
          </div>
  
        </div>
      </div>
  
      <!-- Empty State -->
      <div v-if="savedDiffs.length === 0" class="text-center py-20">
        <i class="pi pi-inbox text-6xl text-surface-400 dark:text-surface-600 mb-6 block"></i>
        <h2 class="text-2xl font-semibold text-surface-700 dark:text-surface-300 mb-3">
          No saved diffs yet
        </h2>
        <p class="text-surface-600 dark:text-surface-400 mb-8 max-w-md mx-auto">
          Start comparing texts and save your merges to build your library!
        </p>
        <Button
          label="Create Your First Diff"
          icon="pi pi-plus"
          class="p-button-raised"
          @click="router.push('/')"
        />
      </div>
  
      <!-- Data Table -->
      <div v-else class="overflow-x-auto rounded-lg border border-surface-200 dark:border-surface-800 shadow-sm table-container">
        <DataTable
          :value="filteredDiffs"
          :paginator="filteredDiffs.length > 10"
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
              <div class="flex items-center justify-end gap-2">
                <Button
                  icon="pi pi-folder-open"
                  class="p-button-rounded p-button-text p-button-sm"
                  severity="info"
                  @click="loadDiffToMerge(data)"
                  v-tooltip.top="'Load in Merge View'"
                />
                <Button
                  icon="pi pi-download"
                  class="p-button-rounded p-button-text p-button-sm"
                  severity="success"
                  @click="handleExport(data)"
                  v-tooltip.top="'Export as .txt'"
                />
                <Button
                  icon="pi pi-trash"
                  class="p-button-rounded p-button-text p-button-sm"
                  severity="danger"
                  @click="handleDelete(data)"
                  v-tooltip.top="'Delete'"
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </div>
    </div>
  </template>
  
  <style scoped>
  /* NUCLEAR OVERRIDES - Guaranteed layout */
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
    left: 16px !important; /* Increased from 12px for more gap */
    top: 50% !important;
    transform: translateY(-50%) !important;
    color: #6b7280 !important;
    z-index: 10 !important;
    pointer-events: none !important; /* Prevents interference with input */
  }
  
  .dark .search-icon {
    color: #9ca3af !important;
  }
  
  .search-input :deep(.p-inputtext) {
    padding-left: 3rem !important; /* Increased from 2.5rem to match icon position */
    width: 100% !important;
    padding-right: 1rem !important; /* Added right padding */
  }
  
  /* Fix for PrimeVue input padding to prevent text overlap */
  .search-input :deep(.p-inputtext)::placeholder {
    padding-left: 0 !important;
    margin-left: 0 !important;
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
    padding: 0.75rem 1.25rem !important; /* Slightly increased padding */
    min-width: 100px !important; /* Ensures count box has minimum width */
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
  
  .table-container {
    margin-top: 2.5rem !important;
  }
  
  /* Table row hover */
  :deep(.p-datatable-tbody > tr:hover) {
    background: var(--surface-100);
    transition: background 0.2s;
  }
  
  /* Fix for search input text - prevents overlap with icon */
  :deep(.p-inputtext) {
    text-indent: 0 !important;
  }
  
  /* Ensure placeholder text doesn't overlap with icon */
  .search-input :deep(.p-inputtext) {
    background-clip: padding-box !important;
  }
  </style>