import { Dexie } from 'dexie'

export const db = new Dexie('TradingJournalDB')

db.version(1).stores({
  trades: `
    ++id,
    ticker,
    strategy,
    entryTime,
    exitTime,
    direction,
    entryPrice,
    stopLoss,
    takeProfit,
    lot,
    riskPercent,
    profit,
    emotion,
    createdAt
  `
})

// Инициализация БД (пустая функция, если нужно оставить место для будущей логики)
export async function initDB() {
  // База данных готова к использованию
  // Можно добавить здесь миграции или другие проверки при необходимости
}