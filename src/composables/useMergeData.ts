// src/composables/useMergeData.ts
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import type { Change } from 'diff'

export function useMergeData() {
  const router = useRouter()
  
  const leftText = ref('')
  const rightText = ref('')
  const diffResult = ref<Change[]>([])
  
  const hasData = computed(() => diffResult.value.length > 0)
  
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
          
          console.log('✅ Data loaded successfully')
          
          sessionStorage.removeItem('vibediff-merge-data')
          
          // Return hunk selections if they exist for restoration
          return data.hunkSelections
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
  
  return {
    leftText,
    rightText,
    diffResult,
    hasData
  }
}