import { Dexie } from 'dexie';

// Создаем новую базу данных с актуальной схемой
export const db = new Dexie('TradingJournalDB');

// Определяем схему последней версии с добавлением таблицы для анализов ИИ
db.version(3).stores({
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
    createdAt,
    isPlanned,
    planId
  `,
  tradePlans: `
    ++id,
    date,
    symbol,
    direction
  `,
  // Добавляем таблицы для скриншотов
  screenshots: `
    ++id,
    title,
    description,
    folderId,
    createdAt,
    updatedAt
  `,
  folders: `
    ++id,
    name,
    color,
    createdAt
  `,
  // Добавляем таблицу для анализов ИИ
  aiAnalyses: `
    ++id,
    tradeId,           // ID связанной сделки (опционально)
    prompt,
    response,
    model,             // Модель ИИ (gemini-pro и т.д.)
    timestamp,
    metadata           // Дополнительные метаданные
  `
});

// Добавляем хранилище для больших данных (изображений)
db.version(3).stores({}).upgrade(trans => {
  // Создаем хранилище для больших данных
  trans.db.createObjectStore('screenshotImages', { autoIncrement: true });
  trans.db.createObjectStore('screenshotAnnotations', { autoIncrement: true });
});

// Функция для сохранения результатов анализа в базу данных
export async function saveAnalysis(prompt, response, tradeId = null, model = 'gemini-pro') {
  try {
    await db.aiAnalyses.add({
      tradeId,
      prompt,
      response,
      model,
      timestamp: new Date(),
      metadata: {} // Можно добавить дополнительные метаданные
    });
  } catch (error) {
    console.error('Ошибка при сохранении анализа:', error);
    throw error;
  }
}

// Функция для загрузки истории анализов
export async function getAnalysisHistory(limit = 10, tradeId = null) {
  try {
    let query = db.aiAnalyses.orderBy('timestamp').reverse();
    
    if (tradeId) {
      query = query.and(analysis => analysis.tradeId === tradeId);
    }
    
    return await query.limit(limit).toArray();
  } catch (error) {
    console.error('Ошибка при загрузке истории:', error);
    return [];
  }
}

// Функция для получения анализа по ID сделки
export async function getAnalysisByTradeId(tradeId) {
  try {
    return await db.aiAnalyses
      .where('tradeId')
      .equals(tradeId)
      .reverse()
      .sortBy('timestamp');
  } catch (error) {
    console.error('Ошибка при загрузке анализа по ID сделки:', error);
    return [];
  }
}

// Функция инициализации БД с улучшенной обработкой ошибок
export async function initDB() {
  try {
    // Пытаемся открыть БД
    await db.open();
    console.log('Database opened successfully');
    
    // Проверяем существование таблиц
    const expectedTables = ['trades', 'tradePlans', 'screenshots', 'folders', 'aiAnalyses'];
    const missingTables = expectedTables.filter(tableName => !db[tableName]);
    
    if (missingTables.length > 0) {
      throw new Error(`Missing database tables: ${missingTables.join(', ')}`);
    }
    
    return db;
  } catch (error) {
    console.error('Database initialization error:', error);
    
    // Пересоздаем БД в случае ошибки
    try {
      console.warn('Attempting to recreate database...');
      await db.delete();
      await db.open();
      console.log('Database recreated successfully');
      return db;
    } catch (recreateError) {
      console.error('Database recreation failed:', recreateError);
      throw new Error('Critical database failure');
    }
  }
}