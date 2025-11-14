import { setupLayouts } from 'virtual:generated-layouts'
import type { App as AppVue } from 'vue'

import type { RouteRecordRaw } from 'vue-router/auto'

import { createRouter, createWebHistory } from 'vue-router/auto'
import index from '@/pages/index.vue'
import Default from '@/layouts/default.vue'

function recursiveLayouts(route: RouteRecordRaw): RouteRecordRaw {
  if (route.children) {
    for (let i = 0; i < route.children.length; i++)
      route.children[i] = recursiveLayouts(route.children[i])

    return route
  }

  return setupLayouts([route])[0]
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to) {
    if (to.hash)
      return { el: to.hash, behavior: 'smooth', top: 60 }

    return { top: 0 }
  },
  extendRoutes: pages => [
    ...[...pages].map(route => recursiveLayouts(route)),
    {
      path: '/',
      component: Default,
      children: [
        {
          path: 'home/:date',
          name: 'gotoWeek',
          component: index,
        },
      ],
    },
  ],
})

export { router }

export default function (app: AppVue) {
  app.use(router)
}
