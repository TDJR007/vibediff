<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import type { Change } from 'diff'
import Button from 'primevue/button'
import Textarea from 'primevue/textarea'
import DiffViewer from '@/components/DiffViewer.vue'
import { useToast } from 'primevue/usetoast'

const router = useRouter()
const toast = useToast()

// Data passed from Home
const leftText = ref('')
const rightText = ref('')
const diffResult = ref<Change[]>([])

// Merged result - starts as a copy of right (modified) text
const mergedText = ref('')

// Track which hunks have been manually accepted (for UI feedback later if needed)
const acceptedHunks = ref<Set<number>>(new Set())

// Check if we have data
const hasData = computed(() => diffResult.value.length > 0)

// Conflict detection
const hasConflicts = computed(() => {
    return mergedText.value.includes('<<<<<<<') ||
        mergedText.value.includes('=======') ||
        mergedText.value.includes('>>>>>>>')
})

onMounted(() => {
    const storedData = sessionStorage.getItem('vibediff-merge-data')

    console.log('MergeView mounted, stored data exists:', !!storedData)

    if (storedData) {
        try {
            const data = JSON.parse(storedData)

            if (data.left && data.right && data.diff) {
                leftText.value = data.left
                rightText.value = data.right
                diffResult.value = data.diff
                mergedText.value = data.right // Start with modified version

                console.log('✅ Data loaded successfully')
                sessionStorage.removeItem('vibediff-merge-data')
            } else {
                console.log('❌ Data incomplete, redirecting')
                router.push('/')
            }
        } catch (e) {
            console.error('Failed to parse merge data:', e)
            router.push('/')
        }
    } else {
        console.log('❌ No stored data found, redirecting to home')
        router.push('/')
    }
})

// Helper: Get text content from a Change array
const getChangeText = (changes: Change[]) => {
    return changes.map(c => c.value).join('')
}

// Accept left (original) for a specific hunk
const acceptLeft = (hunkIndex: number) => {
    console.log('Accept Left clicked for hunk:', hunkIndex)

    // Rebuild merged text with this hunk using left (original) version
    rebuildMergedText(hunkIndex, 'left')
    acceptedHunks.value.add(hunkIndex)
}

// Accept right (modified) for a specific hunk
const acceptRight = (hunkIndex: number) => {
    console.log('Accept Right clicked for hunk:', hunkIndex)

    // Rebuild merged text with this hunk using right (modified) version
    rebuildMergedText(hunkIndex, 'right')
    acceptedHunks.value.add(hunkIndex)
}

// Keep both with conflict markers
const keepBoth = (hunkIndex: number) => {
    console.log('Keep Both clicked for hunk:', hunkIndex)

    rebuildMergedText(hunkIndex, 'both')
    acceptedHunks.value.add(hunkIndex)
}

// Rebuild the merged text based on user choice for a hunk
const rebuildMergedText = (targetHunkIndex: number, choice: 'left' | 'right' | 'both') => {
    let result = ''
    let currentHunkIndex = 0
    let inChangeBlock = false
    const processedHunks = new Set<number>()

    // First pass: identify all change blocks and their indices
    const changeBlocks: Array<{ hunkIndex: number, changes: Change[] }> = []
    let tempChanges: Change[] = []

    diffResult.value.forEach((change, idx) => {
        const isChange = change.added || change.removed

        if (isChange) {
            if (!inChangeBlock) {
                inChangeBlock = true
                tempChanges = [change]
            } else {
                tempChanges.push(change)
            }
        } else if (inChangeBlock) {
            changeBlocks.push({ hunkIndex: currentHunkIndex++, changes: [...tempChanges] })
            tempChanges = []
            inChangeBlock = false
        }
    })

    // Handle trailing change block
    if (inChangeBlock && tempChanges.length > 0) {
        changeBlocks.push({ hunkIndex: currentHunkIndex, changes: [...tempChanges] })
    }

    // Second pass: rebuild text
    currentHunkIndex = 0
    inChangeBlock = false

    diffResult.value.forEach((change, idx) => {
        const isChange = change.added || change.removed

        if (isChange && !inChangeBlock) {
            inChangeBlock = true
        }

        // Check if this is the target hunk
        if (currentHunkIndex === targetHunkIndex && isChange) {
            if (choice === 'left') {
                // ONLY include removed lines (original)
                if (change.removed) {
                    result += change.value
                }
                // Skip added lines completely
            } else if (choice === 'right') {
                // ONLY include added lines (modified)
                if (change.added) {
                    result += change.value
                }
                // Skip removed lines completely
            } else if (choice === 'both') {
                // Add conflict markers
                if (change.removed) {
                    result += '<<<<<<< HEAD (Original)\n' + change.value
                } else if (change.added) {
                    result += '=======\n' + change.value + '>>>>>>> Modified\n'
                }
            }
        } else if (!isChange) {
            // Unchanged lines - always keep
            result += change.value
        } else if (currentHunkIndex !== targetHunkIndex && isChange) {
            // Other hunks - keep default (modified/added version)
            if (change.added) {
                result += change.value
            }
        }

        // Check if we're at the end of a change block
        const nextChange = diffResult.value[idx + 1]
        if (inChangeBlock && (!nextChange || (!nextChange.added && !nextChange.removed))) {
            currentHunkIndex++
            inChangeBlock = false
        }
    })

    mergedText.value = result
}

