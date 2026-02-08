
import React from 'react';
import { COLORS } from '../constants';

interface ProgressBarProps {
  current: number;
  target: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ current, target }) => {
  const percentage = Math.min((current / target) * 100, 100);

  return (
    <div className="w-full">
      <div className="flex justify-between items-end mb-2">
        <div className="flex flex-col">
          <span className="text-sm text-gray-500 font-medium">Arrecadado</span>
          <span className="text-xl font-bold text-gray-800">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(current)}
          </span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-sm text-gray-500 font-medium">Meta</span>
          <span className="text-lg font-semibold text-gray-400">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(target)}
          </span>
        </div>
      </div>
      <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${percentage}%`, backgroundColor: COLORS.primary }}
        />
      </div>
      <div className="mt-1 text-right">
        <span className="text-xs font-bold text-[#24CA68]">{percentage.toFixed(0)}% da meta</span>
      </div>
    </div>
  );
};
