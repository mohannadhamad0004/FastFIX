import Button from '../components/Button.jsx'
import styles from './ShopOwnerDashboard.module.css'

// TODO: replace with real API call
const inventory = [
  { id: 'P-201', name: 'Serpentine belt (VW 1.4 TSI)', price: 38.5, stock: 14 },
  { id: 'P-202', name: 'Brake pads, front set (Golf / Jetta / Passat)', price: 64, stock: 8 },
  { id: 'P-203', name: 'Oil filter (Toyota 1.8)', price: 9.9, stock: 42 },
  { id: 'P-204', name: 'LED headlight bulbs H7 (pair)', price: 55, stock: 3 },
  { id: 'P-205', name: 'Ignition coil (Corolla 2014-2019)', price: 47.25, stock: 0 },
]

const LOW_STOCK = 5

// TODO: use the shop's currency once shop settings exist
const formatPrice = (value) =>
  value.toLocaleString(undefined, { style: 'currency', currency: 'USD' })

export default function ShopOwnerDashboard() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Parts inventory</h1>
          <p className={styles.subtitle}>Parts and accessories listed in your shop.</p>
        </div>
        {/* TODO: open the add-part form */}
        <Button disabled>Add new part</Button>
      </header>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Part</th>
              <th className={styles.numeric}>Price</th>
              <th className={styles.numeric}>Stock</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map((part) => (
              <tr key={part.id}>
                <td>
                  {part.name}
                  <span className={styles.partId}>{part.id}</span>
                </td>
                <td className={styles.numeric}>{formatPrice(part.price)}</td>
                <td
                  className={`${styles.numeric} ${part.stock <= LOW_STOCK ? styles.lowStock : ''}`}
                >
                  {part.stock === 0 ? 'Out of stock' : part.stock}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
