// Header.js
'use client'
import Link from 'next/link'
import styles from './Header.module.css'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'

export default function Header() {
  const pathname = usePathname()
  const router = useRouter()

  // Проверяем активность страниц
  const isHomeActive = pathname === '/' || pathname === '/journal'
  const isScreenshotsActive = pathname === '/screenshots'
  const isSummaryActive = pathname === '/summary'
  const isNotesActive = pathname === '/notes'

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
          href="/"
          className={`${styles.navLink} ${isHomeActive ? styles.activeNavItem : ''}`}
        >
          <span className={isHomeActive ? styles.navText : styles.inactiveNavText}>
            Journal
          </span>
        </Link>
        
        <Link 
          href="/screenshots" 
          className={`${styles.navLink} ${isScreenshotsActive ? styles.activeNavItem : ''}`}
        >
          <span className={isScreenshotsActive ? styles.navText : styles.inactiveNavText}>
            Screenshots
          </span>
        </Link>
        
        <Link 
          href="/summary" 
          className={`${styles.navLink} ${isSummaryActive ? styles.activeNavItem : ''}`}
        >
          <span className={isSummaryActive ? styles.navText : styles.inactiveNavText}>
            Summary
          </span>
        </Link>
        
        <Link 
          href="/notes" 
          className={`${styles.navLink} ${isNotesActive ? styles.activeNavItem : ''}`}
        >
          <span className={isNotesActive ? styles.navText : styles.inactiveNavText}>
            Notes of emotions
          </span>
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