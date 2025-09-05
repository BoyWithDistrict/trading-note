'use client'
import { useState, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, initDB } from '@/db'
import { DEFAULT_TRADE } from '@/features/trades/constants'
import TradeForm from '@/features/trades/components/TradeForm/TradeForm'
import Table from '@/components/Table/Table'
import TableHeader from '@/components/Table/TableHeader/TableHeader'
import TradeRow from '@/features/trades/components/TradeRow/TradeRow'
import { FiUpload, FiDownload, FiPlus, FiBarChart2, FiBrain } from 'react-icons/fi'
import CsvImporter from '@/features/trades/components/FileImporter'
import PrimaryButton from '@/components/Button/PrimaryButton'
import SecondaryButton from '@/components/Button/SecondaryButton'
import TradeChart from '@/features/TradeChart'
import TradingCalendar from '@/features/trades/components/TradingCalendar/TradingCalendar'
import TradePlanModal from '@/features/trades/components/TradePlanModal/TradePlanModal'
import PieChart from '@/components/PieChart/PieChart'
import AIAnalysis from '@/features/ai/components/AIAnalysis'

export default function TradeJournal() {
  // Инициализация базы данных
  useEffect(() => {
    initDB();
  }, []);

  const trades = useLiveQuery(() => db.trades.toArray()) || []
  const tradePlans = useLiveQuery(() => db.tradePlans.toArray()) || []
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false)
  const [currentTrade, setCurrentTrade] = useState(DEFAULT_TRADE)
  const [currentPlan, setCurrentPlan] = useState(null)
  const [importMode, setImportMode] = useState(false)
  const [selectedTradeForChart, setSelectedTradeForChart] = useState(null)
  const [activeTab, setActiveTab] = useState('journal')
  const [availablePlans, setAvailablePlans] = useState([])
  const [selectedDateForPlan, setSelectedDateForPlan] = useState(null)
  const [selectedTradeForAnalysis, setSelectedTradeForAnalysis] = useState(null)

  const tabs = [
    { id: 'journal', label: 'Trades' },
    { id: 'emotionality', label: 'Emotionality' },
    { id: 'patterns', label: 'Patterns' },
    { id: 'plan', label: 'Plan' },
    { id: 'ai', label: 'AI Analysis', icon: FiBrain }, // Новая вкладка для ИИ-анализа
  ]

  // Загрузка планов при изменении даты входа
  useEffect(() => {
    const loadPlans = async () => {
      if (currentTrade.entryTime) {
        const entryDate = new Date(currentTrade.entryTime);
        const year = entryDate.getFullYear();
        const month = (entryDate.getMonth() + 1).toString().padStart(2, '0');
        const day = entryDate.getDate().toString().padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        
        const plans = await db.tradePlans
          .where('date')
          .equals(dateStr)
          .toArray();
        
        setAvailablePlans(plans);
      }
    };
    
    loadPlans();
  }, [currentTrade.entryTime]);

  // Расчет расширенной статистики для диаграммы
  const calculateExtendedStats = () => {
    return {
      planned: {
        value: trades.filter(t => t.isPlanned).length,
        profitable: trades.filter(t => t.isPlanned && t.profit > 0).length,
        losing: trades.filter(t => t.isPlanned && t.profit < 0).length,
      },
      unplanned: {
        value: trades.filter(t => !t.isPlanned).length,
        profitable: trades.filter(t => !t.isPlanned && t.profit > 0).length,
        losing: trades.filter(t => !t.isPlanned && t.profit < 0).length,
      }
    };
  };
  
  const extendedStats = calculateExtendedStats();

  // Данные для круговой диаграммы
  const pieData = [
    {
      title: 'По плану',
      value: extendedStats.planned.value,
      profitable: extendedStats.planned.profitable,
      losing: extendedStats.planned.losing,
      color: '#10B981'
    },
    {
      title: 'Не по плану',
      value: extendedStats.unplanned.value,
      profitable: extendedStats.unplanned.profitable,
      losing: extendedStats.unplanned.losing,
      color: '#EF4444'
    }
  ];

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
        createdAt: new Date().toISOString(),
        planId: newTrade.planId || null,
        isPlanned: newTrade.isPlanned || false
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
        updatedAt: new Date().toISOString(),
        planId: updatedTrade.planId || null,
        isPlanned: updatedTrade.isPlanned || false
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
      'Lot', 'Risk Percent', 'Profit', 'Plan ID', 'Is Planned'
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
        trade.profit,
        trade.planId || '',
        trade.isPlanned ? 'Yes' : 'No'
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

  // Обработчик для календаря при клике на день
  const handleDayClick = (day) => {
    setSelectedDateForPlan(day);
    setIsPlanModalOpen(true);
  };

  // Обработчик для календаря при клике на план
  const handlePlanClick = (plan) => {
    setCurrentPlan(plan);
    setIsPlanModalOpen(true);
  };

  // Обновление планов после добавления/изменения
  const refreshPlans = async () => {
    // Обновляем планы в компоненте
    setCurrentPlan(null);
  };

  // Генерация промта для ИИ на основе сделки
  const generateTradePrompt = (trade) => {
    return `Проанализируй торговую операцию:
Тикер: ${trade.ticker}
Стратегия: ${trade.strategy}
Направление: ${trade.direction}
Цена входа: ${trade.entryPrice}
Стоп-лосс: ${trade.stopLoss}
Тейк-профит: ${trade.takeProfit}
Лот: ${trade.lot}
Риск: ${trade.riskPercent}%
Результат: ${trade.profit > 0 ? 'Прибыль' : 'Убыток'} ${Math.abs(trade.profit)}
Дата входа: ${new Date(trade.entryTime).toLocaleDateString()}
${trade.emotion ? `Эмоции: ${trade.emotion}` : ''}

Дайте подробный анализ этой сделки, укажите сильные и слабые стороны, предложите улучшения.`;
  };

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
                className={`py-2 cursor-pointer font-medium flex items-center gap-1 ${activeTab === tab.id 
                  ? 'text-black border-b border-black' 
                  : 'text-gray-500'}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.icon && <tab.icon size={16} />}
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
          {/* Круговая диаграмма статистики */}
          <div className="mb-6 bg-white p-4 rounded-lg shadow flex flex-col items-center">
            <div className="text-lg font-semibold mb-4">Статистика сделок</div>
            <PieChart data={pieData} width={300} height={300} />
            <div className="mt-4 text-sm text-gray-600">
              Всего сделок: {trades.length}
            </div>
          </div>

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
                <TableHeader center>Plan</TableHeader>
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
                    profit: Number(trade.profit),
                    planId: trade.planId || null,
                    isPlanned: trade.isPlanned || false
                  }}
                  onDelete={handleDelete}
                  onUpdate={handleUpdate}
                  onShowChart={(trade) => setSelectedTradeForChart(trade)}
                  onEditTrade={(trade) => {
                    setCurrentTrade(trade);
                    setIsModalOpen(true);
                  }}
                  onAnalyzeTrade={(trade) => {
                    setSelectedTradeForAnalysis(trade);
                    setActiveTab('ai');
                  }}
                />
              ))}
            </tbody>
          </Table>

          <div className="mt-4 flex gap-2">
            <PrimaryButton
              onClick={() => {
                setCurrentTrade(DEFAULT_TRADE);
                setIsModalOpen(true);
              }}
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
          <TradingCalendar 
            onDayClick={handleDayClick}
            onPlanClick={handlePlanClick}
          />
        </div>
      )}

      {/* Содержимое таба AI Analysis */}
      {activeTab === 'ai' && (
        <div className="py-4">
          <h2 className="text-xl font-bold mb-4">ИИ-анализ торговых сценариев</h2>
          <AIAnalysis 
            tradeId={selectedTradeForAnalysis?.id}
            initialPrompt={selectedTradeForAnalysis ? generateTradePrompt(selectedTradeForAnalysis) : ''}
          />
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
              onSubmit={currentTrade.id ? handleUpdate : handleAdd}
              onCancel={() => {
                setIsModalOpen(false)
                setCurrentTrade(DEFAULT_TRADE)
              }}
              availablePlans={availablePlans}
            />
          </div>
        </div>
      )}

      {/* Модальное окно плана */}
      {isPlanModalOpen && (
        <TradePlanModal 
          isOpen={isPlanModalOpen}
          onClose={() => {
            setIsPlanModalOpen(false);
            setCurrentPlan(null);
            setSelectedDateForPlan(null);
          }}
          selectedDate={selectedDateForPlan}
          existingPlan={currentPlan}
          onPlanAdded={refreshPlans}
        />
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