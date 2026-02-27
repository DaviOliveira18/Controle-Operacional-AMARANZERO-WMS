import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  count: number;
  icon: LucideIcon;
  colorClass: string;
  trend?: string;
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ title, count, icon: Icon, colorClass, trend, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-start justify-between transition-all hover:shadow-md ${onClick ? 'cursor-pointer hover:border-indigo-200 hover:bg-slate-50' : ''}`}
    >
      <div>
        <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-gray-900">{count}</h3>
        {trend && <p className="text-xs text-green-600 mt-2 font-medium">{trend}</p>}
      </div>
      <div className={`p-3 rounded-lg ${colorClass} bg-opacity-10`}>
        <Icon className={`w-6 h-6 ${colorClass.replace('bg-', 'text-')}`} />
      </div>
    </div>
  );
};

export default StatCard;