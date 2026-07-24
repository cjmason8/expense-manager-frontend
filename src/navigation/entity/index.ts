import type { HorizontalNavItems } from '@layouts/types'

export default [
  {
    title: 'Recipes',
    to: { name: 'recipes' },
    icon: { icon: 'ri-restaurant-line' },
  },
  {
    title: 'Notes',
    to: { name: 'notes' },
    icon: { icon: 'ri-sticky-note-line' },
  },
] as HorizontalNavItems
