import { useAdminQuery } from '../AdminContext.js'

const loadAttention = async (service) => {
  const [accounts, updates, reviews] = await Promise.all([
    service.getPendingAccounts(),
    service.getUpdatesToReview(),
    service.getReviews(),
  ])
  const items = updates.flatMap((account) => account.reviewItems)
  return {
    accounts: accounts.length,
    skills: items.filter((item) => item.kind === 'skill').length,
    trucks: items.filter((item) => item.kind === 'truck').length,
    changes: items.filter((item) => item.kind === 'change').length,
    reports: reviews.filter((review) => review.reports.length > 0).length,
  }
}

// What is waiting for an admin: pending accounts, new skills, new trucks, changed names and
// licenses, and reviews with open reports. `data` is undefined while loading.
export function useAdminAttention() {
  return useAdminQuery(loadAttention)
}
