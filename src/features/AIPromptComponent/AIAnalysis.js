'use client';
import { useState } from 'react';
import { saveAnalysis } from '@/db';

export default function AIAnalysis({ tradeId = null }) {
  const [prompt, setPrompt] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    if (!prompt.trim()) {
      setError('Пожалуйста, введите описание торговой ситуации');
      return;
    }

    setLoading(true);
    setError('');
    setAnalysis('');

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze');
      }

      setAnalysis(data.analysis);
      // Сохраняем анализ в базу данных
      await saveAnalysis(prompt, data.analysis, tradeId);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-analysis-container p-4 border rounded-lg bg-white shadow-sm">
      <h3 className="text-lg font-semibold mb-3">Анализ торгового сценария</h3>
      
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Опишите торговую ситуацию для анализа..."
        rows={4}
        className="w-full p-2 border rounded-md mb-3"
        disabled={loading}
      />
      
      <button
        onClick={handleAnalyze}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
      >
        {loading ? 'Анализируем...' : 'Проанализировать'}
      </button>
      
      {error && (
        <div className="mt-3 p-2 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      {analysis && (
        <div className="mt-4 p-3 bg-gray-50 rounded-md">
          <h4 className="font-medium mb-2">Результат анализа:</h4>
          <p className="whitespace-pre-wrap">{analysis}</p>
        </div>
      )}
    </div>
  );
}