<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import type { Change } from 'diff'
import Button from 'primevue/button'
import Textarea from 'primevue/textarea'
import DiffViewer from '@/components/DiffViewer.vue'
import { useToast } from 'primevue/usetoast'
import { useDiffStorage } from '@/composables/useDiffStorage'
import InputText from 'primevue/inputtext'
import Dialog from 'primevue/dialog'

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

const { saveDiff } = useDiffStorage()
const diffName = ref('')

const showSaveDialogVisible = ref(false)
const saveDialogName = ref('')

const diffViewerRef = ref<InstanceType<typeof DiffViewer> | null>(null)

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

                // Restore hunk selections if they exist
                if (data.hunkSelections) {
                    // Convert back to Map format and restore in DiffViewer
                    // We'll need to do this after the component mounts
                    setTimeout(() => {
                        if (diffViewerRef.value && data.hunkSelections) {
                            const selectionsMap = new Map(Object.entries(data.hunkSelections))
                            diffViewerRef.value.hunkSelections.clear()
                            selectionsMap.forEach((value, key) => {
                                diffViewerRef.value!.hunkSelections.set(Number(key), value as any)
                            })
                            console.log('✅ Restored hunk selections:', selectionsMap)
                        }
                    }, 100)
                }

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

// Accept both (in order)
const acceptBoth = (hunkIndex: number, order: Array<'left' | 'right'>) => {
    console.log('Accept Both clicked for hunk:', hunkIndex, 'order:', order)

    rebuildMergedText(hunkIndex, 'both', order)
    acceptedHunks.value.add(hunkIndex)
}

// Keep both with conflict markers
const keepBoth = (hunkIndex: number) => {
    console.log('Keep Both clicked for hunk:', hunkIndex)

    rebuildMergedText(hunkIndex, 'both')
    acceptedHunks.value.add(hunkIndex)
}

// Accept all left (entire original version)
const acceptAllLeft = () => {
    mergedText.value = leftText.value
    toast.add({
        severity: 'info',
        summary: 'Accepted All Original',
        detail: 'Using the entire left/original version.',
        life: 3000
    })
}

// Accept all right (entire modified version)
const acceptAllRight = () => {
    mergedText.value = rightText.value
    toast.add({
        severity: 'info',
        summary: 'Accepted All Modified',
        detail: 'Using the entire right/modified version.',
        life: 3000
    })
}

