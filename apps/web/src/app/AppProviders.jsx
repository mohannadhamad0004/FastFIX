import AuthProvider from '../auth/AuthContext.jsx'
import TagsProvider from '../context/TagsProvider.jsx'
import MarketplaceProvider from '../features/marketplace/MarketplaceProvider.jsx'
import Preview3DProvider from '../features/preview3d/Preview3DProvider.jsx'
import RequestsProvider from '../features/requests/RequestsProvider.jsx'

// Wraps the app in global providers. Order matters: marketplace writes check the logged-in user
// (auth), requests use auth and the marketplace. The admin area mounts its own AdminProvider
// inside all of these (features/admin/components/AdminLayout.jsx).
export default function AppProviders({ children }) {
  return (
    <TagsProvider>
      <AuthProvider>
        <MarketplaceProvider>
          <RequestsProvider>
            <Preview3DProvider>{children}</Preview3DProvider>
          </RequestsProvider>
        </MarketplaceProvider>
      </AuthProvider>
    </TagsProvider>
  )
}
