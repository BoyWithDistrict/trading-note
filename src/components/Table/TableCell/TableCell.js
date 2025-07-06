// TableCell.js
'use client'
import styles from './TableCell.module.css'

export default function TableCell({ 
  children, 
  numeric = false, 
  center = false,
  profit = null,
  onClick 
}) {
  const className = [
    styles.cell,
    numeric && styles.numeric,
    center && styles.center,
    profit !== null && (profit >= 0 ? styles.profitNegative : styles.profitPositive)
  ].filter(Boolean).join(' ')

  return (
    <td 
      className={className}
      onClick={onClick}
      style={onClick ? { cursor: 'pointer' } : {}}
    >
      {children}
    </td>
  )
}