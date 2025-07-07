'use client'
import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db'
import { DEFAULT_TRADE } from '@/features/trades/constants'
import TradeForm from '@/features/trades/components/TradeForm/TradeForm'
import Table from '@/components/Table/Table'
import TableHeader from '@/components/Table/TableHeader/TableHeader'
import TradeRow from '@/features/trades/components/TradeRow/TradeRow'
import { FiUpload, FiDownload, FiPlus, FiBarChart2 } from 'react-icons/fi'
import CsvImporter from '@/features/trades/components/FileImporter'
import PrimaryButton from '@/components/Button/PrimaryButton'
import SecondaryButton from '@/components/Button/SecondaryButton'
import TradeChart from '@/features/TradeChart'
import TradingCalendar from '@/features/trades/components/TradingCalendar/TradingCalendar' // Импорт календаря

export default function TradeJournal() {
  const trades = useLiveQuery(() => db.trades.toArray()) || []
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentTrade, setCurrentTrade] = useState(DEFAULT_TRADE)
  const [importMode, setImportMode] = useState(false)
  const [selectedTradeForChart, setSelectedTradeForChart] = useState(null)
  const [activeTab, setActiveTab] = useState('journal')

  const tabs = [
    { id: 'journal', label: 'Trades' },
    { id: 'emotionality', label: 'Emotionality' },
    { id: 'patterns', label: 'Patterns' },
    { id: 'plan', label: 'Plan' },
  ]

  const handleImportComplete = async (importedTrades) => {
    try {
      await db.trades.bulkAdd(
        importedTrades.map(trade => ({
          ...trade,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }))
      )
      setImportMode(false)
    } catch (error) {
      console.error('Ошибка сохранения:', error)
    }
  }

  const handleAdd = async (newTrade) => {
    try {
      await db.trades.add({
        ...newTrade,
        entryTime: new Date(newTrade.entryTime).toISOString(),
        exitTime: new Date(newTrade.exitTime).toISOString(),
        createdAt: new Date().toISOString()
      })
      setIsModalOpen(false)
      setCurrentTrade(DEFAULT_TRADE)
    } catch (error) {
      console.error('Error adding trade:', error)
    }
  }

  const handleUpdate = async (updatedTrade) => {
    try {
      await db.trades.update(updatedTrade.id, {
        ...updatedTrade,
        entryTime: new Date(updatedTrade.entryTime).toISOString(),
        exitTime: new Date(updatedTrade.exitTime).toISOString(),
        updatedAt: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error updating trade:', error)
    }
  }

  const handleDelete = async (id) => {
    try {
      await db.trades.delete(id)
    } catch (error) {
      console.error('Error deleting trade:', error)
    }
  }

  const handleExport = () => {
    if (trades.length === 0) {
      alert('No data to export')
      return
    }
    
    const headers = [
      'Ticker', 'Strategy', 'Entry Time', 'Exit Time', 
      'Direction', 'Entry Price', 'Stop Loss', 'Take Profit',
      'Lot', 'Risk Percent', 'Profit'
    ]
    
    const csvContent = [
      headers.join(','),
      ...trades.map(trade => [
        trade.ticker,
        trade.strategy,
        new Date(trade.entryTime).toISOString(),
        new Date(trade.exitTime).toISOString(),
        trade.direction,
        trade.entryPrice,
        trade.stopLoss,
        trade.takeProfit,
        trade.lot,
        trade.riskPercent,
        trade.profit
      ].map(field => `"${field}"`).join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `trades_export_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="px-4 w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Journal</h1>
        
        {/* Навигация по табам */}
        <div className="w-full px-4 pt-2">
          <div className="flex gap-8">
            {tabs.map((tab) => (
              <div
                key={tab.id}
                className={`py-2 cursor-pointer font-medium ${
                  activeTab === tab.id 
                    ? 'text-black border-b border-black' 
                    : 'text-gray-500'
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </div>
            ))}
          </div>
          <div className="w-full h-px bg-gray-200 mt-[-1px]" />
        </div>
      </div>

      {/* Содержимое таба Trades */}
      {activeTab === 'journal' && (
        <>
          <Table>
            <thead>
              <tr>
                <TableHeader>Ticker</TableHeader>
                <TableHeader>Strategy</TableHeader>
                <TableHeader>Entry</TableHeader>
                <TableHeader>Exit</TableHeader>
                <TableHeader>Direction</TableHeader>
                <TableHeader numeric>Price</TableHeader>
                <TableHeader numeric>SL</TableHeader>
                <TableHeader numeric>TP</TableHeader>
                <TableHeader numeric>Lot</TableHeader>
                <TableHeader numeric>Risk</TableHeader>
                <TableHeader numeric>Profit</TableHeader>
                <TableHeader>Actions</TableHeader>
              </tr>
            </thead>
            <tbody>
              {trades.map(trade => (
                <TradeRow 
                  key={trade.id}
                  trade={{
                    ...trade,
                    entryPrice: Number(trade.entryPrice),
                    stopLoss: Number(trade.stopLoss),
                    takeProfit: Number(trade.takeProfit),
                    lot: Number(trade.lot),
                    riskPercent: Number(trade.riskPercent),
                    profit: Number(trade.profit)
                  }}
                  onDelete={handleDelete}
                  onUpdate={handleUpdate}
                  onShowChart={() => setSelectedTradeForChart(trade)}
                />
              ))}
            </tbody>
          </Table>

          <div className="mt-4 flex gap-2">
            <PrimaryButton
              onClick={() => setIsModalOpen(true)}
              icon={FiPlus}
            >
              Add trade
            </PrimaryButton>
            <SecondaryButton
              onClick={() => setImportMode(!importMode)}
              icon={FiUpload}
            >
              Import data
            </SecondaryButton>
            <SecondaryButton
              onClick={handleExport}
              icon={FiDownload}
              disabled={trades.length === 0}
            >
              Export CSV
            </SecondaryButton>
          </div>
        </>
      )}

      {/* Содержимое таба Emotionality */}
      {activeTab === 'emotionality' && (
        <div className="py-8 text-center text-gray-500">
          Emotionality Content
        </div>
      )}

      {/* Содержимое таба Patterns */}
      {activeTab === 'patterns' && (
        <div className="py-8 text-center text-gray-500">
          Patterns Content
        </div>
      )}

      {/* Содержимое таба Plan - календарь */}
      {activeTab === 'plan' && (
        <div className="py-4">
          <TradingCalendar />
        </div>
      )}

      {/* Импорт данных */}
      {importMode && (
        <div className="mt-4 p-4 border rounded-lg bg-gray-50">
          <CsvImporter onImportComplete={handleImportComplete} />
        </div>
      )}

      {/* Модальное окно добавления/редактирования сделки */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl">
            <TradeForm
              trade={currentTrade}
              onChange={setCurrentTrade}
              onSubmit={handleAdd}
              onCancel={() => {
                setIsModalOpen(false)
                setCurrentTrade(DEFAULT_TRADE)
              }}
            />
          </div>
        </div>
      )}

      {/* Модальное окно графика сделки */}
      {selectedTradeForChart && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <TradeChart 
            trade={selectedTradeForChart} 
            onClose={() => setSelectedTradeForChart(null)} 
          />
        </div>
      )}
    </div>
  )
}