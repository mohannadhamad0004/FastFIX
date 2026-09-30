import { RouterProvider } from 'react-router/dom'
import AppProviders from './AppProviders.jsx'
import { router } from './routes.jsx'

// Root component.
export default function App() {
  return (
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  )
}
