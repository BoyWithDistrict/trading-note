import { generateAIAnalysis } from '../services/geminiService';

export class AIPromptComponent {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.render();
    this.bindEvents();
  }

  render() {
    this.container.innerHTML = `
      <div class="ai-prompt-container">
        <h3>Анализ торгового сценария</h3>
        <textarea id="ai-prompt-input" placeholder="Опишите торговую ситуацию для анализа..." rows="4"></textarea>
        <button id="analyze-button">Проанализировать</button>
        <div id="analysis-result" class="result-container"></div>
        <div id="error-message" class="error-container"></div>
      </div>
    `;
  }

  bindEvents() {
    const analyzeButton = this.container.querySelector('#analyze-button');
    const promptInput = this.container.querySelector('#ai-prompt-input');
    const resultContainer = this.container.querySelector('#analysis-result');
    const errorContainer = this.container.querySelector('#error-message');

    analyzeButton.addEventListener('click', async () => {
      const prompt = promptInput.value.trim();
      
      if (!prompt) {
        this.showError('Пожалуйста, введите описание торговой ситуации');
        return;
      }

      analyzeButton.disabled = true;
      analyzeButton.textContent = 'Анализируем...';
      resultContainer.innerHTML = '';
      errorContainer.innerHTML = '';

      try {
        const analysis = await generateAIAnalysis(prompt);
        this.showResult(analysis);
      } catch (error) {
        this.showError(`Ошибка анализа: ${error.message}`);
      } finally {
        analyzeButton.disabled = false;
        analyzeButton.textContent = 'Проанализировать';
      }
    });
  }

  showResult(analysis) {
    const resultContainer = this.container.querySelector('#analysis-result');
    resultContainer.innerHTML = `
      <h4>Результат анализа:</h4>
      <div class="analysis-text">${analysis}</div>
    `;
  }

  showError(message) {
    const errorContainer = this.container.querySelector('#error-message');
    errorContainer.innerHTML = `
      <div class="error-text">${message}</div>
    `;
  }
}