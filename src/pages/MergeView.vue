<!-- MergeView.vue -->
<script setup lang="ts">
    import { ref, computed } from 'vue'
    import { useRouter } from 'vue-router'
    import { useToast } from 'primevue/usetoast'
    import { useDiffStorage } from '@/composables/useDiffStorage'
    import { useMergeData } from '@/composables/useMergeData'
    import { useMergeState } from '@/composables/useMergeState'
    import { useMergeActions } from '@/composables/useMergeActions'
    import DiffViewer from '@/components/DiffViewer.vue'
    import MergeResultEditor from '@/components/merge/MergeResultEditor.vue'
    import MergeSaveDialog from '@/components/merge/MergeSaveDialog.vue'
    import Button from 'primevue/button'
    
    const router = useRouter()
    const toast = useToast()
    const { saveDiff, diffExists } = useDiffStorage()
    
    // Load merge data from session
    const { leftText, rightText, diffResult, hasData } = useMergeData()
    
    // Initialize merge state
    const { mergedText, acceptedHunks, hasConflicts } = useMergeState(rightText.value)
    
    // Setup merge actions
    const { acceptLeft, acceptRight, acceptBoth, acceptAllLeft, acceptAllRight } = 
      useMergeActions(mergedText, diffResult, leftText, rightText, acceptedHunks)
    
    // Save dialog state
    const showSaveDialogVisible = ref(false)
    const saveDialogName = ref('')
    const diffViewerRef = ref<InstanceType<typeof DiffViewer> | null>(null)
    
    const nameAlreadyExists = computed(() => {
      return saveDialogName.value.trim() && diffExists(saveDialogName.value.trim())
    })
    
    const showSaveDialog = () => {
      saveDialogName.value = `Diff - ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`
      showSaveDialogVisible.value = true
    }
    
    const saveDiffToLibrary = () => {
      try {
        const name = saveDialogName.value.trim() || `Diff - ${new Date().toLocaleString()}`
        const selections = diffViewerRef.value?.hunkSelections || new Map()
        const selectionsObj = Object.fromEntries(selections)
    
        saveDiff({
          name,
          leftText: leftText.value,
          rightText: rightText.value,
          mergedText: mergedText.value,
          diffResult: diffResult.value,
          hunkSelections: selectionsObj as any
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
    
    // Remove the onMounted/onUnmounted scroll handling code
    </script>
    
    <template>
      <div v-if="hasData" class="merge-container">
        <!-- OLD HEADER - Compact Top Bar -->
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
                @click="router.push('/')"
                v-tooltip.bottom="'Back to Home'" />
            </div>
          </div>
        </div>
    
        <!-- Content Area - Keep the new structure but adjust padding -->
        <div class="content-area">
          <!-- Diff Comparison Section -->
          <div class="merge-section">
            <div class="section-header">
              <div class="section-title">
                <i class="pi pi-code"></i>
                <h2>Side-by-Side Comparison</h2>
              </div>
              <div class="section-hint">
                <i class="pi pi-info-circle"></i>
                <span>Check boxes on either side to accept those changes</span>
              </div>
            </div>
            <div class="section-body">
              <DiffViewer
                ref="diffViewerRef"
                :changes="diffResult"
                :interactive="true"
                @accept-left="acceptLeft"
                @accept-right="acceptRight"
                @accept-both="acceptBoth"
              />
            </div>
          </div>
    
          <!-- Result Section -->
          <div class="merge-section">
            <div class="section-header">
              <div class="section-title">
                <i class="pi pi-file-edit"></i>
                <h2>Merged Result</h2>
              </div>
              <div class="section-status">
                <div v-if="hasConflicts" class="status-badge status-warning">
                  <i class="pi pi-exclamation-triangle"></i>
                  <span>Has Conflicts</span>
                </div>
                <div v-else class="status-badge status-success">
                  <i class="pi pi-check-circle"></i>
                  <span>Ready to Export</span>
                </div>
              </div>
            </div>
            <div class="section-body">
              <MergeResultEditor
                v-model="mergedText"
                :hasConflicts="hasConflicts"
              />
            </div>
          </div>
        </div>
    
        <MergeSaveDialog
          v-model:visible="showSaveDialogVisible"
          v-model:diff-name="saveDialogName"
          :name-exists="!!nameAlreadyExists"
          @save="saveDiffToLibrary"
        />
      </div>
    </template>
    
    <style scoped>
    /* Keep all your new styling but adjust the structure */
    .merge-container {
      display: flex;
      flex-direction: column;
      height: 100vh;
      overflow: hidden;
      background: linear-gradient(180deg, var(--surface-50) 0%, var(--surface-0) 100%);
    }
    
    .dark .merge-container {
      background: linear-gradient(180deg, var(--surface-950) 0%, var(--surface-900) 100%);
    }
    
    /* OLD HEADER STYLING */
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
    
    /* Content Area - Keep new styling with adjustments */
    .content-area {
      flex: 1;
      overflow-y: auto;
      padding: 1.5rem;
      padding-top: 1rem;
    }
    
    /* Keep all the rest of your new styling */
    .merge-section {
      background: var(--surface-0);
      border: 1px solid var(--surface-200);
      border-radius: 1rem;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      animation: slideInUp 0.4s ease-out;
      margin-bottom: 1.5rem;
      max-width: 1600px;
      margin-left: auto;
      margin-right: auto;
    }
    
    .dark .merge-section {
      border-color: var(--surface-700);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }
    
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.25rem 1.5rem;
      background: var(--surface-50);
      border-bottom: 1px solid var(--surface-200);
    }
    
    .dark .section-header {
      background: var(--surface-800);
      border-color: var(--surface-700);
    }
    
    .section-title {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    
    .section-title i {
      font-size: 1.5rem;
      color: var(--primary-500);
    }
    
    .section-title h2 {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--surface-800);
      margin: 0;
    }
    
    .dark .section-title h2 {
      color: var(--surface-100);
    }
    
    .section-hint {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: var(--surface-600);
      background: var(--surface-100);
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
    }
    
    .dark .section-hint {
      color: var(--surface-400);
      background: var(--surface-900);
    }
    
    .section-status {
      display: flex;
      gap: 0.75rem;
    }
    
    .status-badge {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      font-weight: 600;
    }
    
    .status-success {
      background: rgba(34, 197, 94, 0.15);
      color: rgb(22, 163, 74);
    }
    
    .status-warning {
      background: rgba(239, 68, 68, 0.15);
      color: rgb(220, 38, 38);
    }
    
    .section-body {
      padding: 1.5rem;
    }
    
    /* Animations */
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
    
    /* Responsive */
    @media (max-width: 1024px) {
      .section-header {
        flex-direction: column;
        gap: 1rem;
        align-items: flex-start;
      }
      
      .section-hint {
        width: 100%;
      }
    }
    
    @media (max-width: 768px) {
      .top-bar-content {
        flex-direction: column;
        gap: 0.75rem;
        align-items: flex-start;
      }
      
      .actions-section {
        width: 100%;
        justify-content: flex-end;
      }
      
      .section-header {
        flex-direction: column;
        gap: 1rem;
        align-items: flex-start;
      }
    }
    </style>