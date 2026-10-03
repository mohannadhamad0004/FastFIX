import { useState } from 'react'
import { ROLES } from '../../../authorization/roles.js'
import Button from '../../../components/Button.jsx'
import { useAdminService } from '../AdminContext.js'
import ReasonDialog from './ReasonDialog.jsx'

// Suspend (asks for a reason) or Reactivate one account. Suspending needs a reason, which the
// owner can't see but the admin log keeps. Used by the Users row menu and the account page.
// act() reactivates at once, or opens the suspend dialog; render `dialog` once next to the trigger.
export function useSuspendAction(account, { onChanged, onError }) {
  const service = useAdminService()
  const [confirming, setConfirming] = useState(false)
  const [saving, setSaving] = useState(false)

  async function reactivate() {
    setSaving(true)
    try {
      await service.setUserSuspended(account.id, false)
      onChanged(`${account.name} was reactivated.`)
    } catch (err) {
      onError?.(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function suspend(reason) {
    await service.setUserSuspended(account.id, true, reason)
    setConfirming(false)
    onChanged(`${account.name} was suspended. They can't log in and are hidden from public pages.`)
  }

  const dialog = (
    <ReasonDialog
      open={confirming}
      title={`Suspend ${account.name}?`}
      label="Reason"
      requiredMessage="Write the reason for suspending this account."
      hint="Kept in the admin log. Suspended accounts can't log in and disappear from public pages until you reactivate them."
      confirmLabel="Suspend account"
      onCancel={() => setConfirming(false)}
      onConfirm={suspend}
    />
  )

  return {
    act: () => (account.suspended ? reactivate() : setConfirming(true)),
    label: account.suspended ? 'Reactivate' : 'Suspend',
    saving,
    dialog,
  }
}

// Suspend / Reactivate as a button. Hidden for admin accounts.
export default function SuspendButton({ account, onChanged, onError }) {
  const { act, label, saving, dialog } = useSuspendAction(account, { onChanged, onError })
  if (account.role === ROLES.ADMIN) return null

  return (
    <>
      <Button variant={account.suspended ? 'secondary' : 'danger'} onClick={act} disabled={saving}>
        {label}
      </Button>
      {dialog}
    </>
  )
}
