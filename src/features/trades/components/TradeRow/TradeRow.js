'use client'
import { useState, useRef, useEffect } from 'react'
import { FiTrash2, FiEdit2, FiBarChart2, FiBrain } from 'react-icons/fi'
import TableCell from '@/components/Table/TableCell/TableCell'

export default function TradeRow({ 
  trade, 
  onDelete, 
  onUpdate,
  onShowChart,
  onEditTrade,
  onAnalyzeTrade // Новая функция для анализа сделки ИИ
}) {
  const [isCellEditing, setIsCellEditing] = useState(null)
  const [editedTrade, setEditedTrade] = useState({ ...trade })
  const inputRef = useRef(null)

  // Обработчик клика по ячейке
  const handleCellClick = (field) => {
    setIsCellEditing(field)
  }

  // Обработчик изменения значения
  const handleChange = (field, value) => {
    setEditedTrade(prev => ({ ...prev, [field]: value }))
  }

  // Сохранение изменений ячейки
  const handleCellSave = () => {
    if (isCellEditing) {
      onUpdate(editedTrade)
      setIsCellEditing(null)
    }
  }

  // Форматирование прибыли в доллары
  const formatProfit = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value)
  }

  // Автофокус при редактировании ячейки
  useEffect(() => {
    if (isCellEditing && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isCellEditing])

  // Обработчик нажатия клавиши Escape
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsCellEditing(null)
      setEditedTrade({ ...trade })
    }
  }

  return (
    <tr onKeyDown={handleKeyDown}>
      {/* Ticker */}
      <TableCell onClick={() => handleCellClick('ticker')}>
        {isCellEditing === 'ticker' ? (
          <input
            ref={inputRef}
            type="text"
            value={editedTrade.ticker}
            onChange={(e) => handleChange('ticker', e.target.value)}
            onBlur={handleCellSave}
            onKeyDown={(e) => e.key === 'Enter' && handleCellSave()}
            className="w-full px-2 py-1 border rounded"
          />
        ) : (
          trade.ticker
        )}
      </TableCell>

      {/* Strategy */}
      <TableCell onClick={() => handleCellClick('strategy')}>
        {isCellEditing === 'strategy' ? (
          <input
            ref={inputRef}
            type="text"
            value={editedTrade.strategy}
            onChange={(e) => handleChange('strategy', e.target.value)}
            onBlur={handleCellSave}
            onKeyDown={(e) => e.key === 'Enter' && handleCellSave()}
            className="w-full px-2 py-1 border rounded"
          />
        ) : (
          trade.strategy || '-'
        )}
      </TableCell>

      {/* Entry Time */}
      <TableCell onClick={() => handleCellClick('entryTime')}>
        {isCellEditing === 'entryTime' ? (
          <input
            ref={inputRef}
            type="datetime-local"
            value={new Date(editedTrade.entryTime).toISOString().slice(0, 16)}
            onChange={(e) => handleChange('entryTime', new Date(e.target.value))}
            onBlur={handleCellSave}
            onKeyDown={(e) => e.key === 'Enter' && handleCellSave()}
            className="w-full px-2 py-1 border rounded"
          />
        ) : (
          new Date(trade.entryTime).toLocaleString()
        )}
      </TableCell>

      {/* Exit Time */}
      <TableCell onClick={() => handleCellClick('exitTime')}>
        {isCellEditing === 'exitTime' ? (
          <input
            ref={inputRef}
            type="datetime-local"
            value={new Date(editedTrade.exitTime).toISOString().slice(0, 16)}
            onChange={(e) => handleChange('exitTime', new Date(e.target.value))}
            onBlur={handleCellSave}
            onKeyDown={(e) => e.key === 'Enter' && handleCellSave()}
            className="w-full px-2 py-1 border rounded"
          />
        ) : (
          new Date(trade.exitTime).toLocaleString()
        )}
      </TableCell>

      {/* Direction */}
      <TableCell onClick={() => handleCellClick('direction')}>
        {isCellEditing === 'direction' ? (
          <select
            ref={inputRef}
            value={editedTrade.direction}
            onChange={(e) => handleChange('direction', e.target.value)}
            onBlur={handleCellSave}
            onKeyDown={(e) => e.key === 'Enter' && handleCellSave()}
            className="w-full px-2 py-1 border rounded"
          >
            <option value="Long">Long</option>
            <option value="Short">Short</option>
          </select>
        ) : (
          trade.direction
        )}
      </TableCell>

      {/* Entry Price */}
      <TableCell numeric onClick={() => handleCellClick('entryPrice')}>
        {isCellEditing === 'entryPrice' ? (
          <input
            ref={inputRef}
            type="number"
            step="0.0001"
            value={editedTrade.entryPrice}
            onChange={(e) => handleChange('entryPrice', parseFloat(e.target.value))}
            onBlur={handleCellSave}
            onKeyDown={(e) => e.key === 'Enter' && handleCellSave()}
            className="w-full px-2 py-1 border rounded text-right"
          />
        ) : (
          trade.entryPrice.toFixed(4)
        )}
      </TableCell>

      {/* Stop Loss */}
      <TableCell numeric onClick={() => handleCellClick('stopLoss')}>
        {isCellEditing === 'stopLoss' ? (
          <input
            ref={inputRef}
            type="number"
            step="0.0001"
            value={editedTrade.stopLoss}
            onChange={(e) => handleChange('stopLoss', parseFloat(e.target.value))}
            onBlur={handleCellSave}
            onKeyDown={(e) => e.key === 'Enter' && handleCellSave()}
            className="w-full px-2 py-1 border rounded text-right"
          />
        ) : (
          trade.stopLoss.toFixed(4)
        )}
      </TableCell>

      {/* Take Profit */}
      <TableCell numeric onClick={() => handleCellClick('takeProfit')}>
        {isCellEditing === 'takeProfit' ? (
          <input
            ref={inputRef}
            type="number"
            step="0.0001"
            value={editedTrade.takeProfit}
            onChange={(e) => handleChange('takeProfit', parseFloat(e.target.value))}
            onBlur={handleCellSave}
            onKeyDown={(e) => e.key === 'Enter' && handleCellSave()}
            className="w-full px-2 py-1 border rounded text-right"
          />
        ) : (
          trade.takeProfit.toFixed(4)
        )}
      </TableCell>

      {/* Lot */}
      <TableCell numeric onClick={() => handleCellClick('lot')}>
        {isCellEditing === 'lot' ? (
          <input
            ref={inputRef}
            type="number"
            step="0.01"
            value={editedTrade.lot}
            onChange={(e) => handleChange('lot', parseFloat(e.target.value))}
            onBlur={handleCellSave}
            onKeyDown={(e) => e.key === 'Enter' && handleCellSave()}
            className="w-full px-2 py-1 border rounded text-right"
          />
        ) : (
          trade.lot.toFixed(2)
        )}
      </TableCell>

      {/* Risk Percent */}
      <TableCell numeric onClick={() => handleCellClick('riskPercent')}>
        {isCellEditing === 'riskPercent' ? (
          <input
            ref={inputRef}
            type="number"
            step="0.1"
            value={editedTrade.riskPercent}
            onChange={(e) => handleChange('riskPercent', parseFloat(e.target.value))}
            onBlur={handleCellSave}
            onKeyDown={(e) => e.key === 'Enter' && handleCellSave()}
            className="w-full px-2 py-1 border rounded text-right"
          />
        ) : (
          `${trade.riskPercent}%`
        )}
      </TableCell>

      {/* Profit */}
      <TableCell 
        numeric 
        profit={trade.profit}
        onClick={() => handleCellClick('profit')}
      >
        {isCellEditing === 'profit' ? (
          <input
            ref={inputRef}
            type="number"
            step="0.01"
            value={editedTrade.profit}
            onChange={(e) => handleChange('profit', parseFloat(e.target.value))}
            onBlur={handleCellSave}
            onKeyDown={(e) => e.key === 'Enter' && handleCellSave()}
            className="w-full px-2 py-1 border rounded text-right"
          />
        ) : (
          formatProfit(trade.profit)
        )}
      </TableCell>

      {/* Plan Status */}
      <TableCell center>
        {trade.isPlanned ? (
          <span className="text-green-600 font-semibold">✓</span>
        ) : (
          <span className="text-gray-400">-</span>
        )}
      </TableCell>

      {/* Actions */}
      <TableCell center>
        <div className="flex gap-2 justify-center">
          <button
            onClick={() => onEditTrade(trade)}
            className="text-blue-500 hover:text-blue-700"
            title="Редактировать сделку"
          >
            <FiEdit2 size={16} />
          </button>
          <button
            onClick={() => onShowChart(trade)}
            className="text-purple-500 hover:text-purple-700"
            title="Просмотреть график"
          >
            <FiBarChart2 size={16} />
          </button>
          <button
            onClick={() => onAnalyzeTrade && onAnalyzeTrade(trade)}
            className="text-indigo-500 hover:text-indigo-700"
            title="Анализировать с ИИ"
          >
            <FiBrain size={16} />
          </button>
          <button
            onClick={() => onDelete(trade.id)}
            className="text-red-500 hover:text-red-700"
            title="Удалить сделку"
          >
            <FiTrash2 size={16} />
          </button>
        </div>
      </TableCell>
    </tr>
  )
}