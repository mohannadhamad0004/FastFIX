import { createBrowserRouter } from 'react-router'
import ForgotPasswordPage from '../auth/ForgotPasswordPage.jsx'
import LoginPage from '../auth/LoginPage.jsx'
import PendingApprovalPage from '../auth/PendingApprovalPage.jsx'
import ResetPasswordPage from '../auth/ResetPasswordPage.jsx'
import SignupPage from '../auth/SignupPage.jsx'
import ProtectedRoute from '../authorization/ProtectedRoute.jsx'
import { ROLES } from '../authorization/roles.js'
import Layout from '../components/Layout/Layout.jsx'
import AdminLayout from '../features/admin/components/AdminLayout.jsx'
import AdminApprovals from '../features/admin/pages/AdminApprovals.jsx'
import AdminListingDetails from '../features/admin/pages/AdminListingDetails.jsx'
import AdminListings from '../features/admin/pages/AdminListings.jsx'
import AdminOverview from '../features/admin/pages/AdminOverview.jsx'
import AdminRequests from '../features/admin/pages/AdminRequests.jsx'
import AdminTags from '../features/admin/pages/AdminTags.jsx'
import AdminUserDetails from '../features/admin/pages/AdminUserDetails.jsx'
import AdminUsers from '../features/admin/pages/AdminUsers.jsx'
import TowCompaniesDirectory from '../features/logistics/pages/TowCompaniesDirectory.jsx'
import TowCompanyProfile from '../features/logistics/pages/TowCompanyProfile.jsx'
import MechanicProfile from '../features/mechanics/pages/MechanicProfile.jsx'
import MechanicsDirectory from '../features/mechanics/pages/MechanicsDirectory.jsx'
import Home from '../pages/Home.jsx'
import Marketplace from '../pages/Marketplace.jsx'
import MechanicDashboard from '../pages/MechanicDashboard.jsx'
import PartsShopDashboard from '../pages/PartsShopDashboard.jsx'
import ProfilePage from '../pages/ProfilePage.jsx'
import SettingsPage from '../pages/SettingsPage.jsx'
import ShopPage from '../pages/ShopPage.jsx'
import TowDashboard from '../pages/TowDashboard.jsx'

// Every page renders inside Layout (navbar + page wrapper).
// Public pages need no login. Dashboards sit behind ProtectedRoute: only approved accounts of
// that role can open them. Customers have no dashboard - after login they go to "/".
export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <Home /> },

      // Public: anyone can browse; sending a request asks for login first
      { path: '/marketplace', element: <Marketplace /> },
      { path: '/shops/:shopId', element: <ShopPage /> },
      { path: '/mechanics', element: <MechanicsDirectory /> },
      { path: '/mechanics/:mechanicId', element: <MechanicProfile /> },
      { path: '/tow-companies', element: <TowCompaniesDirectory /> },
      { path: '/tow-companies/:companyId', element: <TowCompanyProfile /> },

      // Auth
      { path: '/login', element: <LoginPage /> },
      { path: '/signup', element: <SignupPage /> },
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
      { path: '/reset-password', element: <ResetPasswordPage /> },
      { path: '/pending-approval', element: <PendingApprovalPage /> },

      // Any logged-in, approved user
      {
        element: <ProtectedRoute />,
        children: [
          { path: '/profile', element: <ProfilePage /> },
          { path: '/settings', element: <SettingsPage /> },
        ],
      },

      // Dashboards, one per role (not customers)
      {
        element: <ProtectedRoute roles={[ROLES.MECHANIC]} />,
        children: [{ path: '/mechanic', element: <MechanicDashboard /> }],
      },
      {
        element: <ProtectedRoute roles={[ROLES.PARTS_SHOP]} />,
        children: [{ path: '/parts-shop', element: <PartsShopDashboard /> }],
      },
      {
        element: <ProtectedRoute roles={[ROLES.TOW]} />,
        children: [{ path: '/tow', element: <TowDashboard /> }],
      },

      // Admin area: admins only, sidebar layout
      {
        element: <ProtectedRoute roles={[ROLES.ADMIN]} />,
        children: [
          {
            path: '/admin',
            element: <AdminLayout />,
            children: [
              { index: true, element: <AdminOverview /> },
              { path: 'approvals', element: <AdminApprovals /> },
              { path: 'users', element: <AdminUsers /> },
              { path: 'users/:userId', element: <AdminUserDetails /> },
              { path: 'tags', element: <AdminTags /> },
              { path: 'listings', element: <AdminListings /> },
              { path: 'listings/:partId', element: <AdminListingDetails /> },
              { path: 'requests', element: <AdminRequests /> },
            ],
          },
        ],
      },
    ],
  },
])
