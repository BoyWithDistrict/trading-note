'use client'
import { useState, useEffect } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { FiX } from 'react-icons/fi'

// Вспомогательная функция для безопасного создания даты
const createSafeDate = (date) => {
  try {
    if (!date) return new Date()
    const d = date instanceof Date ? date : new Date(date)
    return isNaN(d.getTime()) ? new Date() : d
  } catch {
    return new Date()
  }
}

export const initialTradeState = {
  id: Date.now(),
  ticker: 'XAUUSD+',
  strategy: '',
  entryTime: new Date(),
  exitTime: new Date(),
  direction: 'Short',
  entryPrice: '',
  stopLoss: '',
  takeProfit: '',
  lot: '',
  riskPercent: '',
  profit: '',
  emotion: '',
  createdAt: new Date().toISOString(),
  isPlanned: false, // Новое поле: была ли сделка по плану
  planId: null // ID связанного плана
}

export default function TradeForm({ 
  trade = initialTradeState, 
  onChange, 
  onSubmit, 
  onCancel,
  availablePlans = [] // Список доступных планов
}) {
  const [localTrade, setLocalTrade] = useState({
    ...trade,
    entryTime: createSafeDate(trade.entryTime),
    exitTime: createSafeDate(trade.exitTime)
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setLocalTrade(prev => ({ ...prev, [name]: value }))
  }

  const handleDateChange = (name, date) => {
    setLocalTrade(prev => ({ 
      ...prev, 
      [name]: createSafeDate(date) 
    }))
  }

  const handleNumberChange = (e) => {
    const { name, value } = e.target
    setLocalTrade(prev => ({ 
      ...prev, 
      [name]: value === '' ? '' : Number(value) 
    }))
  }

  const handleCheckboxChange = (name, checked) => {
    setLocalTrade(prev => ({ 
      ...prev, 
      [name]: checked 
    }))
  }

  const handleSubmit = () => {
    // Подготовка данных перед отправкой
    const tradeToSubmit = {
      ...localTrade,
      entryTime: localTrade.entryTime.toISOString(),
      exitTime: localTrade.exitTime.toISOString(),
      createdAt: localTrade.createdAt || new Date().toISOString()
    }
    
    // Проверка обязательных полей
    if (!tradeToSubmit.ticker || !tradeToSubmit.entryPrice) {
      alert('Пожалуйста, заполните обязательные поля: Тикер и Цена входа')
      return
    }

    onSubmit(tradeToSubmit)
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative">
        <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center z-10">
          <h2 className="text-xl font-semibold">
            {trade.id ? 'Редактировать сделку' : 'Новая сделка'}
          </h2>
          <button 
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            <FiX size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Левая колонка */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Тикер *
                </label>
                <select
                  name="ticker"
                  value={localTrade.ticker}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="XAUUSD+">XAUUSD+</option>
                  <option value="EURUSD">EURUSD</option>
                  <option value="BTCUSD">BTCUSD</option>
                  <option value="ETHUSD">ETHUSD</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Стратегия
                </label>
                <input
                  type="text"
                  name="strategy"
                  value={localTrade.strategy}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Название стратегии"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Направление
                </label>
                <select
                  name="direction"
                  value={localTrade.direction}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Short">Short</option>
                  <option value="Long">Long</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Эмоции
                </label>
                <select
                  name="emotion"
                  value={localTrade.emotion}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Не указано</option>
                  <option value="stress">Стресс</option>
                  <option value="confidence">Уверенность</option>
                  <option value="fear">Страх</option>
                  <option value="greed">Жадность</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Время входа
                </label>
                <DatePicker
                  selected={localTrade.entryTime}
                  onChange={(date) => handleDateChange('entryTime', date)}
                  showTimeSelect
                  timeFormat="HH:mm"
                  timeIntervals={15}
                  dateFormat="dd.MM.yyyy HH:mm"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Правая колонка */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Время выхода
                </label>
                <DatePicker
                  selected={localTrade.exitTime}
                  onChange={(date) => handleDateChange('exitTime', date)}
                  showTimeSelect
                  timeFormat="HH:mm"
                  timeIntervals={15}
                  dateFormat="dd.MM.yyyy HH:mm"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Цена входа *
                </label>
                <input
                  type="number"
                  name="entryPrice"
                  value={localTrade.entryPrice}
                  onChange={handleNumberChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  step="0.0001"
                  placeholder="0.0000"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stop Loss
                </label>
                <input
                  type="number"
                  name="stopLoss"
                  value={localTrade.stopLoss}
                  onChange={handleNumberChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  step="0.0001"
                  placeholder="0.0000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Take Profit
                </label>
                <input
                  type="number"
                  name="takeProfit"
                  value={localTrade.takeProfit}
                  onChange={handleNumberChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  step="0.0001"
                  placeholder="0.0000"
                />
              </div>
            </div>
          </div>

          {/* Блок "По плану" и выбора плана */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Сделка по плану
              </label>
              <div className="flex items-center">
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="isPlanned"
                    checked={localTrade.isPlanned || false}
                    onChange={(e) => handleCheckboxChange('isPlanned', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  <span className="ms-3 text-sm font-medium text-gray-900">
                    {localTrade.isPlanned ? 'Да' : 'Нет'}
                  </span>
                </label>
              </div>
            </div>

            {localTrade.isPlanned && availablePlans.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Связать с планом
                </label>
                <select
                  name="planId"
                  value={localTrade.planId || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Не связывать</option>
                  {availablePlans.map(plan => (
                    <option key={plan.id} value={plan.id}>
                      {plan.symbol} {plan.direction} ({plan.date})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Нижний блок */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Лот
              </label>
              <input
                type="number"
                name="lot"
                value={localTrade.lot}
                onChange={handleNumberChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                step="0.01"
                placeholder="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Риск %
              </label>
              <input
                type="number"
                name="riskPercent"
                value={localTrade.riskPercent}
                onChange={handleNumberChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                step="0.1"
                placeholder="1.0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Прибыль
              </label>
              <input
                type="number"
                name="profit"
                value={localTrade.profit}
                onChange={handleNumberChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white p-4 border-t flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {trade.id ? 'Сохранить' : 'Добавить'}
          </button>
        </div>
      </div>
    </div>
  )
}