import { useCallback, useMemo, useState } from 'react'
import { useAuth } from '../../../auth/useAuth.js'
import Badge from '../../../components/Badge.jsx'
import Button from '../../../components/Button.jsx'
import { TextField } from '../../../components/FormField.jsx'
import Modal from '../../../components/Modal.jsx'
import Notice from '../../../components/Notice.jsx'
import { SkeletonRows } from '../../../components/Skeleton.jsx'
import { useToast } from '../../../components/Toast/ToastContext.js'
import { formatDate } from '../../../utils/formatDate.js'
import { EDIT_WINDOW_HOURS, REVIEW_CRITERIA, REVIEW_REPORT_REASONS } from '../constants.js'
import { editDeadline, hasRating, isBefore } from '../ratings.js'
import { useRatingSummaries, useReviewsQuery, useReviewsService } from '../ReviewsContext.js'
import { REPLY_MAX_LENGTH, REPORT_DETAILS_MAX_LENGTH, ReviewError } from '../reviewsService.js'
import { RatingSummary, StarRating } from './Stars.jsx'
import styles from './ReviewList.module.css'

const PAGE_SIZE = 5
const SORTS = [
  { value: 'newest', label: 'Newest' },
  { value: 'highest', label: 'Highest' },
  { value: 'lowest', label: 'Lowest' },
]
const sorters = {
  newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
  highest: (a, b) => b.rating - a.rating || b.createdAt.localeCompare(a.createdAt),
  lowest: (a, b) => a.rating - b.rating || b.createdAt.localeCompare(a.createdAt),
}

const loadReported = (service) => service.getMyReportedReviewIds()

