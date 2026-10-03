import AuthProvider from '../auth/AuthContext.jsx'
import ToastProvider from '../components/Toast/ToastProvider.jsx'
import TagsProvider from '../context/TagsProvider.jsx'
import ThemeProvider from '../context/ThemeProvider.jsx'
import CarsProvider from '../features/cars/CarsProvider.jsx'
import DiagnosisProvider from '../features/diagnosis/DiagnosisProvider.jsx'
import EmergencyProvider from '../features/requests/emergency/EmergencyProvider.jsx'
import CartProvider from '../features/marketplace/CartProvider.jsx'
import MarketplaceProvider from '../features/marketplace/MarketplaceProvider.jsx'
import NotificationsProvider from '../features/marketplace/NotificationsProvider.jsx'
import OrdersProvider from '../features/marketplace/OrdersProvider.jsx'
import Preview3DProvider from '../features/preview3d/Preview3DProvider.jsx'
import ScansProvider from '../features/preview3d/ScansProvider.jsx'
import ChatsProvider from '../features/requests/ChatsProvider.jsx'
import RequestsProvider from '../features/requests/RequestsProvider.jsx'
import ReviewsProvider from '../features/requests/ReviewsProvider.jsx'

// Wraps the app in global providers. Order matters: marketplace writes check the logged-in user
// (auth), requests use auth and the marketplace, the cart and orders use all of those (orders also
// link purchases to requests), reviews and chats are attached to requests (reviews also to orders), the
// customer's cars, their 3D scans (which notify when ready) and diagnoses are saved for the logged-in user. Toasts wrap everything so any
// provider or page can show one. The theme (light / dark / system) is outermost. The admin area
// mounts its own AdminProvider inside all of these (features/admin/components/AdminLayout.jsx).
export default function AppProviders({ children }) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <TagsProvider>
          <AuthProvider>
            <EmergencyProvider>
            <MarketplaceProvider>
              <RequestsProvider>
                <CartProvider>
                  <NotificationsProvider>
                    <OrdersProvider>
                      <ReviewsProvider>
                        <ChatsProvider>
                          <CarsProvider>
                            <ScansProvider>
                              <DiagnosisProvider>
                                <Preview3DProvider>{children}</Preview3DProvider>
                              </DiagnosisProvider>
                            </ScansProvider>
                          </CarsProvider>
                        </ChatsProvider>
                      </ReviewsProvider>
                    </OrdersProvider>
                  </NotificationsProvider>
                </CartProvider>
              </RequestsProvider>
            </MarketplaceProvider>
            </EmergencyProvider>
          </AuthProvider>
        </TagsProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}
