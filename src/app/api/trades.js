import { db } from '@/db';
import initDB from '@/db/initDB';

export default async function handler(req, res) {
  await initDB(); // Инициализируем БД

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const mt5Trade = req.body;
    
    // Преобразование формата
    const trade = {
      ticker: mt5Trade.symbol,
      direction: mt5Trade.type === 'BUY' ? 'Long' : 'Short',
      entryPrice: parseFloat(mt5Trade.price),
      stopLoss: parseFloat(mt5Trade.sl) || 0,
      takeProfit: parseFloat(mt5Trade.tp) || 0,
      lot: parseFloat(mt5Trade.volume),
      entryTime: new Date(mt5Trade.time).toISOString(),
      strategy: "MT5 Import",
      exitTime: new Date().toISOString(),
      riskPercent: 1.0,
      profit: 0,
      emotion: "",
      isPlanned: false,
      createdAt: new Date().toISOString()
    };

    await db.trades.add(trade);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error saving MT5 trade:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}