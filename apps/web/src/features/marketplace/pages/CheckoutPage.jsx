import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../../../auth/useAuth.js'
import { ROLES } from '../../../authorization/roles.js'
import Button from '../../../components/Button.jsx'
import EmptyState from '../../../components/EmptyState.jsx'
import { SkeletonRows } from '../../../components/Skeleton.jsx'
import { addressProblem, choiceFor, deliveryProblem, toDraft } from '../checkout.js'
import { useCartQuery } from '../CartContext.js'
import CheckoutProgress from '../components/CheckoutProgress.jsx'
import { DeliveryStep, PaymentStep, ReviewStep, ServiceRequestStep } from '../components/CheckoutSteps.jsx'
import { useOrdersQuery, useOrdersService } from '../OrdersContext.js'
import { FULFILLMENT_METHODS } from '../shopCommerce.js'
import styles from './CheckoutPage.module.css'

const loadCart = (service) => service.getCartView()
const loadOptions = (service) => service.getCheckoutOptions()

const STEP_DELIVERY = { id: 'delivery', title: 'Delivery' }
const STEP_PAYMENT = { id: 'payment', title: 'Payment' }
const STEP_REQUEST = { id: 'request', title: 'Service request' }
const STEP_REVIEW = { id: 'review', title: 'Review' }

// /checkout - delivery or pickup per shop, payment per shop, (mechanics) the service request the
// parts are for, then a review of everything. Placing the order creates one order per shop under
// one checkout number and goes to the confirmation page.
export default function CheckoutPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const orders = useOrdersService()
  const { data: view, error } = useCartQuery(loadCart)
  const { data: options } = useOrdersQuery(loadOptions)

  const [stepIndex, setStepIndex] = useState(0)
  const [choices, setChoices] = useState({})
  const [serviceRequestId, setServiceRequestId] = useState('')
  const [errors, setErrors] = useState({})
  const [placing, setPlacing] = useState(false)
  const [placeError, setPlaceError] = useState(null)
  const [placed, setPlaced] = useState(false)
  const headingRef = useRef(null)
  const firstRender = useRef(true)

  const steps = user.role === ROLES.MECHANIC ? [STEP_DELIVERY, STEP_PAYMENT, STEP_REQUEST, STEP_REVIEW] : [STEP_DELIVERY, STEP_PAYMENT, STEP_REVIEW]
  const step = steps[stepIndex]

  // Move keyboard and screen reader focus to the new step's heading.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    headingRef.current?.focus()
    window.scrollTo({ top: 0 })
  }, [stepIndex])

  if (error) return <EmptyState icon="⚠" title="Couldn't load your cart" description={error.message} />
  if (!view || !options) return <SkeletonRows rows={4} label="Loading checkout…" />
  if (view.groups.length === 0) {
    if (placed) return null // the order was just placed: we are on our way to the confirmation page
    return (
      <EmptyState
        icon="🛒"
        headingLevel="h1"
        title="Nothing to check out"
        description="Your cart is empty."
        action={<Button to="/marketplace">Browse parts</Button>}
      />
    )
  }

  const { addresses, workshop, serviceRequests } = options
  const request = serviceRequests.find((r) => r.id === serviceRequestId) ?? null

  function updateChoice(shopId, changes) {
    setChoices((current) => ({ ...current, [shopId]: { ...current[shopId], ...changes } }))
    setErrors({})
  }

  // A linked service request sends the parts to the mechanic's workshop, where the shop delivers there.
  function changeServiceRequest(id) {
    setServiceRequestId(id)
    if (!id || !workshop) return
    for (const group of view.groups) {
      if (group.commerce.delivery && !addressProblem(group.commerce, workshop)) {
        updateChoice(group.shop.id, { method: FULFILLMENT_METHODS.DELIVERY, addressId: workshop.id })
      }
    }
  }

  function validateStep() {
    if (step.id !== STEP_DELIVERY.id) return true
    const found = {}
    for (const group of view.groups) {
      const problem = deliveryProblem(group, choiceFor(group, choices), addresses)
      if (problem) found[group.shop.id] = problem
    }
    setErrors(found)
    return Object.keys(found).length === 0
  }

  function goNext() {
    if (validateStep()) setStepIndex((index) => index + 1)
  }

  async function handlePlace() {
    setPlaceError(null)
    setPlacing(true)
    try {
      const result = await orders.placeOrder(toDraft(view, choices, addresses, serviceRequestId))
      setPlaced(true)
      navigate(`/checkout/confirmation/${result.checkoutId}`, { replace: true })
    } catch (err) {
      setPlaceError(err.message)
      setPlacing(false)
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Button to="/cart" variant="ghost" size="sm">
          ← Back to cart
        </Button>
        <h1 className={styles.title} ref={headingRef} tabIndex={-1}>
          Checkout: {step.title}
        </h1>
      </header>

      <CheckoutProgress steps={steps} current={stepIndex} onGoTo={setStepIndex} />

      {step.id === STEP_DELIVERY.id && (
        <DeliveryStep
          view={view}
          choices={choices}
          addresses={addresses}
          errors={errors}
          onChange={updateChoice}
          onAddAddress={(address) => orders.addAddress(address)}
        />
      )}
      {step.id === STEP_PAYMENT.id && <PaymentStep view={view} choices={choices} errors={errors} onChange={updateChoice} />}
      {step.id === STEP_REQUEST.id && (
        <ServiceRequestStep requests={serviceRequests} value={serviceRequestId} onChange={changeServiceRequest} workshop={workshop} view={view} />
      )}
      {step.id === STEP_REVIEW.id && (
        <ReviewStep
          view={view}
          choices={choices}
          addresses={addresses}
          request={request}
          error={placeError}
          placing={placing}
          onPlace={handlePlace}
        />
      )}

      <div className={styles.nav}>
        {stepIndex > 0 && (
          <Button variant="secondary" size="lg" onClick={() => setStepIndex((index) => index - 1)} disabled={placing}>
            Back
          </Button>
        )}
        {step.id !== STEP_REVIEW.id && (
          <Button size="lg" onClick={goNext}>
            Continue
          </Button>
        )}
      </div>
    </div>
  )
}
