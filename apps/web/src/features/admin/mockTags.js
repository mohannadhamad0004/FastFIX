// TODO: replace with real API call
// Seed tags. Admins manage them at /admin/tags; they show as colored badges on public cards.
// Which part / mechanic / tow company has which tag is stored on that item (tagIds).

export const seedTags = [
  { id: 't-1', type: 'part', name: 'Genuine OEM', color: '#1f6feb' },
  { id: 't-2', type: 'part', name: 'Best Seller', color: '#1a7f37' },
  { id: 't-3', type: 'part', name: 'On Offer', color: '#cf222e' },
  { id: 't-4', type: 'mechanic', name: 'Top Rated', color: '#9a6700' },
  { id: 't-5', type: 'mechanic', name: 'Mobile Service', color: '#8250df' },
  { id: 't-6', type: 'mechanic', name: '24/7', color: '#0a7f7f' },
  { id: 't-7', type: 'tow', name: '24/7', color: '#0a7f7f' },
  { id: 't-8', type: 'tow', name: 'Fast Response', color: '#bc4c00' },
  { id: 't-9', type: 'tow', name: 'Heavy Vehicles', color: '#57606a' },
]