// Public reviews of one mechanic, tow company or shop: the rating summary (calculated from the
// reviews), then the reviews with sorting and "Load more". When the reviewed account itself is
// looking, each review gets a "Reply" form (one public reply, editable for 48 hours); other logged-in
// users can report a review.
export default function ReviewList({ targetId, title = 'Reviews' }) {
  const { user } = useAuth()
  const load = useCallback((service) => service.getReviewsFor(targetId), [targetId])
  const { data: reviews, error } = useReviewsQuery(load)
  const summary = useRatingSummaries()[targetId]
  const reported = useReviewsQuery(loadReported).data ?? []
  const [sort, setSort] = useState('newest')
  const [shown, setShown] = useState(PAGE_SIZE)
  const [reporting, setReporting] = useState(null)
  const isOwner = user?.id === targetId

  const sorted = useMemo(() => [...(reviews ?? [])].sort(sorters[sort]), [reviews, sort])

  if (error) return <p className={styles.muted}>Couldn't load the reviews.</p>
  if (!reviews) return <SkeletonRows rows={2} label="Loading reviews…" />

  return (
    <section className={styles.section} aria-labelledby={`reviews-${targetId}`}>
      <div className={styles.header}>
        <h2 id={`reviews-${targetId}`} className={styles.title}>
          {title}
        </h2>
        <RatingSummary summary={summary} />
        {summary && !hasRating(summary) && (
          <span className={styles.muted}>
            {summary.count} {summary.count === 1 ? 'review' : 'reviews'} so far
          </span>
        )}
      </div>

      {hasRating(summary) && <Breakdown summary={summary} type={reviews[0]?.targetType} />}

      {reviews.length === 0 ? (
        <p className={styles.muted}>No reviews yet. Customers can review after a completed and confirmed request.</p>
      ) : (
        <>
          <label className={styles.sort}>
            <span>Sort by</span>
            <select value={sort} onChange={(event) => setSort(event.target.value)} className={styles.select}>
              {SORTS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <ul className={styles.list}>
            {sorted.slice(0, shown).map((review) => (
              <ReviewItem
                key={review.id}
                review={review}
                isOwner={isOwner}
                canReport={Boolean(user) && review.customerId !== user.id}
                reported={reported.includes(review.id)}
                onReport={() => setReporting(review)}
              />
            ))}
          </ul>
          {shown < sorted.length && (
            <div>
              <Button variant="secondary" onClick={() => setShown((count) => count + PAGE_SIZE)}>
                Load more ({sorted.length - shown} more)
              </Button>
            </div>
          )}
        </>
      )}

      <ReportDialog review={reporting} onClose={() => setReporting(null)} />
    </section>
  )
}

// Average, 5 -> 1 star distribution and the average of each detailed rating.
function Breakdown({ summary, type }) {
  return (
    <div className={styles.breakdown}>
      <div className={styles.overall}>
        <p className={styles.bigAverage}>{summary.average.toFixed(1)}</p>
        <StarRating value={summary.average} size="md" />
        <p className={styles.muted}>
          {summary.count} {summary.count === 1 ? 'review' : 'reviews'}
        </p>
      </div>
      <ul className={styles.bars} aria-label="Reviews by stars">
        {summary.distribution.map((count, i) => (
          <li key={i} className={styles.barRow}>
            <span>{5 - i} ★</span>
            <span className={styles.bar} aria-hidden="true">
              <span className={styles.barFill} style={{ width: `${(count / summary.count) * 100}%` }} />
            </span>
            <span className={styles.muted}>{count}</span>
          </li>
        ))}
      </ul>
      <dl className={styles.aspects}>
        {(REVIEW_CRITERIA[type] ?? []).map(({ key, label }) => (
          <div key={key} className={styles.aspect}>
            <dt>{label}</dt>
            <dd>
              <StarRating value={summary.aspects[key]} /> {summary.aspects[key].toFixed(1)}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

function ReviewItem({ review, isOwner, canReport, reported, onReport }) {
  const [replying, setReplying] = useState(false)
  const criteria = REVIEW_CRITERIA[review.targetType] ?? []
  const canEditReply = isOwner && review.reply && isBefore(editDeadline(review.reply.createdAt))

  return (
    <li className={styles.review}>
      <div className={styles.reviewHeader}>
        <StarRating value={review.rating} />
        <span className={styles.author}>{review.customerName}</span>
        <span className={styles.muted}>
          {formatDate(review.createdAt)}
          {review.editedAt && ' · edited'}
        </span>
        <Badge tone="success">Verified service</Badge>
      </div>
      {review.serviceLabel && <p className={styles.muted}>{review.serviceLabel}</p>}
      {review.aspects && (
        <ul className={styles.chips} aria-label="Detailed ratings">
          {criteria.map(({ key, label }) => (
            <li key={key} className={styles.chip}>
              {label}: <strong>{review.aspects[key]}/5</strong>
            </li>
          ))}
        </ul>
      )}
      {review.comment && <p className={styles.comment}>{review.comment}</p>}

      {review.reply && !replying && (
        <div className={styles.reply}>
          <p className={styles.replyLabel}>
            Reply from the owner · {formatDate(review.reply.createdAt)}
            {review.reply.editedAt && ' · edited'}
          </p>
          <p>{review.reply.text}</p>
          {canEditReply && (
            <Button size="sm" variant="ghost" onClick={() => setReplying(true)}>
              Edit reply
            </Button>
          )}
        </div>
      )}
      {isOwner && (!review.reply || replying) && (
        <ReplyForm review={review} editing={replying} onDone={() => setReplying(false)} />
      )}

      {canReport && (
        <div>
          <Button size="sm" variant="ghost" onClick={onReport} disabled={reported}>
            {reported ? 'Reported' : 'Report'}
          </Button>
        </div>
      )}
    </li>
  )
}

function ReplyForm({ review, editing, onDone }) {
  const service = useReviewsService()
  const toast = useToast()
  const [open, setOpen] = useState(editing)
  const [text, setText] = useState(review.reply?.text ?? '')
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const id = `reply-${review.id}`

  if (!open) {
    return (
      <div>
        <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
          Reply publicly
        </Button>
      </div>
    )
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!text.trim()) {
      setError('Write your reply.')
      document.getElementById(id)?.focus()
      return
    }
    setSaving(true)
    try {
      await (editing ? service.editReply(review.id, text) : service.replyToReview(review.id, text))
      toast.success(editing ? 'Your reply is updated.' : 'Your reply is posted under the review.')
      onDone()
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <form className={styles.replyForm} onSubmit={handleSubmit} noValidate>
      <TextField
        id={id}
        as="textarea"
        rows={3}
        label="Your public reply"
        hint={`Everyone can read it. You can reply once and edit it for ${EDIT_WINDOW_HOURS} hours. ${text.length}/${REPLY_MAX_LENGTH}`}
        maxLength={REPLY_MAX_LENGTH}
        value={text}
        onChange={(event) => {
          setText(event.target.value)
          setError(null)
        }}
        error={error}
      />
      <div className={styles.replyActions}>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            setOpen(false)
            onDone()
          }}
          disabled={saving}
        >
          Cancel
        </Button>
        <Button size="sm" type="submit" loading={saving}>
          {editing ? 'Save reply' : 'Post reply'}
        </Button>
      </div>
    </form>
  )
}

// "Report" a review to the admins: a reason and optional details.
function ReportDialog({ review, onClose }) {
  return (
    <Modal open={Boolean(review)} title="Report this review" onClose={onClose}>
      {review && <ReportForm review={review} onClose={onClose} />}
    </Modal>
  )
}

function ReportForm({ review, onClose }) {
  const service = useReviewsService()
  const toast = useToast()
  const [reason, setReason] = useState('')
  const [details, setDetails] = useState('')
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError(null)
    setSaving(true)
    try {
      await service.reportReview(review.id, { reason, details })
      toast.success('Thanks. An admin will look at this review.')
      onClose()
    } catch (error) {
      if (error instanceof ReviewError && error.field) setErrors({ [error.field]: error.message })
      else setFormError(error.message)
      setSaving(false)
    }
  }

  return (
    <form className={styles.replyForm} onSubmit={handleSubmit} noValidate>
      <TextField
        id="report-reason"
        as="select"
        label="Why are you reporting it?"
        value={reason}
        onChange={(event) => {
          setReason(event.target.value)
          setErrors({})
        }}
        error={errors.reason}
      >
        <option value="">Choose a reason</option>
        {REVIEW_REPORT_REASONS.map(({ value, label }) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </TextField>
      <TextField
        id="report-details"
        as="textarea"
        rows={3}
        label="Details"
        optional
        maxLength={REPORT_DETAILS_MAX_LENGTH}
        hint={`${details.length}/${REPORT_DETAILS_MAX_LENGTH}`}
        value={details}
        onChange={(event) => setDetails(event.target.value)}
        error={errors.details}
      />
      {formError && <Notice tone="danger">{formError}</Notice>}
      <div className={styles.replyActions}>
        <Button variant="secondary" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" variant="danger" loading={saving}>
          Send report
        </Button>
      </div>
    </form>
  )
}
