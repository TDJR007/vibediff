<script setup lang="ts">
  import { useDiffsManagement } from '@/composables/useDiffsManagement'
  import DiffsHeader from '@/components/diffs/DiffsHeader.vue'
  import DiffsSearchBar from '@/components/diffs/DiffsSearchBar.vue'
  import DiffsEmptyState from '@/components/diffs/DiffsEmptyState.vue'
  import DiffsTable from '@/components/diffs/DiffsTable.vue'
  
  const {
    searchQuery,
    filteredDiffs,
    savedDiffs,
    loadDiffToMerge,
    handleDelete,
    handleExport,
    formatDate,
    getPreview,
    createNewDiff
  } = useDiffsManagement()
  </script>
  
  <template>
    <div class="p-4 md:p-5 max-w-7xl mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <DiffsHeader />
        
        <DiffsSearchBar
          v-model:search-query="searchQuery"
          :diff-count="filteredDiffs.length"
          @create-new="createNewDiff"
        />
      </div>
  
      <!-- Empty State -->
      <DiffsEmptyState
        v-if="savedDiffs.length === 0"
        @create-new="createNewDiff"
      />
  
      <!-- Data Table -->
      <DiffsTable
        v-else
        :diffs="filteredDiffs"
        :format-date="formatDate"
        :get-preview="getPreview"
        @load="loadDiffToMerge"
        @export="handleExport"
        @delete="handleDelete"
      />
    </div>
  </template>