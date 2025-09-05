'use client'
import ScreenshotManager from '@/features/trades/components/ScreenshotManager/ScreenshotManager'
import ClientInitializer from '@/ClientInitializer'

export default function ScreenshotsPage() {
  return (
    <>
      <ClientInitializer />
      <ScreenshotManager />
    </>
  )
}