import React from 'react';

const StatCard = ({ title, value, color, description }) => {
  const colorClasses = {
    blue: 'bg-blue-100 border-blue-400 text-blue-800',
    green: 'bg-green-100 border-green-400 text-green-800',
    red: 'bg-red-100 border-red-400 text-red-800',
    gray: 'bg-gray-100 border-gray-400 text-gray-800',
    purple: 'bg-purple-100 border-purple-400 text-purple-800',
  };

  return (
    <div className={`border rounded-lg p-4 ${colorClasses[color] || colorClasses.blue}`}>
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      <p className="text-3xl font-bold mb-2">{value}</p>
      {description && (
        <p className="text-sm opacity-80">{description}</p>
      )}
    </div>
  );
};

export default StatCard;