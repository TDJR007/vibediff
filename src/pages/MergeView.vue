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

const { saveDiff, diffExists } = useDiffStorage()
const isOverwriting = ref(false)
const existingDiffName = ref('')
const diffName = ref('')

const showSaveDialogVisible = ref(false)
const saveDialogName = ref('')

const nameAlreadyExists = computed(() => {
    return saveDialogName.value.trim() && diffExists(saveDialogName.value.trim())
})

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
    isOverwriting.value = false
    existingDiffName.value = ''
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
        <!-- Compact Top Bar -->
        <div class="top-bar">
            <div class="top-bar-content">
                <!-- Left: Title -->
                <div class="title-section">
                    <h1 class="page-title">Review & Merge</h1>
                </div>

                <!-- Right: Actions -->
                <div class="actions-section">
                    <!-- Quick Accept Buttons -->
                    <div class="quick-actions">
                        <Button
                            icon="pi pi-angle-double-left"
                            severity="danger"
                            text
                            size="small"
                            @click="acceptAllLeft"
                            v-tooltip.bottom="'Accept All Left (Current)'" />
                        <Button
                            icon="pi pi-angle-double-right"
                            severity="success"
                            text
                            size="small"
                            @click="acceptAllRight"
                            v-tooltip.bottom="'Accept All Right (Incoming)'" />
                    </div>

                    <div class="divider"></div>

                    <!-- Main Actions -->
                    <Button
                        icon="pi pi-save"
                        severity="info"
                        text
                        @click="showSaveDialog"
                        v-tooltip.bottom="'Save to Library'" />
                    
                    <Button
                        icon="pi pi-download"
                        severity="success"
                        :disabled="hasConflicts"
                        @click="exportMerged"
                        v-tooltip.bottom="'Export Merged Result'" />
                    
                    <Button
                        icon="pi pi-times"
                        severity="secondary"
                        text
                        @click="goBack"
                        v-tooltip.bottom="'Back to Home'" />
                </div>
            </div>
        </div>

        <!-- Content Area -->
        <div class="content-area">
            <!-- Diff Viewer -->
            <div class="section-container">
                <DiffViewer
                    ref="diffViewerRef"
                    :changes="diffResult"
                    :interactive="true"
                    @accept-left="acceptLeft"
                    @accept-right="acceptRight"
                    @accept-both="acceptBoth" />
            </div>

            <!-- Merged Result -->
            <div class="section-container">
                <div class="merged-card">
                    <!-- Compact Header -->
                    <div class="merged-header">
                        <div class="flex items-center gap-2">
                            <i class="pi pi-file-edit"></i>
                            <span class="font-semibold"> Final Result</span>
                        </div>
                        <div class="status-badge" :class="hasConflicts ? 'status-error' : 'status-success'">
                            <i :class="hasConflicts ? 'pi pi-exclamation-triangle' : 'pi pi-check-circle'"></i>
                            <span>{{ hasConflicts ? 'Has Conflicts' : 'Ready' }}</span>
                        </div>
                    </div>

                    <!-- Textarea -->
                    <div class="merged-content">
                        <Textarea
                            v-model="mergedText"
                            class="merged-textarea"
                            placeholder="Your merged result will appear here..." />
                    </div>

                    <!-- Compact Footer -->
                    <div class="merged-footer">
                        <span>{{ mergedText.split('\n').length }} lines</span>
                        <span>•</span>
                        <span>{{ mergedText.length }} chars</span>
                        <span v-if="hasConflicts" class="conflict-warning">
                            <i class="pi pi-exclamation-triangle"></i>
                            Resolve conflicts to export
                        </span>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Save Dialog (unchanged) -->
    <Dialog
        v-model:visible="showSaveDialogVisible"
        modal
        header="Save Diff to Library"
        :style="{ width: '500px' }">
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

            <div v-if="nameAlreadyExists"
                class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                <div class="flex items-start gap-2">
                    <i class="pi pi-exclamation-triangle text-yellow-600 dark:text-yellow-400 mt-0.5"></i>
                    <div class="flex-1">
                        <p class="text-sm font-semibold text-yellow-800 dark:text-yellow-300">
                            This name already exists
                        </p>
                        <p class="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                            Saving will overwrite the existing diff with the same name.
                        </p>
                    </div>
                </div>
            </div>

            <p v-else class="text-sm text-surface-600 dark:text-surface-400">
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
                :label="nameAlreadyExists ? 'Overwrite' : 'Save'"
                :icon="nameAlreadyExists ? 'pi pi-exclamation-triangle' : 'pi pi-check'"
                :severity="nameAlreadyExists ? 'warning' : 'primary'"
                @click="saveDiffToLibrary"
                :disabled="!saveDialogName.trim()" />
        </template>
    </Dialog>