// Rebuild the merged text based on user choice for a hunk
const rebuildMergedText = (targetHunkIndex: number, choice: 'left' | 'right' | 'both', order?: Array<'left' | 'right'>) => {
    let result = ''
    let currentHunkIndex = 0
    let inChangeBlock = false
    const processedHunks = new Set<number>()

    // First pass: identify all change blocks
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

    if (inChangeBlock && tempChanges.length > 0) {
        changeBlocks.push({ hunkIndex: currentHunkIndex, changes: [...tempChanges] })
    }

    // Second pass: rebuild text
    currentHunkIndex = 0
    inChangeBlock = false
    let skipUntilNextUnchanged = false

    diffResult.value.forEach((change, idx) => {
        const isChange = change.added || change.removed

        if (isChange && !inChangeBlock) {
            inChangeBlock = true

            // Check if this is the target hunk with "both" choice
            if (currentHunkIndex === targetHunkIndex && choice === 'both' && order) {
                // Process the entire hunk at once
                const block = changeBlocks.find(b => b.hunkIndex === targetHunkIndex)
                if (block) {
                    const removedText = block.changes.filter(c => c.removed).map(c => c.value).join('')
                    const addedText = block.changes.filter(c => c.added).map(c => c.value).join('')

                    // Add in the order user clicked
                    order.forEach(side => {
                        if (side === 'left' && removedText) {
                            result += removedText
                        } else if (side === 'right' && addedText) {
                            result += addedText
                        }
                    })

                    processedHunks.add(targetHunkIndex)
                    skipUntilNextUnchanged = true
                }
            }
        }

        // Skip processing individual changes if we already processed this hunk
        if (skipUntilNextUnchanged && isChange) {
            // Just skip this change
        } else if (currentHunkIndex === targetHunkIndex && isChange && !processedHunks.has(targetHunkIndex)) {
            // Single selection (left or right only)
            if (choice === 'left') {
                if (change.removed) {
                    result += change.value
                }
            } else if (choice === 'right') {
                if (change.added) {
                    result += change.value
                }
            }
        } else if (!isChange) {
            result += change.value
            skipUntilNextUnchanged = false // Reset the skip flag
        } else if (currentHunkIndex !== targetHunkIndex && isChange) {
            // Other hunks - keep default (modified/added version)
            if (change.added) {
                result += change.value
            }
        }

        // Move to next hunk at change boundaries
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

const showSaveDialog = () => {
    saveDialogName.value = `Diff - ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`
    showSaveDialogVisible.value = true
}

const saveDiffToLibrary = () => {
    try {
        const name = saveDialogName.value.trim() || `Diff - ${new Date().toLocaleString()}`

        // Get current hunk selections from the DiffViewer component
        const selections = diffViewerRef.value?.hunkSelections || new Map()

        // Convert Map to plain object for JSON serialization
        const selectionsObj = Object.fromEntries(selections)

        saveDiff({
            name,
            leftText: leftText.value,
            rightText: rightText.value,
            mergedText: mergedText.value,
            diffResult: diffResult.value,
            hunkSelections: selectionsObj as any  // Store as object
        })

        toast.add({
            severity: 'success',
            summary: 'Diff Saved',
            detail: `"${name}" has been saved to your library!`,
            life: 3000
        })

        showSaveDialogVisible.value = false
        saveDialogName.value = ''
    } catch (e) {
        toast.add({
            severity: 'error',
            summary: 'Save Failed',
            detail: e instanceof Error ? e.message : 'Failed to save diff',
            life: 4000
        })
    }
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
                        label="Accept All Left (Current)"
                        icon="pi pi-angle-double-left"
                        severity="danger"
                        outlined
                        size="small"
                        @click="acceptAllLeft"
                        v-tooltip.bottom="'Use entire original version'" />
                    <Button
                        label="Accept All Right (Incoming)"
                        icon="pi pi-angle-double-right"
                        severity="success"
                        outlined
                        size="small"
                        @click="acceptAllRight"
                        v-tooltip.bottom="'Use entire modified version'" />

                    <div class="border-l border-surface-300 dark:border-surface-700 mx-2"></div>

                    <!-- NEW: Save to library -->
                    <Button
                        label="Save to Library"
                        icon="pi pi-save"
                        severity="info"
                        @click="showSaveDialog"
                        v-tooltip.bottom="'Save this merge to My Diffs'" />

                    <div class="border-l border-surface-300 dark:border-surface-700 mx-2"></div>

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
                    ref="diffViewerRef"
                    :changes="diffResult"
                    :interactive="true"
                    @accept-left="acceptLeft"
                    @accept-right="acceptRight"
                    @accept-both="acceptBoth" />
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

    <!-- Save Dialog -->
    <Dialog
        v-model:visible="showSaveDialogVisible"
        modal
        header="Save Diff to Library"
        :style="{ width: '450px' }">
        <div class="space-y-4">
            <div>
                <label for="diff-name" class="block text-sm font-semibold mb-2">
                    Diff Name
                </label>
                <InputText
                    id="diff-name"
                    v-model="saveDialogName"
                    class="w-full"
                    placeholder="Enter a name for this diff..."
                    @keyup.enter="saveDiffToLibrary"
                    autofocus />
            </div>
            <p class="text-sm text-surface-600 dark:text-surface-400">
                <i class="pi pi-info-circle mr-1"></i>
                Give your diff a memorable name so you can find it later.
            </p>
        </div>

        <template #footer>
            <Button
                label="Cancel"
                icon="pi pi-times"
                severity="secondary"
                outlined
                @click="showSaveDialogVisible = false" />
            <Button
                label="Save"
                icon="pi pi-check"
                @click="saveDiffToLibrary" />
        </template>
    </Dialog>
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