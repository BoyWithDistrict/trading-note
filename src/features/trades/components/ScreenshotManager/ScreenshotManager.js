'use client';
import { useState, useEffect } from 'react';
import { db } from '@/db';
import styles from './ScreenshotManager.module.css';
import ScreenshotEditor from './ScreenshotEditor';

export default function ScreenshotManager() {
  const [screenshots, setScreenshots] = useState([]);
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [currentImage, setCurrentImage] = useState(null);

  // Загрузка сохраненных скриншотов и папок из IndexedDB
  useEffect(() => {
    const loadData = async () => {
      try {
        const savedFolders = await db.folders.toArray();
        const savedScreenshots = await db.screenshots.toArray();
        
        setFolders(savedFolders);
        setScreenshots(savedScreenshots);
      } catch (error) {
        console.error('Error loading data:', error);
        // Если таблиц нет, создаем несколько папок по умолчанию
        setFolders([
          { id: 1, name: 'Графики', color: '#ff6b6b' },
          { id: 2, name: 'Сделки', color: '#4ecdc4' },
          { id: 3, name: 'Аналитика', color: '#45b7d1' },
        ]);
      }
    };

    loadData();
  }, []);

  // Обработчик вставки скриншотов
  useEffect(() => {
    const handlePaste = async (e) => {
      for (let i = 0; i < e.clipboardData.items.length; i++) {
        const item = e.clipboardData.items[i];
        if (item.type.indexOf('image') !== -1) {
          const blob = item.getAsFile();
          
          // Конвертируем blob в base64 для хранения в IndexedDB
          const reader = new FileReader();
          reader.onload = async function(event) {
            const imageData = event.target.result;
            
            try {
              // Сохраняем в базу данных
              const id = await db.screenshots.add({
                image: imageData,
                name: `Скриншот ${screenshots.length + 1}`,
                description: '',
                date: new Date().toISOString(),
                folderId: selectedFolder,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              });
              
              // Обновляем состояние
              setScreenshots(prev => [...prev, {
                id,
                image: imageData,
                name: `Скриншот ${prev.length + 1}`,
                description: '',
                date: new Date().toISOString().split('T')[0],
                folderId: selectedFolder
              }]);
            } catch (error) {
              console.error('Error saving screenshot:', error);
            }
          };
          reader.readAsDataURL(blob);
          break;
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [selectedFolder, screenshots.length]);

  const createNewFolder = async () => {
    const folderName = prompt('Введите название папки:');
    if (folderName) {
      try {
        const id = await db.folders.add({
          name: folderName,
          color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
          createdAt: new Date().toISOString()
        });
        
        const newFolder = {
          id,
          name: folderName,
          color: `#${Math.floor(Math.random()*16777215).toString(16)}`
        };
        
        setFolders(prev => [...prev, newFolder]);
      } catch (error) {
        console.error('Error creating folder:', error);
      }
    }
  };

  const startEditing = (screenshot) => {
    setCurrentImage(screenshot);
    setIsEditing(true);
  };

  const saveScreenshot = async (updatedScreenshot) => {
    try {
      // Обновляем запись в базе данных
      await db.screenshots.update(updatedScreenshot.id, {
        name: updatedScreenshot.name,
        description: updatedScreenshot.description,
        folderId: updatedScreenshot.folderId,
        image: updatedScreenshot.image,
        annotations: updatedScreenshot.annotations,
        updatedAt: new Date().toISOString()
      });
      
      // Обновляем состояние
      setScreenshots(prev => 
        prev.map(s => s.id === updatedScreenshot.id ? {
          ...s,
          name: updatedScreenshot.name,
          description: updatedScreenshot.description,
          folderId: updatedScreenshot.folderId,
          image: updatedScreenshot.image
        } : s)
      );
      setIsEditing(false);
      setCurrentImage(null);
    } catch (error) {
      console.error('Error updating screenshot:', error);
    }
  };

  const deleteScreenshot = async (id) => {
    try {
      await db.screenshots.delete(id);
      setScreenshots(prev => prev.filter(s => s.id !== id));
    } catch (error) {
      console.error('Error deleting screenshot:', error);
    }
  };

  const filteredScreenshots = selectedFolder 
    ? screenshots.filter(s => s.folderId === selectedFolder)
    : screenshots;

  return (
    <div className={styles.screenshotManager}>
      <div className={styles.managerHeader}>
        <h1>Скриншоты графиков</h1>
        <p>Используйте Ctrl+V для вставки скриншотов из буфера обмена</p>
      </div>

      <div className={styles.foldersSection}>
        <div className={styles.foldersHeader}>
          <h2>Папки</h2>
          <button onClick={createNewFolder}>+ Новая папка</button>
        </div>
        <div className={styles.foldersList}>
          <div 
            className={`${styles.folderItem} ${!selectedFolder ? styles.active : ''}`}
            onClick={() => setSelectedFolder(null)}
          >
            Все скриншоты
          </div>
          {folders.map(folder => (
            <div 
              key={folder.id}
              className={`${styles.folderItem} ${selectedFolder === folder.id ? styles.active : ''}`}
              onClick={() => setSelectedFolder(folder.id)}
              style={{ borderLeft: `4px solid ${folder.color}` }}
            >
              {folder.name}
            </div>
          ))}
        </div>
      </div>

      {filteredScreenshots.length > 0 ? (
        <div className={styles.screenshotsGrid}>
          {filteredScreenshots.map(screenshot => (
            <div key={screenshot.id} className={styles.screenshotItem}>
              <img 
                src={screenshot.image} 
                alt={screenshot.name}
                onClick={() => startEditing(screenshot)}
              />
              <div className={styles.screenshotInfo}>
                <div className={styles.screenshotName}>{screenshot.name}</div>
                <div className={styles.screenshotDate}>{screenshot.date}</div>
                <button 
                  onClick={() => deleteScreenshot(screenshot.id)}
                  style={{
                    marginTop: '10px',
                    padding: '5px 10px',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <h3>Нет скриншотов</h3>
          <p>Используйте Ctrl+V для вставки скриншотов из буфера обмена</p>
        </div>
      )}

      {isEditing && (
        <ScreenshotEditor 
          screenshot={currentImage}
          folders={folders}
          onSave={saveScreenshot}
          onCancel={() => {
            setIsEditing(false);
            setCurrentImage(null);
          }}
        />
      )}
    </div>
  );
}