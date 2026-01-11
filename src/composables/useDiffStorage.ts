import { ref } from 'vue'
import type { Change } from 'diff'

export interface SavedDiff {
  name: string  // Primary key
  timestamp: number
  leftText: string
  rightText: string
  mergedText: string
  diffResult: Change[]
  hunkSelections?: Record<string, { left: boolean, right: boolean, order: Array<'left' | 'right'> }>
}

const STORAGE_KEY = 'vibediff-saved-diffs'

export function useDiffStorage() {
  const savedDiffs = ref<SavedDiff[]>([])

  // Load all diffs from localStorage
  const loadDiffs = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        savedDiffs.value = JSON.parse(stored)
        // Sort by timestamp descending (newest first)
        savedDiffs.value.sort((a, b) => b.timestamp - a.timestamp)
      }
    } catch (e) {
      console.error('Failed to load diffs:', e)
      savedDiffs.value = []
    }
  }

  // Check if a diff with this name already exists
  const diffExists = (name: string): boolean => {
    return savedDiffs.value.some(d => d.name === name)
  }

  // Save a diff (will overwrite if name exists)
  const saveDiff = (diff: Omit<SavedDiff, 'timestamp'>): SavedDiff => {
    const newDiff: SavedDiff = {
      ...diff,
      timestamp: Date.now()
    }

    loadDiffs() // Refresh from storage first
    
    // Remove existing diff with same name if it exists
    savedDiffs.value = savedDiffs.value.filter(d => d.name !== newDiff.name)
    
    // Add new diff at the beginning
    savedDiffs.value.unshift(newDiff)
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedDiffs.value))
    } catch (e) {
      console.error('Failed to save diff:', e)
      throw new Error('Storage failed - localStorage might be full')
    }

    return newDiff
  }

  // Delete a diff by name
  const deleteDiff = (name: string) => {
    loadDiffs()
    savedDiffs.value = savedDiffs.value.filter(d => d.name !== name)
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedDiffs.value))
    } catch (e) {
      console.error('Failed to delete diff:', e)
    }
  }

  // Get a single diff by name
  const getDiff = (name: string): SavedDiff | undefined => {
    loadDiffs()
    return savedDiffs.value.find(d => d.name === name)
  }

  // Export a diff as .txt
  const exportDiff = (diff: SavedDiff) => {
    const blob = new Blob([diff.mergedText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${diff.name.replace(/[^a-z0-9]/gi, '_')}-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Initialize on composable creation
  loadDiffs()

  return {
    savedDiffs,
    loadDiffs,
    saveDiff,
    deleteDiff,
    getDiff,
    exportDiff,
    diffExists  // NEW: expose the check function
  }
}