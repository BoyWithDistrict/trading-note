import React, { useState } from 'react';

const PieChart = ({ data, width = 200, height = 200 }) => {
  const [hoveredSegment, setHoveredSegment] = useState(null);
  const radius = Math.min(width, height) / 2;
  const centerX = width / 2;
  const centerY = height / 2;
  let startAngle = 0;

  // Рассчитываем общее количество
  const total = data.reduce((sum, item) => sum + item.value, 0);

  // Функция для преобразования углов в координаты
  const getCoordinates = (angle) => {
    const radians = (angle * Math.PI) / 180;
    return {
      x: centerX + radius * Math.cos(radians),
      y: centerY + radius * Math.sin(radians),
    };
  };

  // Проверка на отсутствие данных
  if (total === 0) {
    return (
      <div className="relative" style={{ width, height }}>
        <svg width={width} height={height}>
          <circle 
            cx={centerX} 
            cy={centerY} 
            r={radius} 
            fill="#f3f4f6" 
            stroke="#d1d5db" 
            strokeWidth="1" 
          />
          <text
            x={centerX}
            y={centerY}
            textAnchor="middle"
            fill="#6b7280"
            fontSize="14"
            fontWeight="bold"
            dy=".3em"
          >
            Нет данных
          </text>
        </svg>
      </div>
    );
  }

  // Генерация сегментов диаграммы
  const segments = data.map((item, index) => {
    const sliceAngle = (item.value / total) * 360;
    const endAngle = startAngle + sliceAngle;
    
    const start = getCoordinates(startAngle);
    const end = getCoordinates(endAngle);
    
    const largeArcFlag = sliceAngle > 180 ? 1 : 0;
    
    const pathData = [
      `M ${centerX},${centerY}`,
      `L ${start.x},${start.y}`,
      `A ${radius},${radius} 0 ${largeArcFlag},1 ${end.x},${end.y}`,
      `Z`
    ].join(' ');

    const segmentCenterAngle = startAngle + sliceAngle / 2;
    const textPosition = getCoordinates(segmentCenterAngle);
    textPosition.x *= 0.7;
    textPosition.y *= 0.7;

    const segment = (
      <g key={index}>
        <path
          d={pathData}
          fill={item.color}
          onMouseEnter={() => setHoveredSegment(index)}
          onMouseLeave={() => setHoveredSegment(null)}
          stroke="#fff"
          strokeWidth="1"
        />
        {sliceAngle > 10 && (
          <text
            x={textPosition.x}
            y={textPosition.y}
            textAnchor="middle"
            fill="#fff"
            fontSize="12"
            fontWeight="bold"
            pointerEvents="none"
          >
            {`${Math.round((item.value / total) * 100)}%`}
          </text>
        )}
      </g>
    );

    startAngle = endAngle;
    return segment;
  });

  return (
    <div className="relative" style={{ width, height }}>
      <svg width={width} height={height}>
        {segments}
        <circle cx={centerX} cy={centerY} r={radius * 0.3} fill="#f8fafc" />
        <text
          x={centerX}
          y={centerY}
          textAnchor="middle"
          fill="#334155"
          fontSize="24"
          fontWeight="bold"
          dy=".3em"
          pointerEvents="none"
        >
          {total}
        </text>
      </svg>

      {hoveredSegment !== null && (
        <div 
          className="absolute bg-white p-4 rounded-lg shadow-lg border border-gray-200"
          style={{
            top: '50%',
            left: 'calc(100% + 20px)',
            transform: 'translateY(-50%)',
            minWidth: '200px',
            zIndex: 10
          }}
        >
          <h3 className="font-bold text-lg mb-2">{data[hoveredSegment].title}</h3>
          <div className="space-y-1">
            <p className="text-gray-700">
              <span className="font-medium">Количество:</span> {data[hoveredSegment].value}
            </p>
            <p className="text-green-600">
              <span className="font-medium">Прибыльные:</span> {data[hoveredSegment].profitable}
            </p>
            <p className="text-red-600">
              <span className="font-medium">Убыточные:</span> {data[hoveredSegment].losing}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PieChart;