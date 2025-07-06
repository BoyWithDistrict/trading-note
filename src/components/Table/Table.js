'use client'
import styles from './Table.module.css'

export default function Table({ children }) {
  return (
    <div className={styles.container}>
      <table className={styles.table}>
        {children}
      </table>
    </div>
  )
}