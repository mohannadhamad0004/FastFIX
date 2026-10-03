import { useEffect, useId, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { ACCOUNT_STATUS } from '../../auth/constants.js'
import { useAuth } from '../../auth/useAuth.js'
import { ROLE_HOME_PATHS, ROLE_LABELS, ROLES } from '../../authorization/roles.js'
import { useNewShopOrders } from '../../features/marketplace/OrdersContext.js'
import { useUnreadChats } from '../../features/requests/ChatsContext.js'
import { useReviewPrompts } from '../../features/requests/ReviewsContext.js'
import Avatar from '../Avatar.jsx'
import styles from './AccountMenu.module.css'

// The logged-in user's avatar button and its dropdown:
//   customers:  My Cars, AI Agent, Chats, Reports, My Orders, Profile, Account
//   anyone with a confirmed request or order they haven't reviewed: "Rate your experience" first
//   others:     their dashboard, Manage trucks (tow companies), Chats (not admins), My Orders
//               (mechanics), Profile, Account
//   pending:    Account status, Account
// then Log out. The unread chat count (and a shop's new orders) shows on the button and next to Chats / Orders.
// Closes on Escape, on a click outside, and when the page changes.
export default function AccountMenu() {
  const { user, service } = useAuth()
  const unread = useUnreadChats()
  const newOrders = useNewShopOrders() // parts shops: orders waiting to be confirmed
  const toRate = useReviewPrompts() // confirmed requests and orders without a review yet
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)
  const buttonRef = useRef(null)
  const menuId = useId()

  // Close when the page changes (a menu link was followed, or browser back/forward).
  const [lastPath, setLastPath] = useState(location.pathname)
  if (location.pathname !== lastPath) {
    setLastPath(location.pathname)
    setOpen(false)
  }

  useEffect(() => {
    if (!open) return undefined
    function handlePointer(event) {
      if (!containerRef.current?.contains(event.target)) setOpen(false)
    }
    function handleKey(event) {
      if (event.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', handlePointer)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('pointerdown', handlePointer)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  const chats = { to: '/chats', label: 'Chats', count: unread }
  const links = []
  if (user.status !== ACCOUNT_STATUS.APPROVED) {
    links.push({ to: '/pending-approval', label: 'Account status' })
  } else if (user.role === ROLES.CUSTOMER) {
    links.push(
      { to: '/my-cars', label: 'My Cars' },
      { to: '/ai-agent', label: 'AI Agent' },
      chats,
      { to: '/reports', label: 'Reports' },
      { to: '/orders', label: 'My Orders' },
      { to: '/profile', label: 'Profile' },
    )
  } else {
    links.push({ to: ROLE_HOME_PATHS[user.role], label: `${ROLE_LABELS[user.role]} dashboard` })
    if (user.role === ROLES.TOW) links.push({ to: '/tow/trucks', label: 'Manage trucks' })
    if (user.role !== ROLES.ADMIN) links.push(chats)
    if (user.role === ROLES.MECHANIC) links.push({ to: '/orders', label: 'My Orders' })
    if (user.role === ROLES.PARTS_SHOP) links.push({ to: '/parts-shop/orders', label: 'Orders', count: newOrders, countLabel: 'new' })
    links.push({ to: '/profile', label: 'Profile' })
  }
  const rateCount = user.status === ACCOUNT_STATUS.APPROVED ? toRate.length : 0
  if (rateCount > 0) links.unshift({ to: toRate[0].link, label: 'Rate your experience', count: rateCount, countLabel: 'to rate' })
  links.push({ to: '/account', label: 'Account' })
  // The avatar button shows unread chats, (parts shops) new orders and requests waiting for a review.
  const alerts = (links.includes(chats) ? unread : 0) + newOrders + rateCount
  const showUnread = alerts > 0

  // Leave the page first, so a protected page doesn't redirect to /login on its way out.
  async function handleLogout() {
    setOpen(false)
    await navigate('/')
    await service.logout()
  }

  return (
    <div className={styles.menu} ref={containerRef}>
      <button
        ref={buttonRef}
        type="button"
        className={styles.trigger}
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={`Account menu for ${user.name}${showUnread ? `, ${alerts} notifications` : ''}`}
        onClick={() => setOpen((value) => !value)}
      >
        <Avatar file={user.profilePhoto} name={user.name} size="sm" />
        {showUnread && (
          <span className={styles.dot} aria-hidden="true">
            {alerts > 9 ? '9+' : alerts}
          </span>
        )}
        <span className={styles.chevron} aria-hidden="true">
          ▾
        </span>
      </button>

      {open && (
        <div id={menuId} className={styles.dropdown}>
          <div className={styles.who}>
            <span className={styles.name}>{user.name}</span>
            <span className={styles.email}>{user.email}</span>
          </div>
          <ul className={styles.items}>
            {links.map((link) => (
              <li key={link.to}>
                <Link to={link.to} className={styles.item}>
                  {link.label}
                  {link.count > 0 && (
                    <span className={styles.count}>
                      {link.count}
                      <span className={styles.srOnly}> {link.countLabel ?? 'unread'}</span>
                    </span>
                  )}
                </Link>
              </li>
            ))}
            <li className={styles.separator}>
              <button type="button" className={styles.item} onClick={handleLogout}>
                Log out
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  )
}
