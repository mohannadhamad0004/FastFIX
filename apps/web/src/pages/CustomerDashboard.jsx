import { useState } from 'react'
import Button from '../components/Button.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import styles from './CustomerDashboard.module.css'

// TODO: replace with real API call
const cars = [
  { id: 1, make: 'Volkswagen', model: 'Golf', year: 2018, plate: 'ABC 1234', mileageKm: 84200 },
  { id: 2, make: 'Toyota', model: 'Corolla', year: 2015, plate: 'XYZ 5678', mileageKm: 132500 },
  { id: 3, make: 'Hyundai', model: 'Elantra', year: 2021, plate: 'LMN 9012', mileageKm: 36900 },
]

// TODO: replace with real API call
const serviceRequests = [
  {
    id: 'SR-1042',
    car: 'Volkswagen Golf 2018',
    issue: 'Squealing noise when starting the engine',
    submittedOn: '2026-09-21',
    status: 'Diagnosed',
  },
  {
    id: 'SR-1037',
    car: 'Toyota Corolla 2015',
    issue: 'Check engine light is on',
    submittedOn: '2026-09-14',
    status: 'In repair',
  },
  {
    id: 'SR-1019',
    car: 'Toyota Corolla 2015',
    issue: 'Oil spot under the car',
    submittedOn: '2026-08-30',
    status: 'Completed',
  },
  {
    id: 'SR-1003',
    car: 'Hyundai Elantra 2021',
    issue: 'Grinding sound when braking',
    submittedOn: '2026-08-02',
    status: 'Cancelled',
  },
]

const statusTone = {
  'Pending review': 'warning',
  Diagnosed: 'info',
  'In repair': 'info',
  Completed: 'success',
  Cancelled: 'danger',
}

export default function CustomerDashboard() {
  const [showReportForm, setShowReportForm] = useState(false)

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>My garage</h1>
          <p className={styles.subtitle}>Your cars and service requests.</p>
        </div>
        <Button onClick={() => setShowReportForm((open) => !open)}>
          {showReportForm ? 'Close' : 'Report a new issue'}
        </Button>
      </header>

      {showReportForm && (
        <section className={styles.card}>
          <h2 className={styles.sectionTitle}>Report a new issue</h2>
          {/* TODO: submit to the diagnosis API and show the AI pre-report */}
          <form className={styles.form} onSubmit={(event) => event.preventDefault()}>
            <label className={styles.field}>
              <span>Car</span>
              <select defaultValue={cars[0].id}>
                {cars.map((car) => (
                  <option key={car.id} value={car.id}>
                    {car.make} {car.model} {car.year}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span>What is happening?</span>
              <textarea rows={3} placeholder="e.g. Rattling noise from the front when driving over bumps" />
            </label>
            <label className={styles.field}>
              <span>Photo, video or audio of the problem</span>
              <input type="file" accept="image/*,video/*,audio/*" />
            </label>
            <div>
              <Button type="submit" disabled>
                Submit for AI diagnosis
              </Button>
              <p className={styles.hint}>Uploading is not connected yet.</p>
            </div>
          </form>
        </section>
      )}

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>My cars</h2>
        <ul className={styles.carGrid}>
          {cars.map((car) => (
            <li key={car.id} className={styles.card}>
              <h3 className={styles.carName}>
                {car.make} {car.model}
              </h3>
              <p className={styles.muted}>
                {car.year} · {car.plate}
              </p>
              <p className={styles.muted}>{car.mileageKm.toLocaleString()} km</p>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Past service requests</h2>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Request</th>
                <th>Car</th>
                <th>Issue</th>
                <th>Submitted</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {serviceRequests.map((request) => (
                <tr key={request.id}>
                  <td>{request.id}</td>
                  <td>{request.car}</td>
                  <td>{request.issue}</td>
                  <td>{request.submittedOn}</td>
                  <td>
                    <StatusBadge label={request.status} tone={statusTone[request.status]} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
