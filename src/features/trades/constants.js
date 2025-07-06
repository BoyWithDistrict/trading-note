export const DEFAULT_TRADE = {
  ticker: 'XAUUSD+',
  strategy: '',
  entryTime: new Date().toISOString(),
  exitTime: new Date().toISOString(),
  direction: 'Short',
  entryPrice: 0,
  stopLoss: 0,
  takeProfit: 0,
  lot: 0.01,
  riskPercent: 1,
  profit: 0,
  emotion: 'neutral'
}

export const TICKER_OPTIONS = ['XAUUSD+', 'EURUSD']
export const DIRECTION_OPTIONS = ['Short', 'Long']
export const EMOTION_OPTIONS = [
  { value: 'stress', label: 'Stress' },
  { value: 'neutral', label: 'Neutral' },
  { value: 'confident', label: 'Confident' }
]