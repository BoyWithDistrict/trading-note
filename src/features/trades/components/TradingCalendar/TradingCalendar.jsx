'use client';
import { useState, useEffect } from 'react';
import { FiChevronLeft, FiChevronRight, FiPlus, FiTrash2, FiEdit2 } from 'react-icons/fi';

export default function TradingCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    type: 'trade'
  });

  // Получаем название месяца
  const getMonthName = (date) => {
    return date.toLocaleString('default', { month: 'long' });
  };

  // Получаем год
  const getYear = (date) => {
    return date.getFullYear();
  };

  // Переключение на предыдущий месяц
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  // Переключение на следующий месяц
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Генерация дней месяца
  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    const startDay = firstDay.getDay() === 0 ? 7 : firstDay.getDay();
    
    const days = [];
    
    // Добавляем пустые ячейки для дней предыдущего месяца
    for (let i = 1; i < startDay; i++) {
      days.push(null);
    }
    
    // Добавляем дни текущего месяца
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  // Форматирование даты для ключа
  const formatDateKey = (date) => {
    return date.toISOString().split('T')[0];
  };

  // Получение событий для конкретного дня
  const getEventsForDay = (date) => {
    if (!date) return [];
    const dateKey = formatDateKey(date);
    return events.filter(event => event.date === dateKey);
  };

  // Добавление нового события
  const handleAddEvent = () => {
    if (!newEvent.title.trim()) return;
    
    const eventToAdd = {
      ...newEvent,
      id: Date.now().toString()
    };
    
    setEvents([...events, eventToAdd]);
    setNewEvent({
      title: '',
      description: '',
      date: newEvent.date,
      time: '09:00',
      type: 'trade'
    });
    setIsModalOpen(false);
  };

  // Удаление события
  const handleDeleteEvent = (id) => {
    setEvents(events.filter(event => event.id !== id));
    setSelectedEvent(null);
  };

  // Открытие модального окна для добавления события
  const openAddModal = (date) => {
    setNewEvent({
      ...newEvent,
      date: date ? formatDateKey(date) : newEvent.date
    });
    setSelectedEvent(null);
    setIsModalOpen(true);
  };

  // Открытие модального окна для редактирования события
  const openEditModal = (event) => {
    setSelectedEvent(event);
    setNewEvent({
      title: event.title,
      description: event.description,
      date: event.date,
      time: event.time || '09:00',
      type: event.type || 'trade'
    });
    setIsModalOpen(true);
  };

  // Обновление события
  const handleUpdateEvent = () => {
    if (!selectedEvent || !newEvent.title.trim()) return;
    
    setEvents(events.map(event => 
      event.id === selectedEvent.id ? { ...newEvent, id: selectedEvent.id } : event
    ));
    setIsModalOpen(false);
    setSelectedEvent(null);
  };

  // Получение класса цвета для типа события
  const getEventColorClass = (type) => {
    switch (type) {
      case 'trade': return 'bg-blue-100 border-blue-200';
      case 'analysis': return 'bg-purple-100 border-purple-200';
      case 'news': return 'bg-yellow-100 border-yellow-200';
      case 'personal': return 'bg-green-100 border-green-200';
      default: return 'bg-gray-100 border-gray-200';
    }
  };

  const days = getDaysInMonth();
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="w-full">
      {/* Заголовок календаря с навигацией */}
      <div className="flex items-center justify-between mb-6">
        <button 
          onClick={prevMonth}
          className="p-2 rounded-full hover:bg-gray-100"
        >
          <FiChevronLeft size={20} />
        </button>
        
        <h2 className="text-xl font-semibold">
          {getMonthName(currentDate)} {getYear(currentDate)}
        </h2>
        
        <button 
          onClick={nextMonth}
          className="p-2 rounded-full hover:bg-gray-100"
        >
          <FiChevronRight size={20} />
        </button>
      </div>

      {/* Дни недели */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map(day => (
          <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Сетка дней */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => (
          <div 
            key={index} 
            className={`min-h-24 border rounded-lg p-2 ${
              day ? 
                day.toDateString() === new Date().toDateString() 
                  ? 'bg-blue-50 border-blue-200' 
                  : 'bg-white border-gray-200' 
                : 'bg-gray-50'
            }`}
          >
            {day ? (
              <>
                <div className="flex justify-between items-center mb-1">
                  <span className={`text-sm font-medium ${
                    day.toDateString() === new Date().toDateString() 
                      ? 'text-blue-600' 
                      : 'text-gray-700'
                  }`}>
                    {day.getDate()}
                  </span>
                  <button 
                    onClick={() => openAddModal(day)}
                    className="text-gray-400 hover:text-blue-500 text-sm"
                  >
                    <FiPlus size={14} />
                  </button>
                </div>
                
                <div className="space-y-1 max-h-20 overflow-y-auto">
                  {getEventsForDay(day).map(event => (
                    <div 
                      key={event.id}
                      onClick={() => openEditModal(event)}
                      className={`p-1 text-xs rounded cursor-pointer truncate border ${getEventColorClass(event.type)}`}
                    >
                      <div className="font-medium truncate">{event.title}</div>
                      {event.time && (
                        <div className="text-gray-500 text-[10px]">{event.time}</div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : null}
          </div>
        ))}
      </div>

      {/* Модальное окно для добавления/редактирования события */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                {selectedEvent ? 'Edit Plan' : 'Add New Plan'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Title *</label>
                  <input
                    type="text"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                    className="w-full p-2 border rounded"
                    placeholder="Enter title"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                    className="w-full p-2 border rounded"
                    rows="2"
                    placeholder="Enter description"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Date</label>
                    <input
                      type="date"
                      value={newEvent.date}
                      onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Time</label>
                    <input
                      type="time"
                      value={newEvent.time}
                      onChange={(e) => setNewEvent({...newEvent, time: e.target.value})}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <select
                    value={newEvent.type}
                    onChange={(e) => setNewEvent({...newEvent, type: e.target.value})}
                    className="w-full p-2 border rounded"
                  >
                    <option value="trade">Trade</option>
                    <option value="analysis">Analysis</option>
                    <option value="news">News Event</option>
                    <option value="personal">Personal</option>
                  </select>
                </div>
              </div>
              
              <div className="mt-6 flex justify-between">
                <div>
                  {selectedEvent && (
                    <button
                      onClick={() => handleDeleteEvent(selectedEvent.id)}
                      className="px-4 py-2 bg-red-100 text-red-600 rounded hover:bg-red-200"
                    >
                      Delete
                    </button>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border rounded"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={selectedEvent ? handleUpdateEvent : handleAddEvent}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    {selectedEvent ? 'Update' : 'Add'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}