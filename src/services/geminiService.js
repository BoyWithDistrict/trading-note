import axios from 'axios';

const GOOGLE_GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY;
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

export async function generateAIAnalysis(prompt) {
  try {
    if (!GOOGLE_GEMINI_API_KEY) {
      throw new Error('API ключ Google Gemini не настроен');
    }

    const response = await axios.post(
      `${API_URL}?key=${GOOGLE_GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{
            text: `Как опытный финансовый аналитик, проанализируй следующую торговую ситуацию: ${prompt}. 
            Предоставь детальный анализ, включая потенциальные риски, возможности и рекомендации.`
          }]
        }]
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    if (response.data.candidates && response.data.candidates[0] && response.data.candidates[0].content) {
      return response.data.candidates[0].content.parts[0].text;
    } else {
      throw new Error('Неожиданный формат ответа от API');
    }
  } catch (error) {
    console.error('Ошибка при обращении к Gemini API:', error.message);
    
    if (error.response) {
      // Сервер вернул ошибку
      throw new Error(`API ошибка: ${error.response.data.error?.message || error.response.status}`);
    } else if (error.request) {
      // Запрос был сделан, но ответ не получен
      throw new Error('Нет ответа от сервера. Проверьте подключение к интернету.');
    } else {
      // Произошла другая ошибка
      throw new Error(`Ошибка при выполнении запроса: ${error.message}`);
    }
  }
}