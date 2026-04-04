import { memo } from 'react';
import type { CalorieSummaryProps } from './types';

const CalorieSummary = memo(function CalorieSummary({ summary }: CalorieSummaryProps) {
  const { bmr, exercise_burned, total_intake, net_calories } = summary;
  const isDeficit = net_calories < 0;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">热量总结</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div className="p-4 bg-green-50 rounded-xl">
          <p className="text-2xl font-bold text-green-600">{total_intake}</p>
          <p className="text-sm text-gray-500 mt-1">摄入 (千卡)</p>
        </div>
        <div className="p-4 bg-orange-50 rounded-xl">
          <p className="text-2xl font-bold text-orange-600">{exercise_burned}</p>
          <p className="text-sm text-gray-500 mt-1">运动消耗 (千卡)</p>
        </div>
        <div className="p-4 bg-blue-50 rounded-xl">
          <p className="text-2xl font-bold text-blue-600">{bmr}</p>
          <p className="text-sm text-gray-500 mt-1">基础代谢 (千卡)</p>
        </div>
        <div className={`p-4 rounded-xl ${isDeficit ? 'bg-purple-50' : 'bg-red-50'}`}>
          <p className={`text-2xl font-bold ${isDeficit ? 'text-purple-600' : 'text-red-600'}`}>
            {net_calories > 0 ? '+' : ''}{net_calories}
          </p>
          <p className="text-sm text-gray-500 mt-1">{isDeficit ? '热量缺口' : '热量盈余'} (千卡)</p>
        </div>
      </div>
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-500 text-center">
          净热量 = 摄入({total_intake}) - 运动消耗({exercise_burned}) - 基础代谢({bmr}) = {net_calories} 千卡
        </p>
      </div>
    </div>
  );
});

export default CalorieSummary;
