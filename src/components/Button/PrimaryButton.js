import styles from './PrimaryButton.module.css'

export default function PrimaryButton({ 
  children, 
  onClick, 
  disabled = false,
  className = '',
  icon: Icon,
  fullWidth = false,
  ...props 
}) {
  const fullWidthClass = fullWidth ? styles.fullWidth : '';
  
  return (
    <button
      className={`${styles.button} ${className} ${fullWidthClass}`}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {Icon && <Icon className={styles.icon} />}
      <span>{children}</span>
    </button>
  )
}