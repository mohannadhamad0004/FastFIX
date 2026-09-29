import { createBrowserRouter } from 'react-router'
import Layout from '../components/Layout/Layout.jsx'
import Home from '../pages/Home.jsx'
import CustomerDashboard from '../pages/CustomerDashboard.jsx'
import MechanicDashboard from '../pages/MechanicDashboard.jsx'
import ShopOwnerDashboard from '../pages/ShopOwnerDashboard.jsx'
import TowDashboard from '../pages/TowDashboard.jsx'

// Every page renders inside Layout (navbar + page wrapper).
// TODO: wrap each dashboard in ProtectedRoute for its role once auth exists.
export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/customer', element: <CustomerDashboard /> },
      { path: '/mechanic', element: <MechanicDashboard /> },
      { path: '/shop', element: <ShopOwnerDashboard /> },
      { path: '/tow', element: <TowDashboard /> },
    ],
  },
])
