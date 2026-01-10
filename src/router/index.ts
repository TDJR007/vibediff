import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../pages/HomeView.vue'  // we'll create these soon

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/my-diffs',
      name: 'my-diffs',
      // We'll use lazy loading later — for now placeholder
      component: () => import('../pages/MyDiffsView.vue')
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('../pages/AboutView.vue')
    }
  ]
})

export default router