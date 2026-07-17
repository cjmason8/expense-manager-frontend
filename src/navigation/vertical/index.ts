import type { VerticalNavItems } from '@layouts/types'

export default [
  {
    title: 'Home',
    to: { name: 'root' },
    icon: { icon: 'ri-home-smile-line' },
  },
  {
    title: 'Donations',
    to: { name: 'donations' },
    icon: { icon: 'ri-file-text-line' },
  },
  {
    title: 'Recurring',
    to: { name: 'recurring' },
    icon: { icon: 'ri-file-text-line' },
  },
  {
    title: 'Rent',
    to: { name: 'rental-payments' },
    icon: { icon: 'ri-file-text-line' },
  },
  {
    title: 'Documents',
    to: { name: 'documents' },
    icon: { icon: 'ri-file-text-line' },
  },
  {
    title: 'Search',
    to: { name: 'search' },
    icon: { icon: 'ri-search-line' },
  },
  {
    heading: 'Admin',
  },
  {
    title: 'Ref Data',
    to: { name: 'ref-data' },
    icon: { icon: 'ri-file-text-line' },
  },
  {
    title: 'Metadata',
    to: { name: 'metadata' },
    icon: { icon: 'ri-database-2-line' },
  },
  {
    title: 'Notifications',
    to: { name: 'notifications' },
    icon: { icon: 'ri-file-text-line' },
  },
] as VerticalNavItems
