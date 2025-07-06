// Header.js
'use client'
import Link from 'next/link'
import styles from './Header.module.css'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'

export default function Header() {
  const pathname = usePathname()
  const router = useRouter()

  // Проверяем активность главной страницы (и /journal)
  const isHomeActive = pathname === '/' || pathname === '/journal'

  return (
    <header className={styles.header}>
      <div 
        className={styles.logo}
        onClick={() => router.push('/')}
      >
        trading note
      </div>

      <nav className={styles.navLinks}>
        <Link 
          href="/" // Изменено с "/journal" на "/"
          className={`${styles.navLink} ${isHomeActive ? styles.activeNavItem : ''}`}
        >
          <span className={isHomeActive ? styles.navText : styles.inactiveNavText}>
            Journal
          </span>
        </Link>
        
        <Link 
          href="/summary" 
          className={styles.navLink}
        >
          <span className={styles.inactiveNavText}>Summary</span>
        </Link>
        
        <Link 
          href="/notes" 
          className={styles.navLink}
        >
          <span className={styles.inactiveNavText}>Notes of emotions</span>
        </Link>
      </nav>

      <div className={styles.userAvatar}>
        <div className={styles.avatar}>
          <span className={styles.avatarText}>АЛ</span>
        </div>
      </div>
    </header>
  )
}