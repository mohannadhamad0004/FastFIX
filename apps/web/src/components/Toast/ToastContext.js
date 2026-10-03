import { createContext, useContext } from 'react'

// Toast notifications: short messages that confirm an action ("Part saved") and disappear on
// their own. The provider is ToastProvider.jsx, mounted once in app/AppProviders.jsx.
// For messages that must stay on screen (form errors, page status) use Notice instead.
export const ToastContext = createContext(null)

/**
 * const toast = useToast()
 * toast.success('Part saved')
 * toast.error("Couldn't save the part", { title: 'Error' })
 * toast.info('Link copied', { duration: 3000 })
 * @returns {{
 *   success: (message: string, options?: ToastOptions) => void,
 *   error: (message: string, options?: ToastOptions) => void,
 *   info: (message: string, options?: ToastOptions) => void,
 *   warning: (message: string, options?: ToastOptions) => void,
 * }}
 * @typedef {{ title?: string, duration?: number }} ToastOptions  duration in ms, default 5000
 */
export function useToast() {
  const value = useContext(ToastContext)
  if (!value) throw new Error('useToast must be used inside <ToastProvider>')
  return value
}
