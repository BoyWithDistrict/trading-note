import Header from '@/components/Header/Header'
import './globals.css'
import { initDB } from '@/db'

export default function RootLayout({ children }) {
  if (typeof window !== 'undefined') {
    initDB()
  }

  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Header />
        <main className="w-full">
          {children}
        </main>
      </body>
    </html>
  )
}