const goBack = () => {
    router.push('/')
}

const exportMerged = () => {
    if (hasConflicts.value) {
        toast.add({
            severity: 'warn',
            summary: 'Cannot Export',
            detail: 'You still have conflict markers! Resolve them first.',
            life: 4000
        })
        return
    }

    const blob = new Blob([mergedText.value], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `merged-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)

    toast.add({
        severity: 'success',
        summary: 'Export Successful',
        detail: 'Your merged file has been downloaded!',
        life: 3000
    })
}
</script>

<template>
    <div v-if="hasData" class="merge-container">
        <!-- Top Bar - Fixed at top -->
        <div
            class="top-bar bg-surface-0 dark:bg-surface-950 border-b border-surface-200 dark:border-surface-800 p-4 shadow-md">
            <div class="flex justify-between items-center">
                <div>
                    <h1 class="text-2xl font-bold text-primary-600 dark:text-primary-400">Review & Merge Changes</h1>
                    <p class="text-sm text-surface-600 dark:text-surface-400 mt-1">
                        Select which version to keep for each change block
                    </p>
                </div>
                <div class="flex gap-3">
                    <Button
                        label="Back to Home"
                        icon="pi pi-arrow-left"
                        severity="secondary"
                        outlined
                        @click="goBack" />
                    <Button
                        label="Export Merged Result"
                        icon="pi pi-download"
                        severity="success"
                        :disabled="hasConflicts"
                        @click="exportMerged" />
                </div>
            </div>
        </div>

        <!-- Scrollable Content Area -->
        <div class="content-area">
            <!-- Diff Viewer Section -->
            <div class="diff-section p-6">
                <DiffViewer
                    :changes="diffResult"
                    :interactive="true"
                    @accept-left="acceptLeft"
                    @accept-right="acceptRight" />
            </div>

            <!-- Merged Result Section -->
            <div class="merged-section p-6 pt-0">
                <div
                    class="bg-surface-0 dark:bg-surface-950 border border-surface-300 dark:border-surface-700 rounded-lg shadow-md overflow-hidden">
                    <!-- Header -->
                    <div class="bg-gradient-to-r from-primary-500 to-primary-600 p-4 text-white">
                        <div class="flex justify-between items-center">
                            <div>
                                <h2 class="text-lg font-semibold flex items-center gap-2">
                                    <i class="pi pi-file-edit text-xl"></i>
                                    Final Merged Result
                                </h2>
                                <p class="text-sm text-primary-100 mt-1">
                                    This is what will be exported. You can edit it manually if needed.
                                </p>
                            </div>
                            <div v-if="hasConflicts" class="flex items-center gap-2 bg-red-600 px-4 py-2 rounded-lg">
                                <i class="pi pi-exclamation-triangle text-lg"></i>
                                <span class="font-semibold">Conflicts Detected!</span>
                            </div>
                            <div v-else class="flex items-center gap-2 bg-green-600 px-4 py-2 rounded-lg">
                                <i class="pi pi-check-circle text-lg"></i>
                                <span class="font-semibold">Ready to Export</span>
                            </div>
                        </div>
                    </div>

                    <!-- Editable Textarea -->
                    <div class="p-0" style="height: 400px; display: flex; flex-direction: column;">
                        <Textarea
                            v-model="mergedText"
                            class="w-full h-full font-mono text-sm border-0 rounded-none"
                            placeholder="Your merged result will appear here..."
                            style="resize: none; flex: 1;" />
                    </div>

                    <!-- Footer Stats -->
                    <div
                        class="bg-surface-50 dark:bg-surface-900 p-3 border-t border-surface-200 dark:border-surface-700 text-xs text-surface-600 dark:text-surface-400">
                        <div class="flex gap-6">
                            <span><strong>Lines:</strong> {{ mergedText.split('\n').length }}</span>
                            <span><strong>Characters:</strong> {{ mergedText.length }}</span>
                            <span v-if="hasConflicts"
                                class="text-red-600 dark:text-red-400 font-semibold flex items-center gap-1">
                                <i class="pi pi-exclamation-triangle"></i>
                                Contains conflict markers - resolve before exporting
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.merge-container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    overflow: hidden;
    /* Prevent whole page scroll */
}

.top-bar {
    position: sticky;
    top: 0;
    z-index: 1000;
    flex-shrink: 0;
    backdrop-filter: blur(8px);
}

.content-area {
    flex: 1;
    overflow-y: auto;
    /* Make only this area scrollable */
    padding-top: 0;
    background: linear-gradient(to bottom,
            rgb(var(--surface-50)) 0%,
            rgb(var(--surface-0)) 100%);
}

.diff-section {
    animation: slideInUp 0.3s ease-out;
    max-width: 1400px;
    margin: 0 auto;
    width: 100%;
}

.merged-section {
    animation: slideInUp 0.4s ease-out;
    max-width: 1400px;
    margin: 0 auto;
    width: 100%;
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

/* Custom scrollbar for content area */
.content-area::-webkit-scrollbar {
    width: 8px;
}

.content-area::-webkit-scrollbar-track {
    background: rgb(var(--surface-100));
}

.content-area::-webkit-scrollbar-thumb {
    background: rgb(var(--primary-300));
    border-radius: 4px;
}

.content-area::-webkit-scrollbar-thumb:hover {
    background: rgb(var(--primary-400));
}
</style>