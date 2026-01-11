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
  // Store in sessionStorage for merge page
  sessionStorage.setItem('vibediff-merge-data', JSON.stringify({
    left: diff.leftText,
    right: diff.rightText,
    diff: diff.diffResult,
    hunkSelections: diff.hunkSelections  // NEW: Pass selections
  }))

  router.push('/merge')
}

const handleDelete = (diff: SavedDiff) => {
  confirm.require({
    message: `Are you sure you want to delete "${diff.name}"?`,
    header: 'Confirm Deletion',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Delete',
    rejectLabel: 'Cancel',
    acceptClass: 'p-button-danger',
    accept: () => {
      deleteDiff(diff.id)
      toast.add({
        severity: 'info',
        summary: 'Deleted',
        detail: `"${diff.name}" has been deleted.`,
        life: 3000
      })
    }
  })
}

const handleExport = (diff: SavedDiff) => {
  exportDiff(diff)
  toast.add({
    severity: 'success',
    summary: 'Exported',
    detail: `"${diff.name}" has been downloaded.`,
    life: 3000
  })
}

const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleString()
}

const getPreview = (text: string) => {
  return text.slice(0, 80) + (text.length > 80 ? '...' : '')
}
</script>

<template>
  <div class="my-diffs-page">
    <!-- Header -->
    <div class="header-section mb-6">
      <div class="flex justify-between items-center mb-4">
        <div>
          <h1 class="text-3xl font-bold text-primary-600 dark:text-primary-400 flex items-center gap-3">
            <i class="pi pi-folder-open"></i>
            My Saved Diffs
          </h1>
          <p class="text-surface-600 dark:text-surface-400 mt-2">
            Your personal library of saved merges
          </p>
        </div>
        <Button
          label="New Diff"
          icon="pi pi-plus"
          @click="router.push('/')" />
      </div>

      <!-- Search bar -->
      <div class="flex gap-3 items-center">
        <span class="p-input-icon-left flex-1">
          <i class="pi pi-search" />
          <InputText
            v-model="searchQuery"
            placeholder="Search diffs by name or content..."
            class="w-full" />
        </span>
        <span class="text-sm text-surface-600 dark:text-surface-400">
          {{ filteredDiffs.length }} {{ filteredDiffs.length === 1 ? 'diff' : 'diffs' }}
        </span>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="savedDiffs.length === 0" class="empty-state">
      <div class="text-center py-16">
        <i class="pi pi-inbox text-6xl text-surface-400 dark:text-surface-600 mb-4"></i>
        <h2 class="text-2xl font-semibold text-surface-700 dark:text-surface-300 mb-2">
          No saved diffs yet
        </h2>
        <p class="text-surface-600 dark:text-surface-400 mb-6">
          Start comparing texts and save your merges to build your library!
        </p>
        <Button
          label="Create Your First Diff"
          icon="pi pi-plus"
          size="large"
          @click="router.push('/')" />
      </div>
    </div>

    <!-- Data table -->
    <div v-else class="table-container">
      <DataTable
        :value="filteredDiffs"
        :paginator="filteredDiffs.length > 10"
        :rows="10"
        :rowsPerPageOptions="[10, 25, 50]"
        responsiveLayout="scroll"
        stripedRows
        class="diff-table">
        <Column field="name" header="Name" :sortable="true" style="min-width: 200px">
          <template #body="{ data }">
            <div class="font-semibold text-primary-600 dark:text-primary-400">
              {{ data.name }}
            </div>
          </template>
        </Column>

        <Column field="timestamp" header="Saved" :sortable="true" style="min-width: 180px">
          <template #body="{ data }">
            <div class="text-sm text-surface-600 dark:text-surface-400">
              <i class="pi pi-clock mr-1"></i>
              {{ formatDate(data.timestamp) }}
            </div>
          </template>
        </Column>

        <Column header="Preview" style="min-width: 300px">
          <template #body="{ data }">
            <div
              class="text-sm font-mono text-surface-700 dark:text-surface-300 bg-surface-50 dark:bg-surface-900 p-2 rounded">
              {{ getPreview(data.mergedText) }}
            </div>
          </template>
        </Column>

        <Column header="Actions" style="min-width: 280px">
          <template #body="{ data }">
            <div class="flex gap-2">
              <Button
                label="Load"
                icon="pi pi-folder-open"
                size="small"
                severity="info"
                @click="loadDiffToMerge(data)"
                v-tooltip.top="'Open in merge view'" />
              <Button
                label="Export"
                icon="pi pi-download"
                size="small"
                severity="success"
                outlined
                @click="handleExport(data)"
                v-tooltip.top="'Download as .txt'" />
              <Button
                icon="pi pi-trash"
                size="small"
                severity="danger"
                outlined
                @click="handleDelete(data)"
                v-tooltip.top="'Delete this diff'" />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>
  </div>
</template>

<style scoped>
.my-diffs-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

.header-section {
  animation: slideInDown 0.3s ease-out;
}

.table-container {
  animation: slideInUp 0.4s ease-out;
}

.empty-state {
  animation: fadeIn 0.5s ease-out;
}

@keyframes slideInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

:deep(.diff-table) {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
</style>