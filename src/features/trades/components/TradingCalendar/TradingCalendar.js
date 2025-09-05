'use client';
import React, { useState, useEffect, useCallback } from 'react';
import styles from './TradingCalendar.module.css';
import TradePlanModal from '../TradePlanModal/TradePlanModal';
import { db } from '../../../../db';

const CalendarDay = ({ day, isCurrentMonth, isToday, events = [], onDayClick }) => {
  if (!day) {
    return <div className={styles.emptyDay}></div>;
  }

  const hasPlans = events.length > 0;

  return (
    <div 
      className={`${styles.day} ${isToday ? styles.today : ''} ${isCurrentMonth ? styles.currentMonth : styles.otherMonth} ${hasPlans ? styles.hasPlans : ''}`}
      onClick={() => onDayClick(day)}
    >
      <div className={styles.dayHeader}>
        <div className={styles.dayNumber}>{day.getDate()}</div>
        {hasPlans && (
          <div className={styles.plansMarker}>
            <div className={styles.markerDot}></div>
          </div>
        )}
      </div>
      <div className={styles.events}>
        {events.slice(0, 3).map(event => (
          <div 
            key={event.id} 
            className={styles.event}
            onClick={(e) => e.stopPropagation()}
          >
            {event.symbol} {event.direction}
          </div>
        ))}
        {events.length > 3 && (
          <div 
            className={styles.morePlans}
            onClick={(e) => e.stopPropagation()}
          >
            +{events.length - 3} more
          </div>
        )}
      </div>
    </div>
  );
};

const TradingCalendar = ({ onDayClick, onPlanClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [tradePlans, setTradePlans] = useState([]);

  const refreshPlans = useCallback(async () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    const monthStr = month < 10 ? `0${month}` : `${month}`;
    
    try {
      const plans = await db.tradePlans
        .where('date')
        .startsWith(`${year}-${monthStr}`)
        .toArray();
      setTradePlans(plans);
    } catch (error) {
      console.error('Error loading trade plans:', error);
    }
  }, [currentDate]);

  useEffect(() => {
    refreshPlans();
  }, [refreshPlans]);

  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
  };

  const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  const firstDayOfMonth = getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth());

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const handlePrevMonth = () => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  };

  const handleNextMonth = () => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  };

  const handleDayClick = (day) => {
    setSelectedDate(day);
    setIsModalOpen(true);
    if (onDayClick) onDayClick(day);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedDate(null);
  };

  const renderDays = () => {
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<CalendarDay key={`empty-start-${i}`} day={null} />);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const day = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
      const isToday = day.toDateString() === new Date().toDateString();
      const isCurrentMonth = true;
      
      // Форматируем дату для сравнения с планами
      const year = day.getFullYear();
      const month = day.getMonth() + 1;
      const dayOfMonth = day.getDate();
      const dateStr = `${year}-${month < 10 ? '0' + month : month}-${dayOfMonth < 10 ? '0' + dayOfMonth : dayOfMonth}`;
      
      // Фильтруем планы для этой даты
      const eventsForDay = tradePlans.filter(plan => {
        // Для совместимости со старыми данными
        let planDate = plan.date;
        if (planDate instanceof Date) {
          const d = planDate;
          planDate = `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
        }
        return planDate === dateStr;
      });

      days.push(
        <CalendarDay
          key={i}
          day={day}
          isCurrentMonth={isCurrentMonth}
          isToday={isToday}
          events={eventsForDay}
          onDayClick={handleDayClick}
        />
      );
    }

    const totalCells = days.length;
    const remainingCells = 42 - totalCells; 
    for (let i = 0; i < remainingCells; i++) {
      days.push(<CalendarDay key={`empty-end-${i}`} day={null} />);
    }

    return days;
  };

  return (
    <div className={styles.calendarContainer}>
      <div className={styles.header}>
        <button onClick={handlePrevMonth}>&lt;</button>
        <h2>{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h2>
        <button onClick={handleNextMonth}>&gt;</button>
      </div>
      <div className={styles.weekdays}>
        {dayNames.map(day => <div key={day} className={styles.weekdayName}>{day}</div>)}
      </div>
      <div className={styles.daysGrid}>
        {renderDays()}
      </div>
      <TradePlanModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        selectedDate={selectedDate}
        onPlanAdded={refreshPlans}
      />
    </div>
  );
};

export default TradingCalendar;