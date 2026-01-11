<script setup lang="ts">
    import { ref, computed } from 'vue'
    import { useDiff } from '@/composables/useDiff'
    import { useRouter } from 'vue-router'
    import Button from 'primevue/button'
    import Textarea from 'primevue/textarea'
    import Splitter from 'primevue/splitter'
    import SplitterPanel from 'primevue/splitterpanel'
    import DiffViewer from '@/components/DiffViewer.vue'
    
    const { left, right, computeDiff, hasDiff, diffResult } = useDiff()
    const router = useRouter()
    
    const showPreview = ref(false)
    
    const canCompare = computed(() => {
      return left.value.trim().length > 0 && right.value.trim().length > 0
    })
    
    const leftCharCount = computed(() => left.value.length)
    const rightCharCount = computed(() => right.value.length)
    const leftLineCount = computed(() => left.value.split('\n').length)
    const rightLineCount = computed(() => right.value.split('\n').length)
    
    const handlePreview = () => {
      if (!canCompare.value) return
      computeDiff()
      showPreview.value = true
    }
    
    const handleProceedToMerge = () => {
      if (!hasDiff.value) {
        computeDiff()
      }
      
      const mergeData = {
        left: left.value,
        right: right.value,
        diff: diffResult.value
      }
      
      sessionStorage.setItem('vibediff-merge-data', JSON.stringify(mergeData))
      router.push('/merge')
    }
    
    const clearAll = () => {
      left.value = ''
      right.value = ''
      showPreview.value = false
    }
    
    const swapTexts = () => {
      const temp = left.value
      left.value = right.value
      right.value = temp
    }
    </script>
    
    <template>
      <div class="home-container">
        <!-- Hero Section -->
        <div class="hero-section">
          <div class="hero-content">
            <div class="hero-icon">
              <i class="pi pi-code"></i>
            </div>
            <h1 class="hero-title">Text Comparison Tool</h1>
            <p class="hero-subtitle">
              Compare two versions of text or code side-by-side and merge them intelligently
            </p>
          </div>
        </div>
    
        <!-- Main Editor Section -->
        <div class="editor-section">
          <!-- Action Bar -->
          <div class="action-bar">
            <div class="action-bar-left">
              <Button
                label="Clear All"
                icon="pi pi-trash"
                severity="secondary"
                text
                size="small"
                :disabled="!left && !right"
                @click="clearAll"
              />
              <Button
                label="Swap"
                icon="pi pi-arrows-h"
                severity="secondary"
                text
                size="small"
                :disabled="!canCompare"
                @click="swapTexts"
              />
            </div>
            <div class="action-bar-right">
              <Button
                v-if="!showPreview"
                label="Preview Diff"
                icon="pi pi-eye"
                severity="info"
                :disabled="!canCompare"
                @click="handlePreview"
              />
              <Button
                v-else
                label="Hide Preview"
                icon="pi pi-eye-slash"
                severity="secondary"
                outlined
                @click="showPreview = false"
              />
              <Button
                label="Proceed to Merge"
                icon="pi pi-arrow-right"
                severity="success"
                :disabled="!canCompare"
                @click="handleProceedToMerge"
              />
            </div>
          </div>
    
          <!-- Split Editor -->
          <div class="editor-container">
            <Splitter layout="horizontal" style="height: 100%;">
              <!-- Left Panel -->
              <SplitterPanel :size="50" class="editor-panel">
                <div class="panel-header">
                  <div class="panel-title">
                    <i class="pi pi-file"></i>
                    <span>Original Text</span>
                  </div>
                  <div class="panel-stats">
                    <span class="stat-item">
                      <i class="pi pi-align-left"></i>
                      {{ leftLineCount }} lines
                    </span>
                    <span class="stat-item">
                      <i class="pi pi-info-circle"></i>
                      {{ leftCharCount }} chars
                    </span>
                  </div>
                </div>
                <div class="panel-content">
                  <Textarea
                    v-model="left"
                    class="editor-textarea"
                    placeholder="Paste your original text or code here...
                    
    • Support for any text format
    • Line-by-line comparison
    • Syntax highlighting in diff view"
                  />
                </div>
              </SplitterPanel>
    
              <!-- Right Panel -->
              <SplitterPanel :size="50" class="editor-panel">
                <div class="panel-header">
                  <div class="panel-title">
                    <i class="pi pi-file-edit"></i>
                    <span>Modified Text</span>
                  </div>
                  <div class="panel-stats">
                    <span class="stat-item">
                      <i class="pi pi-align-left"></i>
                      {{ rightLineCount }} lines
                    </span>
                    <span class="stat-item">
                      <i class="pi pi-info-circle"></i>
                      {{ rightCharCount }} chars
                    </span>
                  </div>
                </div>
                <div class="panel-content">
                  <Textarea
                    v-model="right"
                    class="editor-textarea"
                    placeholder="Paste your modified text or code here...
                    
    • AI-generated modifications
    • Manual edits
    • Any text changes"
                  />
                </div>
              </SplitterPanel>
            </Splitter>
          </div>
        </div>
    
        <!-- Preview Section -->
        <transition name="slide-fade">
          <div v-if="showPreview && hasDiff" class="preview-section">
            <div class="preview-header">
              <h2 class="preview-title">
                <i class="pi pi-eye"></i>
                Diff Preview
              </h2>
              <p class="preview-subtitle">
                Review the changes before proceeding to merge
              </p>
            </div>
            <DiffViewer :changes="diffResult" />
          </div>
        </transition>
      </div>
    </template>
    
    <style scoped>
    .home-container {
      max-width: 1600px;
      margin: 0 auto;
      padding: 0 1rem;
    }
    
    /* Hero Section */
    .hero-section {
      text-align: center;
      padding: 2rem 0 3rem 0;
      background: linear-gradient(135deg, var(--primary-50) 0%, var(--surface-50) 100%);
      border-radius: 1rem;
      margin-bottom: 2rem;
    }
    
    .dark .hero-section {
      background: linear-gradient(135deg, var(--primary-900) 0%, var(--surface-900) 100%);
    }
    
    .hero-content {
      max-width: 700px;
      margin: 0 auto;
    }
    
    .hero-icon {
      font-size: 3rem;
      color: var(--primary-500);
      margin-bottom: 1rem;
      animation: float 3s ease-in-out infinite;
    }
    
    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }
    
    .hero-title {
      font-size: 2.5rem;
      font-weight: 700;
      color: var(--primary-700);
      margin-bottom: 0.75rem;
    }
    
    .dark .hero-title {
      color: var(--primary-300);
    }
    
    .hero-subtitle {
      font-size: 1.125rem;
      color: var(--surface-600);
      line-height: 1.6;
    }
    
    .dark .hero-subtitle {
      color: var(--surface-400);
    }
    
    /* Editor Section */
    .editor-section {
      background: var(--surface-0);
      border: 1px solid var(--surface-200);
      border-radius: 0.75rem;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      margin-bottom: 2rem;
    }
    
    .dark .editor-section {
      border-color: var(--surface-700);
    }
    
    /* Action Bar */
    .action-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      background: var(--surface-50);
      border-bottom: 1px solid var(--surface-200);
    }
    
    .dark .action-bar {
      background: var(--surface-800);
      border-color: var(--surface-700);
    }
    
    .action-bar-left,
    .action-bar-right {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }
    
    /* Editor Container */
    .editor-container {
      height: 500px;
    }
    
    .editor-panel {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    
    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1.25rem;
      background: var(--surface-100);
      border-bottom: 1px solid var(--surface-200);
    }
    
    .dark .panel-header {
      background: var(--surface-900);
      border-color: var(--surface-700);
    }
    
    .panel-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 600;
      font-size: 0.875rem;
      color: var(--surface-700);
    }
    
    .dark .panel-title {
      color: var(--surface-300);
    }
    
    .panel-stats {
      display: flex;
      gap: 1rem;
      font-size: 0.75rem;
      color: var(--surface-500);
    }
    
    .dark .panel-stats {
      color: var(--surface-400);
    }
    
    .stat-item {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }
    
    .panel-content {
      flex: 1;
      overflow: hidden;
      display: flex;
    }
    
    .editor-textarea {
      width: 100% !important;
      height: 100% !important;
      border: none !important;
      border-radius: 0 !important;
      font-family: 'Courier New', monospace !important;
      font-size: 14px !important;
      resize: none !important;
      padding: 1rem !important;
      line-height: 1.6 !important;
    }
    
    .editor-textarea:focus {
      box-shadow: none !important;
    }
    
    /* Preview Section */
    .preview-section {
      animation: slideInUp 0.4s ease-out;
    }
    
    .preview-header {
      text-align: center;
      margin-bottom: 1.5rem;
      padding: 1.5rem;
      background: var(--surface-50);
      border-radius: 0.75rem;
      border: 1px solid var(--surface-200);
    }
    
    .dark .preview-header {
      background: var(--surface-900);
      border-color: var(--surface-700);
    }
    
    .preview-title {
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--primary-600);
      margin-bottom: 0.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }
    
    .dark .preview-title {
      color: var(--primary-400);
    }
    
    .preview-subtitle {
      color: var(--surface-600);
      font-size: 0.875rem;
    }
    
    .dark .preview-subtitle {
      color: var(--surface-400);
    }
    
    /* Animations */
    @keyframes slideInUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .slide-fade-enter-active {
      transition: all 0.4s ease-out;
    }
    
    .slide-fade-leave-active {
      transition: all 0.3s ease-in;
    }
    
    .slide-fade-enter-from {
      opacity: 0;
      transform: translateY(30px);
    }
    
    .slide-fade-leave-to {
      opacity: 0;
      transform: translateY(-30px);
    }
    
    /* Responsive */
    @media (max-width: 768px) {
      .hero-title {
        font-size: 1.875rem;
      }
      
      .hero-subtitle {
        font-size: 1rem;
      }
      
      .action-bar {
        flex-direction: column;
        gap: 1rem;
        align-items: stretch;
      }
      
      .action-bar-left,
      .action-bar-right {
        justify-content: center;
      }
      
      .editor-container {
        height: 400px;
      }
    }
    </style>