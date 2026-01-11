// src/composables/useDiffsManagement.ts
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDiffStorage } from '@/composables/useDiffStorage'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import type { SavedDiff } from '@/composables/useDiffStorage'

export function useDiffsManagement() {
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
        toast.add({ 
          severity: 'info', 
          summary: 'Deleted', 
          detail: `"${diff.name}" removed.`, 
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
      detail: `"${diff.name}" downloaded.`, 
      life: 3000 
    })
  }
  
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString([], { 
      dateStyle: 'medium', 
      timeStyle: 'short' 
    })
  }
  
  const getPreview = (text: string) => {
    return text.slice(0, 80) + (text.length > 80 ? '...' : '')
  }
  
  const createNewDiff = () => {
    router.push('/')
  }
  
  return {
    searchQuery,
    filteredDiffs,
    savedDiffs,
    loadDiffToMerge,
    handleDelete,
    handleExport,
    formatDate,
    getPreview,
    createNewDiff
  }
}