'use client';
import { useState, useRef, useEffect } from 'react';
import styles from './ScreenshotManager.module.css';

export default function ScreenshotEditor({ screenshot, folders, onSave, onCancel }) {
  const [title, setTitle] = useState(screenshot.name || '');
  const [description, setDescription] = useState(screenshot.description || '');
  const [folderId, setFolderId] = useState(screenshot.folderId || '');
  const [tool, setTool] = useState('brush');
  const [color, setColor] = useState('#ff0000');
  const [brushSize, setBrushSize] = useState(5);
  const [textInput, setTextInput] = useState('');
  const [textPosition, setTextPosition] = useState(null);
  const [drawingHistory, setDrawingHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [selectedObjects, setSelectedObjects] = useState([]);
  const [fillMode, setFillMode] = useState('stroke');
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  
  const canvasRef = useRef();
  const tempCanvasRef = useRef();
  const isDrawing = useRef(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const imageRef = useRef(new Image());
  const objects = useRef([]);
  const isMoving = useRef(false);
  const isResizing = useRef(false);
  const isSelecting = useRef(false);
  const isRotating = useRef(false);
  const resizeHandle = useRef(null);
  const offsetX = useRef(0);
  const offsetY = useRef(0);
  const selectionRect = useRef({ x: 0, y: 0, width: 0, height: 0 });
  const lastX = useRef(0);
  const lastY = useRef(0);
  const initialObjectPositions = useRef([]);

  const colors = [
    '#000000', '#ff0000', '#00ff00', '#0000ff', '#ffff00', 
    '#00ffff', '#ff00ff', '#ffffff', '#888888'
  ];

  const getCanvasCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  useEffect(() => {
    if (!screenshot.image) return;
    
    const canvas = canvasRef.current;
    const tempCanvas = tempCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const tempCtx = tempCanvas.getContext('2d');
    
    imageRef.current.onload = () => {
      canvas.width = imageRef.current.width;
      canvas.height = imageRef.current.height;
      tempCanvas.width = imageRef.current.width;
      tempCanvas.height = imageRef.current.height;
      
      ctx.drawImage(imageRef.current, 0, 0);
      tempCtx.drawImage(imageRef.current, 0, 0);
      
      saveToHistory();
    };
    
    imageRef.current.src = screenshot.image;
  }, [screenshot.image]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        undo();
      } else if (e.ctrlKey && e.key === 'y') {
        e.preventDefault();
        redo();
      } else if (e.key === 'Delete' && selectedObjects.length > 0) {
        deleteSelectedObjects();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedObjects, drawingHistory, historyIndex]);

  const saveToHistory = () => {
    // Save both the canvas state and objects array
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const imageData = canvas.toDataURL();
    const objectsData = JSON.parse(JSON.stringify(objects.current));
    
    setDrawingHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push({
        imageData,
        objects: objectsData
      });
      setHistoryIndex(newHistory.length - 1);
      return newHistory;
    });
  };

  const drawObjects = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Apply scale and rotation
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(scale, scale);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);
    
    // Draw the base image
    ctx.drawImage(imageRef.current, 0, 0);
    
    // Draw all objects
    objects.current.forEach((obj, index) => {
      ctx.strokeStyle = obj.color;
      ctx.lineWidth = obj.size;
      ctx.fillStyle = obj.fillColor || obj.color;
      
      if (obj.type === 'rectangle') {
        if (obj.fill && obj.fill !== 'stroke') {
          ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
        }
        if (!obj.fill || obj.fill === 'stroke' || obj.fill === 'both') {
          ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);
        }
      } else if (obj.type === 'circle') {
        ctx.beginPath();
        ctx.arc(obj.x, obj.y, obj.radius, 0, Math.PI * 2);
        if (obj.fill && obj.fill !== 'stroke') {
          ctx.fill();
        }
        if (!obj.fill || obj.fill === 'stroke' || obj.fill === 'both') {
          ctx.stroke();
        }
      } else if (obj.type === 'arrow') {
        drawArrow(ctx, obj.fromX, obj.fromY, obj.toX, obj.toY, obj.color, obj.size);
      } else if (obj.type === 'text') {
        ctx.font = `${obj.size * 5}px Arial`;
        ctx.fillStyle = obj.color;
        ctx.fillText(obj.text, obj.x, obj.y);
      } else if (obj.type === 'brush' || obj.type === 'eraser') {
        ctx.strokeStyle = obj.color;
        ctx.lineWidth = obj.size;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        if (obj.points && obj.points.length > 1) {
          ctx.beginPath();
          ctx.moveTo(obj.points[0].x, obj.points[0].y);
          
          for (let i = 1; i < obj.points.length; i++) {
            ctx.lineTo(obj.points[i].x, obj.points[i].y);
          }
          
          ctx.stroke();
        }
      }
      
      // Draw selection handles if object is selected
      if (selectedObjects.includes(index) && !isDrawing.current) {
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        
        if (obj.type === 'rectangle') {
          ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);
          drawResizeHandles(ctx, obj.x, obj.y, obj.width, obj.height);
        } else if (obj.type === 'circle') {
          ctx.beginPath();
          ctx.arc(obj.x, obj.y, obj.radius, 0, Math.PI * 2);
          ctx.stroke();
          drawResizeHandles(ctx, obj.x - obj.radius, obj.y - obj.radius, obj.radius * 2, obj.radius * 2);
        } else if (obj.type === 'arrow') {
          const minX = Math.min(obj.fromX, obj.toX);
          const minY = Math.min(obj.fromY, obj.toY);
          const maxX = Math.max(obj.fromX, obj.toX);
          const maxY = Math.max(obj.fromY, obj.toY);
          ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
          drawResizeHandles(ctx, minX, minY, maxX - minX, maxY - minY);
        } else if (obj.type === 'text') {
          const textWidth = ctx.measureText(obj.text).width;
          ctx.strokeRect(obj.x, obj.y - obj.size * 5, textWidth, obj.size * 5);
          drawResizeHandles(ctx, obj.x, obj.y - obj.size * 5, textWidth, obj.size * 5);
        } else if (obj.type === 'brush' || obj.type === 'eraser') {
          if (obj.points && obj.points.length > 0) {
            const minX = Math.min(...obj.points.map(p => p.x));
            const minY = Math.min(...obj.points.map(p => p.y));
            const maxX = Math.max(...obj.points.map(p => p.x));
            const maxY = Math.max(...obj.points.map(p => p.y));
            ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
            drawResizeHandles(ctx, minX, minY, maxX - minX, maxY - minY);
          }
        }
        
        ctx.setLineDash([]);
      }
    });
    
    ctx.restore();
    
    // Draw selection rectangle if selecting
    if (isSelecting.current) {
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      
      const rect = selectionRect.current;
      const x = rect.width < 0 ? rect.x + rect.width : rect.x;
      const y = rect.height < 0 ? rect.y + rect.height : rect.y;
      const width = Math.abs(rect.width);
      const height = Math.abs(rect.height);
      
      ctx.strokeRect(x, y, width, height);
      ctx.setLineDash([]);
    }
  };

  const drawResizeHandles = (ctx, x, y, width, height) => {
    const handleSize = 8;
    ctx.fillStyle = '#3b82f6';
    
    ctx.fillRect(x - handleSize/2, y - handleSize/2, handleSize, handleSize);
    ctx.fillRect(x + width - handleSize/2, y - handleSize/2, handleSize, handleSize);
    ctx.fillRect(x - handleSize/2, y + height - handleSize/2, handleSize, handleSize);
    ctx.fillRect(x + width - handleSize/2, y + height - handleSize/2, handleSize, handleSize);
  };

  const checkObjectSelection = (x, y) => {
    if (selectedObjects.length > 0) {
      const obj = objects.current[selectedObjects[0]];
      let bbox;
      
      if (obj.type === 'rectangle') {
        bbox = { x: obj.x, y: obj.y, width: obj.width, height: obj.height };
      } else if (obj.type === 'circle') {
        bbox = { 
          x: obj.x - obj.radius, 
          y: obj.y - obj.radius, 
          width: obj.radius * 2, 
          height: obj.radius * 2 
        };
      } else if (obj.type === 'arrow') {
        const minX = Math.min(obj.fromX, obj.toX);
        const minY = Math.min(obj.fromY, obj.toY);
        const maxX = Math.max(obj.fromX, obj.toX);
        const maxY = Math.max(obj.fromY, obj.toY);
        bbox = { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
      } else if (obj.type === 'text') {
        const ctx = canvasRef.current.getContext('2d');
        ctx.font = `${obj.size * 5}px Arial`;
        const textWidth = ctx.measureText(obj.text).width;
        bbox = { x: obj.x, y: obj.y - obj.size * 5, width: textWidth, height: obj.size * 5 };
      } else if (obj.type === 'brush' || obj.type === 'eraser') {
        if (obj.points && obj.points.length > 0) {
          const minX = Math.min(...obj.points.map(p => p.x));
          const minY = Math.min(...obj.points.map(p => p.y));
          const maxX = Math.max(...obj.points.map(p => p.x));
          const maxY = Math.max(...obj.points.map(p => p.y));
          bbox = { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
        }
      }
      
      if (bbox) {
        const handleSize = 8;
        
        if (Math.abs(x - bbox.x) < handleSize && Math.abs(y - bbox.y) < handleSize) {
          resizeHandle.current = 'top-left';
          return { type: 'resize', index: selectedObjects[0] };
        }
        if (Math.abs(x - (bbox.x + bbox.width)) < handleSize && Math.abs(y - bbox.y) < handleSize) {
          resizeHandle.current = 'top-right';
          return { type: 'resize', index: selectedObjects[0] };
        }
        if (Math.abs(x - bbox.x) < handleSize && Math.abs(y - (bbox.y + bbox.height)) < handleSize) {
          resizeHandle.current = 'bottom-left';
          return { type: 'resize', index: selectedObjects[0] };
        }
        if (Math.abs(x - (bbox.x + bbox.width)) < handleSize && Math.abs(y - (bbox.y + bbox.height)) < handleSize) {
          resizeHandle.current = 'bottom-right';
          return { type: 'resize', index: selectedObjects[0] };
        }
      }
    }
    
    for (let i = objects.current.length - 1; i >= 0; i--) {
      const obj = objects.current[i];
      
      if (obj.type === 'rectangle') {
        if (x >= obj.x && x <= obj.x + obj.width && y >= obj.y && y <= obj.y + obj.height) {
          return { type: 'object', index: i };
        }
      } else if (obj.type === 'circle') {
        const distance = Math.sqrt(Math.pow(x - obj.x, 2) + Math.pow(y - obj.y, 2));
        if (distance <= obj.radius) {
          return { type: 'object', index: i };
        }
      } else if (obj.type === 'arrow') {
        const minX = Math.min(obj.fromX, obj.toX);
        const minY = Math.min(obj.fromY, obj.toY);
        const maxX = Math.max(obj.fromX, obj.toX);
        const maxY = Math.max(obj.fromY, obj.toY);
        if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
          return { type: 'object', index: i };
        }
      } else if (obj.type === 'text') {
        const ctx = canvasRef.current.getContext('2d');
        ctx.font = `${obj.size * 5}px Arial`;
        const textWidth = ctx.measureText(obj.text).width;
        if (x >= obj.x && x <= obj.x + textWidth && y >= obj.y - obj.size * 5 && y <= obj.y) {
          return { type: 'object', index: i };
        }
      } else if (obj.type === 'brush' || obj.type === 'eraser') {
        if (obj.points && obj.points.length > 1) {
          for (let j = 0; j < obj.points.length - 1; j++) {
            const p1 = obj.points[j];
            const p2 = obj.points[j + 1];
            
            const A = x - p1.x;
            const B = y - p1.y;
            const C = p2.x - p1.x;
            const D = p2.y - p1.y;
            
            const dot = A * C + B * D;
            const len_sq = C * C + D * D;
            let param = -1;
            
            if (len_sq !== 0) {
              param = dot / len_sq;
            }
            
            let xx, yy;
            
            if (param < 0) {
              xx = p1.x;
              yy = p1.y;
            } else if (param > 1) {
              xx = p2.x;
              yy = p2.y;
            } else {
              xx = p1.x + param * C;
              yy = p1.y + param * D;
            }
            
            const dx = x - xx;
            const dy = y - yy;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance <= obj.size * 2) {
              return { type: 'object', index: i };
            }
          }
        }
      }
    }
    
    return null;
  };

  const getObjectsInSelection = (rect) => {
    const selected = [];
    const normalizedRect = {
      x: rect.width < 0 ? rect.x + rect.width : rect.x,
      y: rect.height < 0 ? rect.y + rect.height : rect.y,
      width: Math.abs(rect.width),
      height: Math.abs(rect.height)
    };
    
    objects.current.forEach((obj, index) => {
      if (obj.type === 'rectangle') {
        if (
          obj.x + obj.width >= normalizedRect.x && 
          obj.x <= normalizedRect.x + normalizedRect.width &&
          obj.y + obj.height >= normalizedRect.y && 
          obj.y <= normalizedRect.y + normalizedRect.height
        ) {
          selected.push(index);
        }
      } else if (obj.type === 'circle') {
        const closestX = Math.max(normalizedRect.x, Math.min(obj.x, normalizedRect.x + normalizedRect.width));
        const closestY = Math.max(normalizedRect.y, Math.min(obj.y, normalizedRect.y + normalizedRect.height));
        const distance = Math.sqrt(Math.pow(obj.x - closestX, 2) + Math.pow(obj.y - closestY, 2));
        
        if (distance <= obj.radius) {
          selected.push(index);
        }
      } else if (obj.type === 'arrow') {
        const minX = Math.min(obj.fromX, obj.toX);
        const minY = Math.min(obj.fromY, obj.toY);
        const maxX = Math.max(obj.fromX, obj.toX);
        const maxY = Math.max(obj.fromY, obj.toY);
        
        if (
          minX <= normalizedRect.x + normalizedRect.width &&
          maxX >= normalizedRect.x &&
          minY <= normalizedRect.y + normalizedRect.height &&
          maxY >= normalizedRect.y
        ) {
          selected.push(index);
        }
      } else if (obj.type === 'text') {
        const ctx = canvasRef.current.getContext('2d');
        ctx.font = `${obj.size * 5}px Arial`;
        const textWidth = ctx.measureText(obj.text).width;
        
        if (
          obj.x + textWidth >= normalizedRect.x && 
          obj.x <= normalizedRect.x + normalizedRect.width &&
          obj.y >= normalizedRect.y && 
          obj.y - obj.size * 5 <= normalizedRect.y + normalizedRect.height
        ) {
          selected.push(index);
        }
      } else if (obj.type === 'brush' || obj.type === 'eraser') {
        if (obj.points && obj.points.length > 0) {
          const minX = Math.min(...obj.points.map(p => p.x));
          const minY = Math.min(...obj.points.map(p => p.y));
          const maxX = Math.max(...obj.points.map(p => p.x));
          const maxY = Math.max(...obj.points.map(p => p.y));
          
          if (
            minX <= normalizedRect.x + normalizedRect.width &&
            maxX >= normalizedRect.x &&
            minY <= normalizedRect.y + normalizedRect.height &&
            maxY >= normalizedRect.y
          ) {
            selected.push(index);
          }
        }
      }
    });
    
    return selected;
  };

  const handleMouseDown = (e) => {
    const coords = getCanvasCoordinates(e);
    const x = coords.x;
    const y = coords.y;
    
    lastX.current = x;
    lastY.current = y;
    
    if (tool === 'select') {
      const selection = checkObjectSelection(x, y);
      
      if (selection) {
        if (selection.type === 'object') {
          if (e.shiftKey) {
            setSelectedObjects(prev => 
              prev.includes(selection.index) 
                ? prev.filter(i => i !== selection.index)
                : [...prev, selection.index]
            );
          } else if (!selectedObjects.includes(selection.index)) {
            setSelectedObjects([selection.index]);
          }
          
          isMoving.current = true;
          initialObjectPositions.current = selectedObjects.map(index => ({
            ...objects.current[index],
            index
          }));
          offsetX.current = x;
          offsetY.current = y;
        } else if (selection.type === 'resize') {
          isResizing.current = true;
          offsetX.current = x;
          offsetY.current = y;
        }
        return;
      } else {
        isSelecting.current = true;
        selectionRect.current = { x, y, width: 0, height: 0 };
        if (!e.shiftKey) {
          setSelectedObjects([]);
        }
      }
    }
    
    if (tool === 'text') {
      setTextPosition({ x, y });
      return;
    }
    
    isDrawing.current = true;
    startX.current = x;
    startY.current = y;
    
    if (tool === 'brush' || tool === 'eraser') {
      const newStroke = {
        type: tool,
        points: [{ x, y }],
        color: tool === 'eraser' ? '#FFFFFF' : color,
        size: brushSize
      };
      
      objects.current.push(newStroke);
      setSelectedObjects([objects.current.length - 1]);
    }
    
    saveToHistory();
  };

  const handleMouseMove = (e) => {
    const coords = getCanvasCoordinates(e);
    const x = coords.x;
    const y = coords.y;
    
    lastX.current = x;
    lastY.current = y;
    
    if (isSelecting.current) {
      selectionRect.current.width = x - selectionRect.current.x;
      selectionRect.current.height = y - selectionRect.current.y;
      drawObjects();
      return;
    }
    
    if (isMoving.current && selectedObjects.length > 0) {
      const dx = x - offsetX.current;
      const dy = y - offsetY.current;
      
      selectedObjects.forEach((index, i) => {
        const initialObj = initialObjectPositions.current.find(obj => obj.index === index);
        if (!initialObj) return;
        
        const obj = objects.current[index];
        obj.x = initialObj.x + dx;
        obj.y = initialObj.y + dy;
        
        if (obj.type === 'arrow') {
          obj.toX = initialObj.toX + dx;
          obj.toY = initialObj.toY + dy;
          obj.fromX = initialObj.fromX + dx;
          obj.fromY = initialObj.fromY + dy;
        } else if (obj.type === 'brush' || obj.type === 'eraser') {
          obj.points = initialObj.points.map(point => ({
            x: point.x + dx,
            y: point.y + dy
          }));
        }
      });
      
      drawObjects();
      return;
    }
    
    if (isResizing.current && selectedObjects.length > 0) {
      const obj = objects.current[selectedObjects[0]];
      const dx = x - offsetX.current;
      const dy = y - offsetY.current;
      
      if (obj.type === 'rectangle') {
        if (resizeHandle.current === 'top-left') {
          obj.x += dx;
          obj.y += dy;
          obj.width -= dx;
          obj.height -= dy;
        } else if (resizeHandle.current === 'top-right') {
          obj.y += dy;
          obj.width += dx;
          obj.height -= dy;
        } else if (resizeHandle.current === 'bottom-left') {
          obj.x += dx;
          obj.width -= dx;
          obj.height += dy;
        } else if (resizeHandle.current === 'bottom-right') {
          obj.width += dx;
          obj.height += dy;
        }
      } else if (obj.type === 'circle') {
        if (resizeHandle.current === 'top-left') {
          obj.radius -= Math.max(dx, dy) / 2;
        } else if (resizeHandle.current === 'top-right') {
          obj.radius += Math.max(dx, -dy) / 2;
        } else if (resizeHandle.current === 'bottom-left') {
          obj.radius += Math.max(-dx, dy) / 2;
        } else if (resizeHandle.current === 'bottom-right') {
          obj.radius += Math.max(dx, dy) / 2;
        }
        obj.radius = Math.max(5, obj.radius);
      } else if (obj.type === 'arrow') {
        if (resizeHandle.current === 'top-left') {
          obj.fromX += dx;
          obj.fromY += dy;
        } else if (resizeHandle.current === 'top-right') {
          obj.toX += dx;
          obj.fromY += dy;
        } else if (resizeHandle.current === 'bottom-left') {
          obj.fromX += dx;
          obj.toY += dy;
        } else if (resizeHandle.current === 'bottom-right') {
          obj.toX += dx;
          obj.toY += dy;
        }
      } else if (obj.type === 'text') {
        if (resizeHandle.current === 'top-left') {
          obj.size = Math.max(5, obj.size - dx / 5);
        } else if (resizeHandle.current === 'top-right') {
          obj.size = Math.max(5, obj.size + dx / 5);
        } else if (resizeHandle.current === 'bottom-left') {
          obj.size = Math.max(5, obj.size - dx / 5);
        } else if (resizeHandle.current === 'bottom-right') {
          obj.size = Math.max(5, obj.size + dx / 5);
        }
      } else if (obj.type === 'brush' || obj.type === 'eraser') {
        const scaleX = 1 + dx / 100;
        const scaleY = 1 + dy / 100;
        
        const centerX = obj.points.reduce((sum, p) => sum + p.x, 0) / obj.points.length;
        const centerY = obj.points.reduce((sum, p) => sum + p.y, 0) / obj.points.length;
        
        obj.points.forEach(point => {
          point.x = centerX + (point.x - centerX) * scaleX;
          point.y = centerY + (point.y - centerY) * scaleY;
        });
      }
      
      offsetX.current = x;
      offsetY.current = y;
      drawObjects();
      return;
    }
    
    if (!isDrawing.current || tool === 'text') return;
    
    const canvas = canvasRef.current;
    const tempCanvas = tempCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const tempCtx = tempCanvas.getContext('2d');
    
    tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
    tempCtx.drawImage(canvas, 0, 0);
    
    if (tool === 'brush' || tool === 'eraser') {
      const currentStroke = objects.current[objects.current.length - 1];
      currentStroke.points.push({ x, y });
      drawObjects();
    } else if (tool === 'rectangle') {
      tempCtx.strokeStyle = color;
      tempCtx.lineWidth = brushSize;
      tempCtx.strokeRect(startX.current, startY.current, x - startX.current, y - startY.current);
    } else if (tool === 'circle') {
      tempCtx.strokeStyle = color;
      tempCtx.lineWidth = brushSize;
      const radius = Math.sqrt(Math.pow(x - startX.current, 2) + Math.pow(y - startY.current, 2));
      tempCtx.beginPath();
      tempCtx.arc(startX.current, startY.current, radius, 0, Math.PI * 2);
      tempCtx.stroke();
    } else if (tool === 'arrow') {
      drawArrow(tempCtx, startX.current, startY.current, x, y, color, brushSize);
    }
  };

  const handleMouseUp = () => {
    if (isSelecting.current) {
      isSelecting.current = false;
      const selected = getObjectsInSelection(selectionRect.current);
      setSelectedObjects(selected);
      drawObjects();
      saveToHistory();
      return;
    }
    
    if (isMoving.current || isResizing.current) {
      isMoving.current = false;
      isResizing.current = false;
      saveToHistory();
      return;
    }
    
    if (!isDrawing.current) return;
    
    isDrawing.current = false;
    
    const canvas = canvasRef.current;
    const tempCanvas = tempCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const tempCtx = tempCanvas.getContext('2d');
    
    if (tool === 'brush' || tool === 'eraser') {
      drawObjects();
    } else {
      let newObj;
      
      if (tool === 'rectangle') {
        newObj = {
          type: 'rectangle',
          x: Math.min(startX.current, lastX.current),
          y: Math.min(startY.current, lastY.current),
          width: Math.abs(lastX.current - startX.current),
          height: Math.abs(lastY.current - startY.current),
          color: color,
          size: brushSize,
          fill: fillMode
        };
      } else if (tool === 'circle') {
        const radius = Math.sqrt(Math.pow(lastX.current - startX.current, 2) + Math.pow(lastY.current - startY.current, 2));
        newObj = {
          type: 'circle',
          x: startX.current,
          y: startY.current,
          radius: radius,
          color: color,
          size: brushSize,
          fill: fillMode
        };
      } else if (tool === 'arrow') {
        newObj = {
          type: 'arrow',
          fromX: startX.current,
          fromY: startY.current,
          toX: lastX.current,
          toY: lastY.current,
          color: color,
          size: brushSize
        };
      }
      
      if (newObj) {
        objects.current.push(newObj);
        setSelectedObjects([objects.current.length - 1]);
        drawObjects();
      }
      
      tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
    }
    
    saveToHistory();
  };

  const drawArrow = (ctx, fromX, fromY, toX, toY, arrowColor, arrowSize) => {
    const headlen = 15;
    const angle = Math.atan2(toY - fromY, toX - fromX);
    
    ctx.strokeStyle = arrowColor;
    ctx.lineWidth = arrowSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(
      toX - headlen * Math.cos(angle - Math.PI / 6),
      toY - headlen * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      toX - headlen * Math.cos(angle + Math.PI / 6),
      toY - headlen * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fillStyle = arrowColor;
    ctx.fill();
  };

  const restoreFromHistory = () => {
    if (historyIndex < 0) return;
    
    const history = drawingHistory[historyIndex];
    const canvas = canvasRef.current;
    const tempCanvas = tempCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const tempCtx = tempCanvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
      tempCtx.drawImage(img, 0, 0);
      
      // Restore objects
      objects.current = history.objects ? JSON.parse(JSON.stringify(history.objects)) : [];
      drawObjects();
    };
    
    img.src = history.imageData;
  };

  const addText = () => {
    if (!textInput || !textPosition) return;
    
    objects.current.push({
      type: 'text',
      x: textPosition.x,
      y: textPosition.y,
      text: textInput,
      color: color,
      size: brushSize
    });
    
    setSelectedObjects([objects.current.length - 1]);
    drawObjects();
    
    setTextInput('');
    setTextPosition(null);
    setTool('select');
    saveToHistory();
  };

  const undo = () => {
    if (historyIndex <= 0) return;
    
    setHistoryIndex(prev => prev - 1);
    restoreFromHistory();
  };

  const redo = () => {
    if (historyIndex >= drawingHistory.length - 1) return;
    
    setHistoryIndex(prev => prev + 1);
    restoreFromHistory();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const tempCanvas = tempCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const tempCtx = tempCanvas.getContext('2d');
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(imageRef.current, 0, 0);
    tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
    tempCtx.drawImage(imageRef.current, 0, 0);
    
    objects.current = [];
    setSelectedObjects([]);
    
    saveToHistory();
  };

  const deleteSelectedObjects = () => {
    if (selectedObjects.length > 0) {
      const sortedIndices = [...selectedObjects].sort((a, b) => b - a);
      sortedIndices.forEach(index => {
        objects.current.splice(index, 1);
      });
      setSelectedObjects([]);
      drawObjects();
      saveToHistory();
    }
  };

  const rotateSelectedObjects = (angle) => {
    if (selectedObjects.length === 0) return;
    
    selectedObjects.forEach(index => {
      const obj = objects.current[index];
      if (!obj.angle) obj.angle = 0;
      obj.angle += angle;
    });
    
    drawObjects();
    saveToHistory();
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    
    // Draw the base image
    tempCtx.drawImage(imageRef.current, 0, 0);
    
    // Draw all objects
    objects.current.forEach(obj => {
      tempCtx.strokeStyle = obj.color;
      tempCtx.lineWidth = obj.size;
      tempCtx.fillStyle = obj.fillColor || obj.color;
      
      if (obj.type === 'rectangle') {
        if (obj.fill && obj.fill !== 'stroke') {
          tempCtx.fillRect(obj.x, obj.y, obj.width, obj.height);
        }
        if (!obj.fill || obj.fill === 'stroke' || obj.fill === 'both') {
          tempCtx.strokeRect(obj.x, obj.y, obj.width, obj.height);
        }
      } else if (obj.type === 'circle') {
        tempCtx.beginPath();
        tempCtx.arc(obj.x, obj.y, obj.radius, 0, Math.PI * 2);
        if (obj.fill && obj.fill !== 'stroke') {
          tempCtx.fill();
        }
        if (!obj.fill || obj.fill === 'stroke' || obj.fill === 'both') {
          tempCtx.stroke();
        }
      } else if (obj.type === 'arrow') {
        drawArrow(tempCtx, obj.fromX, obj.fromY, obj.toX, obj.toY, obj.color, obj.size);
      } else if (obj.type === 'text') {
        tempCtx.font = `${obj.size * 5}px Arial`;
        tempCtx.fillStyle = obj.color;
        tempCtx.fillText(obj.text, obj.x, obj.y);
      } else if (obj.type === 'brush' || obj.type === 'eraser') {
        tempCtx.strokeStyle = obj.color;
        tempCtx.lineWidth = obj.size;
        tempCtx.lineCap = 'round';
        tempCtx.lineJoin = 'round';
        
        if (obj.points && obj.points.length > 1) {
          tempCtx.beginPath();
          tempCtx.moveTo(obj.points[0].x, obj.points[0].y);
          
          for (let i = 1; i < obj.points.length; i++) {
            tempCtx.lineTo(obj.points[i].x, obj.points[i].y);
          }
          
          tempCtx.stroke();
        }
      }
    });
    
    const imageData = tempCanvas.toDataURL('image/png');
    
    onSave({
      ...screenshot,
      name: title,
      description,
      folderId: folderId || null,
      image: imageData
    });
  };

  return (
    <div className={styles.fullscreenEditor}>
      <div className={styles.editorHeader}>
        <h2>Редактирование скриншота</h2>
      </div>
      
      <div className={styles.editorTools}>
        <button 
          className={`${styles.toolButton} ${tool === 'select' ? styles.active : ''}`}
          onClick={() => setTool('select')}
        >
          ↦ Выделение
        </button>
        <button 
          className={`${styles.toolButton} ${tool === 'brush' ? styles.active : ''}`}
          onClick={() => setTool('brush')}
        >
          ✏️ Кисть
        </button>
        <button 
          className={`${styles.toolButton} ${tool === 'eraser' ? styles.active : ''}`}
          onClick={() => setTool('eraser')}
        >
          🧽 Ластик
        </button>
        <button 
          className={`${styles.toolButton} ${tool === 'rectangle' ? styles.active : ''}`}
          onClick={() => setTool('rectangle')}
        >
          ▭ Прямоугольник
        </button>
        <button 
          className={`${styles.toolButton} ${tool === 'circle' ? styles.active : ''}`}
          onClick={() => setTool('circle')}
        >
          ○ Круг
        </button>
        <button 
          className={`${styles.toolButton} ${tool === 'arrow' ? styles.active : ''}`}
          onClick={() => setTool('arrow')}
        >
          ➤ Стрелка
        </button>
        <button 
          className={`${styles.toolButton} ${tool === 'text' ? styles.active : ''}`}
          onClick={() => setTool('text')}
        >
          Текст
        </button>
        
        <div className={styles.toolOptions}>
          <div className={styles.colorPicker}>
            {colors.map((c) => (
              <div
                key={c}
                className={`${styles.colorOption} ${color === c ? styles.active : ''}`}
                style={{ backgroundColor: c }}
                onClick={() => setColor(c)}
              />
            ))}
          </div>
          
          <div className={styles.sizeSelector}>
            <span>Размер:</span>
            <select 
              value={brushSize} 
              onChange={(e) => setBrushSize(parseInt(e.target.value))}
            >
              <option value="2">Тонкий</option>
              <option value="5">Средний</option>
              <option value="10">Толстый</option>
              <option value="15">Очень толстый</option>
            </select>
          </div>
          
          <div className={styles.fillSelector}>
            <span>Заливка:</span>
            <select 
              value={fillMode} 
              onChange={(e) => setFillMode(e.target.value)}
            >
              <option value="stroke">Контур</option>
              <option value="fill">Заливка</option>
              <option value="both">Контур + Заливка</option>
            </select>
          </div>

          <div className={styles.zoomControls}>
            <span>Масштаб:</span>
            <button onClick={() => setScale(prev => Math.max(0.5, prev - 0.1))}>-</button>
            <span>{Math.round(scale * 100)}%</span>
            <button onClick={() => setScale(prev => Math.min(3, prev + 0.1))}>+</button>
          </div>

          <div className={styles.rotationControls}>
            <span>Поворот:</span>
            <button onClick={() => setRotation(prev => prev - 15)}>↺</button>
            <button onClick={() => setRotation(prev => prev + 15)}>↻</button>
          </div>

          {selectedObjects.length > 0 && (
            <div className={styles.rotationControls}>
              <span>Повернуть объект:</span>
              <button onClick={() => rotateSelectedObjects(-15)}>↺</button>
              <button onClick={() => rotateSelectedObjects(15)}>↻</button>
            </div>
          )}
          
          <button 
            className={styles.toolButton}
            onClick={undo}
            disabled={historyIndex <= 0}
          >
            ↩️ Отменить
          </button>
          
          <button 
            className={styles.toolButton}
            onClick={redo}
            disabled={historyIndex >= drawingHistory.length - 1}
          >
            ↪️ Повторить
          </button>
          
          <button 
            className={styles.toolButton}
            onClick={clearCanvas}
          >
            🗑️ Очистить
          </button>

          {selectedObjects.length > 0 && (
            <button 
              className={styles.toolButton}
              onClick={deleteSelectedObjects}
              style={{ backgroundColor: '#ef4444' }}
            >
              🗑️ Удалить
            </button>
          )}
        </div>
      </div>
      
      <div className={styles.editorContent}>
        <div className={styles.canvasContainer}>
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{
              cursor: tool === 'text' ? 'text' : 
                      tool === 'select' ? 'crosshair' : 'crosshair',
              maxWidth: '100%',
              maxHeight: '100%',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
            }}
          />
          
          <canvas
            ref={tempCanvasRef}
            style={{ display: 'none' }}
          />
          
          {textPosition && (
            <div 
              className={styles.textInputModal}
              style={{ 
                left: `50%`, 
                top: `50%`,
                transform: 'translate(-50%, -50%)'
              }}
            >
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addText()}
                className={styles.textInput}
                autoFocus
                placeholder="Введите текст"
              />
              <div>
                <button onClick={addText}>Добавить</button>
                <button onClick={() => setTextPosition(null)}>Отмена</button>
              </div>
            </div>
          )}
        </div>
        
        <div className={styles.editorSidebar}>
          <div className={styles.editorMetadata}>
            <h3>Свойства скриншота</h3>
            <input
              type="text"
              placeholder="Название скриншота"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={styles.inputField}
            />
            <textarea
              placeholder="Описание"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={styles.textareaField}
            />
            <select
              value={folderId}
              onChange={(e) => setFolderId(e.target.value)}
              className={styles.selectField}
            >
              <option value="">Без папки</option>
              {folders.map(folder => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </select>
          </div>

          {selectedObjects.length > 0 && (
            <div className={styles.editorMetadata}>
              <h3>Свойства объекта</h3>
              <div className={styles.colorPicker}>
                <span>Цвет:</span>
                {colors.map((c) => (
                  <div
                    key={c}
                    className={`${styles.colorOption} ${objects.current[selectedObjects[0]].color === c ? styles.active : ''}`}
                    style={{ backgroundColor: c }}
                    onClick={() => {
                      objects.current[selectedObjects[0]].color = c;
                      drawObjects();
                    }}
                  />
                ))}
              </div>
              
              <div className={styles.sizeSelector}>
                <span>Размер:</span>
                <select 
                  value={objects.current[selectedObjects[0]].size} 
                  onChange={(e) => {
                    objects.current[selectedObjects[0]].size = parseInt(e.target.value);
                    drawObjects();
                  }}
                >
                  <option value="2">Тонкий</option>
                  <option value="5">Средний</option>
                  <option value="10">Толстый</option>
                  <option value="15">Очень толстый</option>
                </select>
              </div>

              {(objects.current[selectedObjects[0]].type === 'rectangle' || 
                objects.current[selectedObjects[0]].type === 'circle') && (
                <div className={styles.fillSelector}>
                  <span>Заливка:</span>
                  <select 
                    value={objects.current[selectedObjects[0]].fill || 'stroke'} 
                    onChange={(e) => {
                      objects.current[selectedObjects[0]].fill = e.target.value;
                      drawObjects();
                    }}
                  >
                    <option value="stroke">Контур</option>
                    <option value="fill">Заливка</option>
                    <option value="both">Контур + Заливка</option>
                  </select>
                </div>
              )}

              <div className={styles.rotationControls}>
                <span>Угол поворота:</span>
                <input
                  type="number"
                  value={objects.current[selectedObjects[0]].angle || 0}
                  onChange={(e) => {
                    objects.current[selectedObjects[0]].angle = parseInt(e.target.value);
                    drawObjects();
                  }}
                  className={styles.inputField}
                />
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className={styles.editorActions}>
        <button onClick={onCancel} className={styles.cancelButton}>
          Отмена
        </button>
        <button onClick={handleSave} className={styles.saveButton}>
          Сохранить
        </button>
      </div>
    </div>
  );
}