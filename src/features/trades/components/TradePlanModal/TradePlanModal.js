import { useState, useEffect } from 'react';
import styles from './TradePlanModal.module.css';
import { db } from '../../../../db';
import PrimaryButton from '../../../../components/Button/PrimaryButton';

const TradePlanModal = ({ 
  isOpen, 
  onClose, 
  selectedDate, 
  onPlanAdded,
  existingPlan
}) => {
  const [symbol, setSymbol] = useState('');
  const [date, setDate] = useState('');
  const [direction, setDirection] = useState('Long');

  useEffect(() => {
    if (selectedDate) {
      // Форматирование даты
      const year = selectedDate.getFullYear();
      const month = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
      const day = selectedDate.getDate().toString().padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      setDate(formattedDate);
    } else {
      setDate('');
    }

    // Если редактируем существующий план
    if (existingPlan) {
      setSymbol(existingPlan.symbol);
      setDirection(existingPlan.direction);
    } else {
      // Сброс значений для нового плана
      setSymbol('');
      setDirection('Long');
    }
  }, [selectedDate, existingPlan]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const planData = {
      date,
      symbol,
      direction
    };

    try {
      if (existingPlan) {
        // Обновление существующего плана
        await db.tradePlans.update(existingPlan.id, planData);
      } else {
        // Добавление нового плана
        await db.tradePlans.add(planData);
      }
      
      onPlanAdded();
      onClose();
    } catch (error) {
      console.error('Error saving trade plan:', error);
      alert('Failed to save trade plan.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`${styles.overlay} ${isOpen ? styles.visible : ''}`}>
      <div className={styles.modalContainer}>
        <div className={styles.headerContainer}>
          <h2 className={styles.header}>
            {existingPlan ? 'Edit Trade Plan' : 'Add Trade Plan'}
          </h2>
          <button className={styles.closeButton} onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
        
        <div className={styles.contentContainer}>
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label htmlFor="symbol" className={styles.label}>Trading Pair</label>
              <input
                type="text"
                id="symbol"
                name="symbol"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                required
                className={styles.inputField}
                placeholder="e.g. BTC/USD"
              />
            </div>
            
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="date" className={styles.label}>Date</label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className={styles.inputField}
                  disabled={!!selectedDate} // Нельзя менять дату, если выбрана из календаря
                />
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.label}>Direction</label>
                <div className={styles.radioGroup}>
                  <label className={styles.radioLabel}>
                    <input
                      type="radio"
                      name="direction"
                      value="Long"
                      checked={direction === 'Long'}
                      onChange={(e) => setDirection(e.target.value)}
                      className={styles.radioInput}
                    />
                    <span className={styles.radioCustom}></span>
                    Long
                  </label>
                  <label className={styles.radioLabel}>
                    <input
                      type="radio"
                      name="direction"
                      value="Short"
                      checked={direction === 'Short'}
                      onChange={(e) => setDirection(e.target.value)}
                      className={styles.radioInput}
                    />
                    <span className={styles.radioCustom}></span>
                    Short
                  </label>
                </div>
              </div>
            </div>
            
            <div className={styles.buttonsContainer}>
              <PrimaryButton type="submit" fullWidth>
                {existingPlan ? 'Update Plan' : 'Add Trade Plan'}
              </PrimaryButton>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TradePlanModal;