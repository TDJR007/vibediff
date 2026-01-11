<!-- src/pages/AboutView.vue -->
<script setup lang="ts">
  import Card from 'primevue/card'
  import Button from 'primevue/button'
  import { useWindow } from '@/composables/useWindow'
  
  const { open } = useWindow()
  </script>
  
  <template>
    <div class="p-6 md:p-12 max-w-4xl mx-auto">
      <h2
        class="text-4xl font-bold mb-6 text-center bg-gradient-to-r from-primary-500 to-primary-300 bg-clip-text text-transparent">
        About VibeDiff
      </h2>
  
      <Card class="mb-8 shadow-lg">
        <template #content>
          <p class="text-lg leading-relaxed mb-6">
            VibeDiff is a simple, free, <strong>frontend-only</strong> text/code diff & merge tool built for developers
            who love "vibing" code — especially when working with AI/LLM-generated changes.
          </p>
          <p class="text-lg leading-relaxed mb-6">
            It lets you quickly paste your original code and a modified version (e.g. from ChatGPT, Claude, Grok, etc.),
            see the differences clearly, resolve conflicts with a Visual Studio-like interface, save your work locally,
            and export a clean merged file — all in the browser, no account, no backend, no paywalls.
          </p>
          <p class="text-lg leading-relaxed italic text-surface-600 dark:text-surface-400">
            Because I blindly paste code sometimes... and then cry when it breaks. 😅
          </p>
        </template>
      </Card>
      
      <h2 class="text-2xl font-semibold mb-4 p-4 bg-surface-100 dark:bg-surface-800">
        Tips for Vibing Code Without Regrets
      </h2>
      
      <Card class="mb-8 shadow-lg">
        <template #content>
          <p class="text-lg mb-6">
            Here are some hard-earned lessons from people who have been burnt multiple times (including the creator of
            this app 😂):
          </p>
  
          <ul class="list-disc pl-6 space-y-4 text-lg">
            <li>
              <strong>Make the LLM plan first</strong> — Ask for architecture, components, and tests
              <strong>before</strong> any code. Saves hours of debugging.
            </li>
            <li>
              <strong>Break everything into individually testable components</strong> — Small pieces = easier to verify,
              easier to trust.
            </li>
            <li>
              <strong>Write tests early</strong> — Even simple unit tests. If the LLM wrote it, make it prove it works.
            </li>
            <li>
              <strong>Commit at every stable checkpoint</strong> — And <strong>never</strong> mess up your main/master
              branch. Branch early, branch often.
            </li>
            <li>
              <strong>Stick to standard architecture patterns</strong> — SPA frameworks (Vue/React), standard architecture
              for backend (Repository design pattern, Dependency Injection, caching etc), TypeScript slaps you before the
              browser does.
            </li>
            <li>
              <strong>Be lazy but smart</strong> — If PrimeVue, Shadcn, or any mature lib does it in 2 lines with
              accessibility and theming, <strong>use it</strong>. Don't reinvent a 1000-line custom component you'll never
              trust.
            </li>
            <li>
              <strong>Always diff before paste</strong> — That's literally why this tool exists. See what changed. Save
              yourself the "wait, where did my function go?" moment.
            </li>
          </ul>
        </template>
      </Card>
  
      <p class="text-center text-sm text-surface-500 dark:text-surface-400 mt-8">
        VibeDiff is open-source and MIT licensed.
        Feel free to fork, contribute, or just use it to stay sane while coding with LLMs.
      </p>
  
      <Card class="mt-8 shadow-lg">
        <template #content>
          <div class="text-center">
            <Button
              label="View on GitHub"
              icon="pi pi-github"
              class="p-button-lg p-button-outlined"
              severity="secondary"
              @click="open('https://github.com/TDJR007/vibediff')" />
          </div>
        </template>
      </Card>
    </div>
  </template>
