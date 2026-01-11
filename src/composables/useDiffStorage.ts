import { ref } from 'vue'
import type { Change } from 'diff'

export interface SavedDiff {
    id: string
    name: string
    timestamp: number
    leftText: string
    rightText: string
    mergedText: string
    diffResult: Change[]
    hunkSelections?: Map<number, { left: boolean, right: boolean, order: Array<'left' | 'right'> }>  // NEW!
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

  // Save a diff
  const saveDiff = (diff: Omit<SavedDiff, 'id' | 'timestamp'>): SavedDiff => {
    const newDiff: SavedDiff = {
      ...diff,
      id: `diff-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    }

    loadDiffs() // Refresh from storage first
    savedDiffs.value.unshift(newDiff) // Add to beginning
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedDiffs.value))
    } catch (e) {
      console.error('Failed to save diff:', e)
      throw new Error('Storage failed - localStorage might be full')
    }

    return newDiff
  }

  // Delete a diff
  const deleteDiff = (id: string) => {
    loadDiffs()
    savedDiffs.value = savedDiffs.value.filter(d => d.id !== id)
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedDiffs.value))
    } catch (e) {
      console.error('Failed to delete diff:', e)
    }
  }

  // Get a single diff by ID
  const getDiff = (id: string): SavedDiff | undefined => {
    loadDiffs()
    return savedDiffs.value.find(d => d.id === id)
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
    exportDiff
  }
}