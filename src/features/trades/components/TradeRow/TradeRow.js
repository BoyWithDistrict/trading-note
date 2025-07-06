// TradeRow.js
'use client'
import { useState, useRef, useEffect } from 'react'
import { FiTrash2, FiEdit2, FiCheck, FiX, FiBarChart2 } from 'react-icons/fi'
import TableCell from '@/components/Table/TableCell/TableCell'

export default function TradeRow({ 
  trade, 
  onDelete, 
  onUpdate,
  onShowChart // Пропс для открытия графика
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [isCellEditing, setIsCellEditing] = useState(null)
  const [editedTrade, setEditedTrade] = useState({ ...trade })
  const inputRef = useRef(null)

  // Обработчик клика по ячейке
  const handleCellClick = (field) => {
    if (!isEditing) {
      setIsCellEditing(field)
    }
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

  // Сохранение всей строки
  const handleRowSave = () => {
    onUpdate(editedTrade)
    setIsEditing(false)
    setIsCellEditing(null)
  }

  // Отмена редактирования
  const handleCancel = () => {
    setEditedTrade({ ...trade })
    setIsEditing(false)
    setIsCellEditing(null)
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
      handleCancel()
    }
  }

  return (
    <tr onKeyDown={handleKeyDown}>
      {/* Ticker */}
      <TableCell onClick={() => handleCellClick('ticker')}>
        {isEditing || isCellEditing === 'ticker' ? (
          <input
            ref={isCellEditing === 'ticker' ? inputRef : null}
            type="text"
            value={editedTrade.ticker}
            onChange={(e) => handleChange('ticker', e.target.value)}
            onBlur={isCellEditing === 'ticker' ? handleCellSave : undefined}
            onKeyDown={(e) => e.key === 'Enter' && isCellEditing === 'ticker' && handleCellSave()}
            className="w-full px-2 py-1 border rounded"
          />
        ) : (
          trade.ticker
        )}
      </TableCell>

      {/* Strategy */}
      <TableCell onClick={() => handleCellClick('strategy')}>
        {isEditing || isCellEditing === 'strategy' ? (
          <input
            ref={isCellEditing === 'strategy' ? inputRef : null}
            type="text"
            value={editedTrade.strategy}
            onChange={(e) => handleChange('strategy', e.target.value)}
            onBlur={isCellEditing === 'strategy' ? handleCellSave : undefined}
            onKeyDown={(e) => e.key === 'Enter' && isCellEditing === 'strategy' && handleCellSave()}
            className="w-full px-2 py-1 border rounded"
          />
        ) : (
          trade.strategy || '-'
        )}
      </TableCell>

      {/* Entry Time */}
      <TableCell onClick={() => !isEditing && handleCellClick('entryTime')}>
        {isEditing ? (
          <input
            type="datetime-local"
            value={new Date(editedTrade.entryTime).toISOString().slice(0, 16)}
            onChange={(e) => handleChange('entryTime', new Date(e.target.value))}
            className="w-full px-2 py-1 border rounded"
          />
        ) : isCellEditing === 'entryTime' ? (
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
      <TableCell onClick={() => !isEditing && handleCellClick('exitTime')}>
        {isEditing ? (
          <input
            type="datetime-local"
            value={new Date(editedTrade.exitTime).toISOString().slice(0, 16)}
            onChange={(e) => handleChange('exitTime', new Date(e.target.value))}
            className="w-full px-2 py-1 border rounded"
          />
        ) : isCellEditing === 'exitTime' ? (
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
      <TableCell onClick={() => !isEditing && handleCellClick('direction')}>
        {isEditing ? (
          <select
            value={editedTrade.direction}
            onChange={(e) => handleChange('direction', e.target.value)}
            className="w-full px-2 py-1 border rounded"
          >
            <option value="Long">Long</option>
            <option value="Short">Short</option>
          </select>
        ) : isCellEditing === 'direction' ? (
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
        {isEditing || isCellEditing === 'entryPrice' ? (
          <input
            ref={isCellEditing === 'entryPrice' ? inputRef : null}
            type="number"
            step="0.0001"
            value={editedTrade.entryPrice}
            onChange={(e) => handleChange('entryPrice', parseFloat(e.target.value))}
            onBlur={isCellEditing === 'entryPrice' ? handleCellSave : undefined}
            onKeyDown={(e) => e.key === 'Enter' && isCellEditing === 'entryPrice' && handleCellSave()}
            className="w-full px-2 py-1 border rounded text-right"
          />
        ) : (
          trade.entryPrice.toFixed(4)
        )}
      </TableCell>

      {/* Stop Loss */}
      <TableCell numeric onClick={() => handleCellClick('stopLoss')}>
        {isEditing || isCellEditing === 'stopLoss' ? (
          <input
            ref={isCellEditing === 'stopLoss' ? inputRef : null}
            type="number"
            step="0.0001"
            value={editedTrade.stopLoss}
            onChange={(e) => handleChange('stopLoss', parseFloat(e.target.value))}
            onBlur={isCellEditing === 'stopLoss' ? handleCellSave : undefined}
            onKeyDown={(e) => e.key === 'Enter' && isCellEditing === 'stopLoss' && handleCellSave()}
            className="w-full px-2 py-1 border rounded text-right"
          />
        ) : (
          trade.stopLoss.toFixed(4)
        )}
      </TableCell>

      {/* Take Profit */}
      <TableCell numeric onClick={() => handleCellClick('takeProfit')}>
        {isEditing || isCellEditing === 'takeProfit' ? (
          <input
            ref={isCellEditing === 'takeProfit' ? inputRef : null}
            type="number"
            step="0.0001"
            value={editedTrade.takeProfit}
            onChange={(e) => handleChange('takeProfit', parseFloat(e.target.value))}
            onBlur={isCellEditing === 'takeProfit' ? handleCellSave : undefined}
            onKeyDown={(e) => e.key === 'Enter' && isCellEditing === 'takeProfit' && handleCellSave()}
            className="w-full px-2 py-1 border rounded text-right"
          />
        ) : (
          trade.takeProfit.toFixed(4)
        )}
      </TableCell>

      {/* Lot */}
      <TableCell numeric onClick={() => handleCellClick('lot')}>
        {isEditing || isCellEditing === 'lot' ? (
          <input
            ref={isCellEditing === 'lot' ? inputRef : null}
            type="number"
            step="0.01"
            value={editedTrade.lot}
            onChange={(e) => handleChange('lot', parseFloat(e.target.value))}
            onBlur={isCellEditing === 'lot' ? handleCellSave : undefined}
            onKeyDown={(e) => e.key === 'Enter' && isCellEditing === 'lot' && handleCellSave()}
            className="w-full px-2 py-1 border rounded text-right"
          />
        ) : (
          trade.lot.toFixed(2)
        )}
      </TableCell>

      {/* Risk Percent */}
      <TableCell numeric onClick={() => handleCellClick('riskPercent')}>
        {isEditing || isCellEditing === 'riskPercent' ? (
          <input
            ref={isCellEditing === 'riskPercent' ? inputRef : null}
            type="number"
            step="0.1"
            value={editedTrade.riskPercent}
            onChange={(e) => handleChange('riskPercent', parseFloat(e.target.value))}
            onBlur={isCellEditing === 'riskPercent' ? handleCellSave : undefined}
            onKeyDown={(e) => e.key === 'Enter' && isCellEditing === 'riskPercent' && handleCellSave()}
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
        {isEditing || isCellEditing === 'profit' ? (
          <input
            ref={isCellEditing === 'profit' ? inputRef : null}
            type="number"
            step="0.01"
            value={editedTrade.profit}
            onChange={(e) => handleChange('profit', parseFloat(e.target.value))}
            onBlur={isCellEditing === 'profit' ? handleCellSave : undefined}
            onKeyDown={(e) => e.key === 'Enter' && isCellEditing === 'profit' && handleCellSave()}
            className="w-full px-2 py-1 border rounded text-right"
          />
        ) : (
          formatProfit(trade.profit)
        )}
      </TableCell>

      {/* Actions */}
      <TableCell center>
        {isEditing ? (
          <div className="flex gap-2 justify-center">
            <button
              onClick={handleRowSave}
              className="text-green-500 hover:text-green-700"
              title="Save"
            >
              <FiCheck size={16} />
            </button>
            <button
              onClick={handleCancel}
              className="text-gray-500 hover:text-gray-700"
              title="Cancel"
            >
              <FiX size={16} />
            </button>
          </div>
        ) : (
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => setIsEditing(true)}
              className="text-blue-500 hover:text-blue-700"
              title="Edit Row"
            >
              <FiEdit2 size={16} />
            </button>
            <button
  onClick={() => {
    onShowChart();
  }}
  className="text-purple-500 hover:text-purple-700"
  title="View Chart"
>
  <FiBarChart2 size={16} />
</button>
            <button
              onClick={() => onDelete(trade.id)}
              className="text-red-500 hover:text-red-700"
              title="Delete"
            >
              <FiTrash2 size={16} />
            </button>
          </div>
        )}
      </TableCell>
    </tr>
  )
}