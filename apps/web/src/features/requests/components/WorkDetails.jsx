import { formatPrice } from '../../marketplace/format.js'
import styles from './WorkDetails.module.css'

// What the mechanic found and did on a completed service request: confirmed diagnosis, work done,
// parts used (with prices), labor and total. Used by car histories and service reports.
export default function WorkDetails({ completion }) {
  const { confirmedDiagnosis, workDone, partsUsed = [], laborIls = 0, totalIls } = completion
  return (
    <div className={styles.details}>
      <dl className={styles.text}>
        <div>
          <dt>Confirmed diagnosis</dt>
          <dd>{confirmedDiagnosis}</dd>
        </div>
        <div>
          <dt>Work done</dt>
          <dd>{workDone}</dd>
        </div>
      </dl>

      <table className={styles.table}>
        <caption className={styles.caption}>Parts and cost</caption>
        <thead>
          <tr>
            <th scope="col">Item</th>
            <th scope="col" className={styles.number}>
              Qty
            </th>
            <th scope="col" className={styles.number}>
              Price
            </th>
            <th scope="col" className={styles.number}>
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {partsUsed.length === 0 && (
            <tr>
              <td colSpan={4} className={styles.muted}>
                No parts used
              </td>
            </tr>
          )}
          {partsUsed.map((part) => (
            <tr key={part.name}>
              <td>{part.name}</td>
              <td className={styles.number}>{part.quantity}</td>
              <td className={styles.number}>{formatPrice(part.priceIls)}</td>
              <td className={styles.number}>{formatPrice(part.quantity * part.priceIls)}</td>
            </tr>
          ))}
          <tr>
            <td colSpan={3}>Labor</td>
            <td className={styles.number}>{formatPrice(laborIls)}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <th scope="row" colSpan={3}>
              Total paid
            </th>
            <td className={`${styles.number} ${styles.total}`}>{formatPrice(totalIls)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
