'use client'
import styles from './TableHeader.module.css'

export default function TableHeader({ children, numeric = false }) {
  return (
    <th className={`${styles.header} ${numeric ? styles.numeric : ''}`}>
      <div className={styles.headerContent}>
        {children}
      </div>
    </th>
  )
}