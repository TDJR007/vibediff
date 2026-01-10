<script setup lang="ts">
    import { useDiff } from '@/composables/useDiff'
import Button from 'primevue/button'
import Textarea from 'primevue/textarea'
import Splitter from 'primevue/splitter'
import SplitterPanel from 'primevue/splitterpanel'
import DiffViewer from '@/components/DiffViewer.vue'  // ← NEW

const { left, right, computeDiff, hasDiff, diffResult } = useDiff()

// Quick test data (remove later)
left.value = `function greet(name) {
  console.log("Hello " + name);
}`
right.value = `function greet(name) {
  console.log("Hi " + name + "!");
}`
    </script>
    
    <template>
      <div class="space-y-6">
        <h1 class="text-3xl font-bold text-center">Compare Texts</h1>
    
        <!-- The container -->
        <div class="w-full border border-surface-300 dark:border-surface-700 rounded-lg overflow-hidden shadow-lg" style="height: 500px;">
          <Splitter layout="horizontal" style="height: 100%;">
            <!-- Left Panel -->
            <SplitterPanel :size="50" style="display: flex; flex-direction: column; height: 100%;">
              <div class="bg-surface-100 dark:bg-surface-800 p-3 text-sm font-semibold border-b border-surface-200 dark:border-surface-700">
                Original Text
              </div>
              <div style="flex: 1; overflow: hidden; display: flex;">
  <Textarea
    v-model="left"
    class="border-0 rounded-none font-mono text-sm"
    placeholder="Paste original code/text here..."
    style="width: 100% !important; height: 100% !important; resize: none !important; min-height: 100% !important; flex: 1;"
  />
</div>
            </SplitterPanel>
    
            <!-- Right Panel -->
            <SplitterPanel :size="50" style="display: flex; flex-direction: column; height: 100%;">
              <div class="bg-surface-100 dark:bg-surface-800 p-3 text-sm font-semibold border-b border-surface-200 dark:border-surface-700">
                Modified Text
              </div>
              <div style="flex: 1; overflow: hidden; display: flex;">
  <Textarea
    v-model="right"
    class="border-0 rounded-none font-mono text-sm"
    placeholder="Paste LLM-modified version here..."
    style="width: 100% !important; height: 100% !important; resize: none !important; min-height: 100% !important; flex: 1;"
  />
</div>
            </SplitterPanel>
          </Splitter>
        </div>
    
        <!-- Compute Button -->
        <div class="flex justify-center">
          <Button
            label="Compute Diff"
            icon="pi pi-code"
            size="large"
            :disabled="!left || !right"
            @click="computeDiff"
          />
        </div>
    
        <!-- Diff Viewer -->
<DiffViewer v-if="hasDiff" :changes="diffResult" class="mt-8" />
      </div>
    </template>