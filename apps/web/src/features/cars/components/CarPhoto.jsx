import FileImage from '../../../components/FileImage.jsx'
import { carTitle } from '../format.js'
import styles from './CarPhoto.module.css'

// The car's photo, or a car icon on a plain background when there is none.
export default function CarPhoto({ car, className = '' }) {
  return (
    <div className={`${styles.photo} ${className}`.trim()}>
      {car.photo ? (
        <FileImage file={car.photo} alt={carTitle(car)} className={styles.image} />
      ) : (
        <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M3 13l2-5a2 2 0 0 1 1.9-1.4h10.2A2 2 0 0 1 19 8l2 5v4a1 1 0 0 1-1 1h-1a2 2 0 0 1-4 0H9a2 2 0 0 1-4 0H4a1 1 0 0 1-1-1v-4Zm0 0h18"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </div>
  )
}
