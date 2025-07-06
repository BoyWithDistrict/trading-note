import styles from './SecondaryButton.module.css'

export default function SecondaryButton({ 
  children, 
  onClick, 
  disabled = false,
  className = '',
  icon: Icon, // Добавляем поддержку иконки
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
      <span className={styles.text}>{children}</span>
    </button>
  )
}