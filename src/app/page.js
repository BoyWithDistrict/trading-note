'use client'
import TradeJournal from '@/features/trades/components/TradeJournal/TradeJournal'
import ClientInitializer from '@/ClientInitializer'

export default function Home() {
  return (
    <>
      <ClientInitializer />
      <TradeJournal />
    </>
  )
}