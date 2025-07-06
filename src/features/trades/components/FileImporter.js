// FileImporter.js
'use client'
import { useState } from 'react'
import { FiUpload, FiX } from 'react-icons/fi'
import { parse, isValid } from 'date-fns'
import * as XLSX from 'xlsx'

export default function FileImporter({ onImportComplete }) {
  const [file, setFile] = useState(null)
  const [columnMapping, setColumnMapping] = useState({})
  const [fileHeaders, setFileHeaders] = useState([])
  const [previewData, setPreviewData] = useState([])
  const [parsingErrors, setParsingErrors] = useState([])
  const [fileType, setFileType] = useState(null) // 'csv', 'xlsx' или 'mt5-xlsx'

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setParsingErrors([])
    
    const fileName = selectedFile.name.toLowerCase()
    if (fileName.endsWith('.csv')) {
      setFileType('csv')
      parseCsvFile(selectedFile)
    } else if (fileName.endsWith('.xlsx') && selectedFile.name.includes('ReportHistory')) {
      setFileType('mt5-xlsx')
      parseMt5XlsxFile(selectedFile)
    } else if (fileName.endsWith('.xlsx')) {
      setFileType('xlsx')
      parseXlsxFile(selectedFile)
    } else {
      setParsingErrors(['Неподдерживаемый формат файла. Используйте CSV или XLSX.'])
    }
  }

  const parseCsvFile = (file) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const { headers, data } = parseCsv(e.target.result)
        processFileData(headers, data)
      } catch (error) {
        console.error('Ошибка парсинга CSV:', error)
        setParsingErrors([`Ошибка чтения CSV файла: ${error.message}`])
      }
    }
    reader.readAsText(file, 'UTF-8')
  }

  const parseXlsxFile = (file) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const fileData = new Uint8Array(e.target.result)
        const workbook = XLSX.read(fileData, { type: 'array' })
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" })
        
        if (jsonData.length < 2) throw new Error('Файл не содержит данных')
        
        const headers = jsonData[0].map(h => h?.toString().trim() || '')
        const rowsData = jsonData.slice(1).map((row, index) => {
          return headers.reduce((obj, header, i) => {
            obj[header] = row[i] !== undefined ? row[i]?.toString().trim() : ''
            return obj
          }, { _row: index + 2 })
        })
        
        processFileData(headers, rowsData)
      } catch (error) {
        console.error('Ошибка парсинга XLSX:', error)
        setParsingErrors([`Ошибка чтения XLSX файла: ${error.message}`])
      }
    }
    reader.readAsArrayBuffer(file)
  }

  const parseMt5XlsxFile = (file) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const fileData = new Uint8Array(e.target.result)
        const workbook = XLSX.read(fileData, { type: 'array' })
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" })

        let headers = []
        let dataStartRow = 0
        
        for (let i = 0; i < jsonData.length; i++) {
          const row = jsonData[i]
          if (row.length > 0 && 
              (row[0] === 'Время' || row[0] === 'Time') && 
              (row[1] === 'Позиция' || row[1] === 'Position' || 
               row[1] === 'Сделка' || row[1] === 'Deal')) {
            headers = row.map(h => h?.toString().trim() || '')
            dataStartRow = i + 1
            break
          }
        }
        
        if (headers.length === 0) throw new Error('Не удалось найти заголовки таблицы')
        
        const rowsData = []
        for (let i = dataStartRow; i < jsonData.length; i++) {
          const row = jsonData[i]
          if (row.length === 0 || 
              row[0] === 'Ордера' || row[0] === 'Orders' || 
              row[0] === 'Сделки' || row[0] === 'Trades' ||
              row[0] === 'Результаты' || row[0] === 'Summary') break
          
          const rowObj = headers.reduce((obj, header, j) => {
            obj[header] = row[j] !== undefined ? row[j]?.toString().trim() : ''
            return obj
          }, { _row: i + 1 })
          
          rowsData.push(rowObj)
        }
        
        if (rowsData.length === 0) throw new Error('Файл не содержит данных для импорта')
        
        processFileData(headers, rowsData)
      } catch (error) {
        console.error('Ошибка парсинга MT5 XLSX:', error)
        setParsingErrors([`Ошибка чтения файла MetaTrader 5: ${error.message}`])
      }
    }
    reader.readAsArrayBuffer(file)
  }

  const parseCsv = (text) => {
    const rows = text.split(/\r?\n/).filter(row => row.trim() !== '')
    if (rows.length < 2) return { headers: [], data: [] }

    const delimiter = rows[0].includes(';') ? ';' : ','
    
    const headers = rows[0]
      .split(delimiter)
      .map(h => h.trim().replace(/^"|"$/g, ''))
    
    const data = rows.slice(1).map((row, rowIndex) => {
      const values = row.split(new RegExp(`${delimiter}(?=(?:[^"]*"[^"]*")*[^"]*$)`))
      return headers.reduce((obj, header, i) => {
        let value = values[i] || ''
        obj[header] = value.trim().replace(/^"|"$/g, '')
        return obj
      }, { _row: rowIndex + 2 })
    })

    return { headers, data }
  }

  const processFileData = (headers, data) => {
    setFileHeaders(headers)
    setPreviewData(data.slice(0, 5))

    const autoMapping = {}
    headers.forEach((header, index) => {
      if (!header) return
      
      const lowerHeader = header.toLowerCase()
      
      if (fileType === 'mt5-xlsx') {
        if (header === 'Символ' || header === 'Symbol') autoMapping.ticker = header
        if (header === 'Тип' || header === 'Type') autoMapping.direction = header
        
        // Обработка дублирующихся колонок "Время"
        if (header === 'Время' || header === 'Time') {
          if (!autoMapping.entryTime) {
            autoMapping.entryTime = `${header}|${index}` // Сохраняем с индексом для уникальности
          } else if (!autoMapping.exitTime) {
            autoMapping.exitTime = `${header}|${index}`
          }
        }
        
        if (header === 'Цена' || header === 'Price') autoMapping.entryPrice = header
        if (header === 'S / L' || header === 'Stop Loss') autoMapping.stopLoss = header
        if (header === 'T / P' || header === 'Take Profit') autoMapping.takeProfit = header
        if (header === 'Объем' || header === 'Volume') autoMapping.lot = header
        if (header === 'Прибыль' || header === 'Profit') autoMapping.profit = header
        if (header === 'Комментарий' || header === 'Comment') autoMapping.comment = header
      } else {
        if (lowerHeader.includes('ticket')) autoMapping.id = header
        if (lowerHeader.includes('symbol') || lowerHeader.includes('ticker')) autoMapping.ticker = header
        if (lowerHeader.includes('type')) autoMapping.direction = header
        if (lowerHeader.includes('open time') || lowerHeader.includes('entry')) autoMapping.entryTime = header
        if (lowerHeader.includes('close time') || lowerHeader.includes('exit')) autoMapping.exitTime = header
        if (lowerHeader.includes('open price') || lowerHeader.includes('price')) autoMapping.entryPrice = header
        if (lowerHeader.includes('stop loss') || lowerHeader.includes('sl')) autoMapping.stopLoss = header
        if (lowerHeader.includes('take profit') || lowerHeader.includes('tp')) autoMapping.takeProfit = header
        if (lowerHeader.includes('volume') || lowerHeader.includes('size') || lowerHeader.includes('lot')) autoMapping.lot = header
        if (lowerHeader.includes('profit') || lowerHeader.includes('pnl')) autoMapping.profit = header
        if (lowerHeader.includes('comment')) autoMapping.comment = header
        if (lowerHeader.includes('magic') || lowerHeader.includes('magic number')) autoMapping.strategy = header
        if (lowerHeader.includes('direction') || lowerHeader.includes('side')) autoMapping.direction = header
        if (lowerHeader.includes('strategy') || lowerHeader.includes('method')) autoMapping.strategy = header
      }
    })
    
    setColumnMapping(autoMapping)
  }

  const parseDate = (dateStr) => {
    if (!dateStr) return new Date()
    
    if (typeof dateStr === 'string' && dateStr.match(/\d{4}\.\d{2}\.\d{2} \d{2}:\d{2}:\d{2}/)) {
      const parsed = parse(dateStr, 'yyyy.MM.dd HH:mm:ss', new Date())
      if (isValid(parsed)) return parsed
    }
    
    const formats = [
      'dd.MM.yyyy HH:mm:ss',
      'dd.MM.yyyy',
      'MM/dd/yyyy HH:mm:ss',
      'yyyy-MM-dd HH:mm:ss',
      'yyyy-MM-dd\'T\'HH:mm:ss',
      'yyyy-MM-dd\'T\'HH:mm:ss.SSSX'
    ]
    
    for (const format of formats) {
      const parsedDate = parse(dateStr, format, new Date())
      if (isValid(parsedDate)) return parsedDate
    }
    
    return new Date()
  }

  const parseDirection = (value) => {
    if (value === '0' || value === 'Buy' || value === 'buy' || value === 'BUY') return 'Long'
    if (value === '1' || value === 'Sell' || value === 'sell' || value === 'SELL') return 'Short'
    return value === 'Short' ? 'Short' : 'Long'
  }

  const handleImport = async () => {
    if (!file || !columnMapping.ticker) return
    
    try {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const { data } = fileType === 'csv' 
          ? parseCsv(e.target.result) 
          : parseXlsxData(new Uint8Array(e.target.result))
        
        const errors = []
        const tradesToAdd = []

        data.forEach((row) => {
          try {
            if (row[columnMapping.ticker] === 'Deposit' || row[columnMapping.ticker] === 'Withdrawal') return
            
            const parseLocalNumber = (str) => {
              if (!str || str === '-') return 0
              return parseFloat(
                str.toString()
                  .replace(/\s/g, '')
                  .replace(',', '.')
                  .replace(/[^0-9.-]/g, '')
              ) || 0
            }

            // Извлекаем оригинальное имя колонки без индекса
            const getOriginalHeader = (mappedValue) => {
              return mappedValue?.split('|')[0] || mappedValue
            }

            const trade = {
              ticker: row[getOriginalHeader(columnMapping.ticker)] || '',
              strategy: row[getOriginalHeader(columnMapping.strategy)] || '',
              entryTime: parseDate(row[getOriginalHeader(columnMapping.entryTime)]).toISOString(),
              exitTime: columnMapping.exitTime 
                ? parseDate(row[getOriginalHeader(columnMapping.exitTime)]).toISOString()
                : parseDate(row[getOriginalHeader(columnMapping.entryTime)]).toISOString(),
              direction: parseDirection(row[getOriginalHeader(columnMapping.direction)]),
              entryPrice: parseLocalNumber(row[getOriginalHeader(columnMapping.entryPrice)]),
              stopLoss: parseLocalNumber(row[getOriginalHeader(columnMapping.stopLoss)]),
              takeProfit: parseLocalNumber(row[getOriginalHeader(columnMapping.takeProfit)]),
              lot: parseLocalNumber(row[getOriginalHeader(columnMapping.lot)]),
              riskPercent: parseLocalNumber(row[getOriginalHeader(columnMapping.riskPercent)] || '0'),
              profit: parseLocalNumber(row[getOriginalHeader(columnMapping.profit)] || '0'),
              comment: row[getOriginalHeader(columnMapping.comment)] || '',
              _originalRow: row._row
            }

            if (!trade.ticker) throw new Error('Отсутствует тикер')
            if (isNaN(trade.entryPrice)) throw new Error('Некорректная цена входа')

            tradesToAdd.push(trade)
          } catch (error) {
            errors.push(`Строка ${row._row}: ${error.message}`)
          }
        })

        setParsingErrors(errors)

        if (tradesToAdd.length > 0) {
          await onImportComplete(tradesToAdd)
          alert(`Успешно импортировано: ${tradesToAdd.length} сделок\nОшибок: ${errors.length}`)
        } else {
          alert('Нет данных для импорта')
        }
      }
      
      if (fileType === 'csv') {
        reader.readAsText(file, 'UTF-8')
      } else {
        reader.readAsArrayBuffer(file)
      }
    } catch (error) {
      console.error('Ошибка импорта:', error)
      setParsingErrors([`Критическая ошибка: ${error.message}`])
    }
  }

  const parseXlsxData = (inputData) => {
    const workbook = XLSX.read(inputData, { type: 'array' })
    const firstSheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[firstSheetName]
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" })
    
    if (fileType === 'mt5-xlsx') {
      let headers = []
      let dataStartRow = 0
      
      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i]
        if (row.length > 0 && 
            (row[0] === 'Время' || row[0] === 'Time') && 
            (row[1] === 'Позиция' || row[1] === 'Position' || 
             row[1] === 'Сделка' || row[1] === 'Deal')) {
          headers = row.map(h => h?.toString().trim() || '')
          dataStartRow = i + 1
          break
        }
      }
      
      const parsedData = []
      for (let i = dataStartRow; i < jsonData.length; i++) {
        const row = jsonData[i]
        if (row.length === 0 || 
            row[0] === 'Ордера' || row[0] === 'Orders' || 
            row[0] === 'Сделки' || row[0] === 'Trades' ||
            row[0] === 'Результаты' || row[0] === 'Summary') break
        
        const rowObj = headers.reduce((obj, header, j) => {
          obj[header] = row[j] !== undefined ? row[j]?.toString().trim() : ''
          return obj
        }, { _row: i + 1 })
        
        parsedData.push(rowObj)
      }
      
      return { headers, data: parsedData }
    }
    
    const headers = jsonData[0].map(h => h?.toString().trim() || '')
    const parsedData = jsonData.slice(1).map((row, index) => {
      return headers.reduce((obj, header, i) => {
        obj[header] = row[i] !== undefined ? row[i]?.toString().trim() : ''
        return obj
      }, { _row: index + 2 })
    })
    
    return { headers, data: parsedData }
  }

  const handleReset = () => {
    setFile(null)
    setFileType(null)
    setColumnMapping({})
    setFileHeaders([])
    setPreviewData([])
    setParsingErrors([])
  }

  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <div className="flex items-center gap-4 mb-4">
        <label className="flex items-center gap-2 cursor-pointer bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          <FiUpload />
          Выбрать файл (.csv или .xlsx)
          <input 
            type="file" 
            accept=".csv,.xlsx" 
            onChange={handleFileChange} 
            className="hidden" 
          />
        </label>
        {file && (
          <div className="flex items-center gap-2">
            <span className="font-medium">{file.name}</span>
            <span className="text-sm text-gray-500">({fileType})</span>
            <button 
              onClick={handleReset}
              className="text-gray-500 hover:text-gray-700"
              title="Сбросить"
            >
              <FiX size={18} />
            </button>
          </div>
        )}
      </div>

      {fileHeaders.length > 0 && (
        <div className="mb-6">
          <h3 className="font-medium mb-3 text-lg">Сопоставьте колонки:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { field: 'ticker', label: 'Тикер (обязательно)' },
              { field: 'strategy', label: 'Стратегия' },
              { field: 'entryTime', label: 'Время входа' },
              { field: 'exitTime', label: 'Время выхода' },
              { field: 'direction', label: 'Направление (Buy/Sell)' },
              { field: 'entryPrice', label: 'Цена входа' },
              { field: 'stopLoss', label: 'Stop Loss' },
              { field: 'takeProfit', label: 'Take Profit' },
              { field: 'lot', label: 'Размер лота' },
              { field: 'riskPercent', label: 'Риск (%)' },
              { field: 'profit', label: 'Прибыль ($)' },
              { field: 'comment', label: 'Комментарий' }
            ].map(({ field, label }) => (
              <div key={field} className="mb-2">
                <label className="block text-sm font-medium mb-1">
                  {label}
                </label>
                <select
                  value={columnMapping[field]?.split('|')[0] || columnMapping[field] || ''}
                  onChange={(e) => {
                    const newMapping = { ...columnMapping }
                    // Для MT5 сохраняем индекс колонки
                    if (fileType === 'mt5-xlsx' && e.target.value) {
                      const headerIndex = fileHeaders.indexOf(e.target.value)
                      newMapping[field] = headerIndex >= 0 ? `${e.target.value}|${headerIndex}` : e.target.value
                    } else {
                      newMapping[field] = e.target.value || undefined
                    }
                    setColumnMapping(newMapping)
                  }}
                  className="w-full p-2 border rounded text-sm"
                >
                  <option value="">Не импортировать</option>
                  {fileHeaders.map((header, index) => (
                    <option key={`${field}-opt-${index}`} value={header}>
                      {header} {fileHeaders.slice(0, index).includes(header) ? `(${index})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      {previewData.length > 0 && (
        <div className="mb-6">
          <h3 className="font-medium mb-2 text-lg">Предпросмотр данных:</h3>
          <div className="overflow-auto max-h-60 border rounded">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  {fileHeaders.map((header, index) => (
                    <th key={`th-${index}`} className="p-2 text-left border-b whitespace-nowrap">
                      {header} {fileHeaders.slice(0, index).includes(header) ? `(${index})` : ''}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewData.map((row, rowIndex) => (
                  <tr key={`row-${rowIndex}`} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    {fileHeaders.map((header, colIndex) => (
                      <td key={`cell-${rowIndex}-${colIndex}`} className="p-2 border-b whitespace-nowrap">
                        {row[header]?.toString() || '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {parsingErrors.length > 0 && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
          <h4 className="font-medium text-red-600 mb-2">
            Ошибки ({parsingErrors.length}):
          </h4>
          <ul className="text-sm text-red-500 max-h-40 overflow-y-auto">
            {parsingErrors.map((error, i) => (
              <li key={`error-${i}`} className="mb-1">• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {file && (
        <div className="flex gap-3">
          <button
            onClick={handleImport}
            disabled={!columnMapping.ticker}
            className={`px-4 py-2 rounded text-white ${
              columnMapping.ticker 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            Импортировать
          </button>
          <button
            onClick={handleReset}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
          >
            Сбросить
          </button>
        </div>
      )}
    </div>
  )
}