<script setup lang="ts">
    import Button from 'primevue/button'
    
    defineEmits<{
      acceptAllLeft: []
      acceptAllRight: []
      save: []
      export: []
      back: []
    }>()
    
    defineProps<{
      hasConflicts: boolean
    }>()
    </script>
    
    <template>
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
                @click="$emit('acceptAllLeft')"
                v-tooltip.bottom="'Accept All Left (Current)'" />
              <Button
                icon="pi pi-angle-double-right"
                severity="success"
                text
                size="small"
                @click="$emit('acceptAllRight')"
                v-tooltip.bottom="'Accept All Right (Incoming)'" />
            </div>
    
            <div class="divider"></div>
    
            <!-- Main Actions -->
            <Button
              icon="pi pi-save"
              severity="info"
              text
              @click="$emit('save')"
              v-tooltip.bottom="'Save to Library'" />
            
            <Button
              icon="pi pi-download"
              severity="success"
              :disabled="hasConflicts"
              @click="$emit('export')"
              v-tooltip.bottom="'Export Merged Result'" />
            
            <Button
              icon="pi pi-times"
              severity="secondary"
              text
              @click="$emit('back')"
              v-tooltip.bottom="'Back to Home'" />
          </div>
        </div>
      </div>
    </template>
    
    <style scoped>
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
    </style>