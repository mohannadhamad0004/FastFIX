import { RouterProvider } from 'react-router/dom'
import { router } from './routes.jsx'

// Root component. TODO: wrap in AppProviders once auth and data providers exist.
export default function App() {
  return <RouterProvider router={router} />
}
