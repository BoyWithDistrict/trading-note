import styles from './PrimaryButton.module.css'

export default function PrimaryButton({ 
  children, 
  onClick, 
  disabled = false,
  className = '',
  icon: Icon,
  ...props 
}) {
  return (
    <button
      className={`${styles.button} ${className}`}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {Icon && <Icon className={styles.icon} />}
      <span>{children}</span>
    </button>
  )
}