import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', component: () => import('@/components/getImageInfo.vue'), name: 'getImageInfo' },
  ],
})

export default router