</template>

<style scoped>
    .merge-container {
        display: flex;
        flex-direction: column;
        height: 100vh;
        overflow: hidden;
    }
    
    /* Compact Top Bar */
    .top-bar {
        position: sticky;
        top: 0;
        z-index: 1000;
        background: var(--surface-0);
        border-bottom: 1px solid var(--surface-200);
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }
    
    .top-bar-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem 1.5rem;
        max-width: 1600px;
        margin: 0 auto;
    }
    
    .title-section {
        display: flex;
        align-items: center;
    }
    
    .page-title {
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--primary-600);
        margin: 0;
    }
    
    .actions-section {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .quick-actions {
        display: flex;
        gap: 0.25rem;
    }
    
    .divider {
        width: 1px;
        height: 24px;
        background: var(--surface-300);
        margin: 0 0.5rem;
    }
    
    /* Content Area */
    .content-area {
        flex: 1;
        overflow-y: auto;
        background: var(--surface-50);
        padding: 1.5rem;
        padding-top: 0rem;
        padding-bottom: 0rem;
    }
    
    .section-container {
        max-width: 1600px;
        margin: 0 auto 1.5rem auto;
    }
    
    /* Merged Result Card */
    .merged-card {
        background: var(--surface-0);
        border: 1px solid var(--surface-200);
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }
    
    .merged-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem 1rem;
        background: var(--surface-100);
        border-bottom: 1px solid var(--surface-200);
        font-size: 0.875rem;
    }
    
    .status-badge {
        display: flex;
        align-items: center;
        gap: 0.375rem;
        padding: 0.375rem 0.75rem;
        border-radius: 9999px;
        font-size: 0.75rem;
        font-weight: 600;
    }
    
    .status-success {
        background: rgb(34, 197, 94, 0.1);
        color: rgb(34, 197, 94);
    }
    
    .status-error {
        background: rgb(239, 68, 68, 0.1);
        color: rgb(239, 68, 68);
    }
    
    .merged-content {
        height: 400px;
        display: flex;
        flex-direction: column;
    }
    
    .merged-textarea {
        width: 100%;
        height: 100%;
        border: none;
        border-radius: 0;
        font-family: 'Courier New', monospace;
        font-size: 13px;
        resize: none;
        flex: 1;
    }
    
    .merged-footer {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.5rem 1rem;
        background: var(--surface-50);
        border-top: 1px solid var(--surface-200);
        font-size: 0.75rem;
        color: var(--surface-600);
    }
    
    .conflict-warning {
        margin-left: auto;
        color: var(--red-600);
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 0.25rem;
    }
    
    /* Smooth animations */
    .section-container {
        animation: slideInUp 0.3s ease-out;
    }
    
    @keyframes slideInUp {
        from {
            opacity: 0;
            transform: translateY(15px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    /* Custom scrollbar */
    .content-area::-webkit-scrollbar {
        width: 8px;
    }
    
    .content-area::-webkit-scrollbar-track {
        background: var(--surface-100);
    }
    
    .content-area::-webkit-scrollbar-thumb {
        background: var(--primary-300);
        border-radius: 4px;
    }
    
    .content-area::-webkit-scrollbar-thumb:hover {
        background: var(--primary-400);
    }
    </style>