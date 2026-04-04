import { memo } from 'react';
import type { CycleProgressProps } from './types';

const CycleProgress = memo(function CycleProgress({ cycleStart, cycleDays, selectedDate }: CycleProgressProps) {
  const start = new Date(cycleStart + 'T00:00:00');
  const current = new Date(selectedDate + 'T00:00:00');
  const daysElapsed = Math.max(0, Math.floor((current.getTime() - start.getTime()) / 86400000));
  const currentDay = Math.min(daysElapsed + 1, cycleDays);
  const progressPct = Math.min(Math.round((currentDay / cycleDays) * 100), 100);

  return (
    <div className="bg-white rounded-xl shadow-lg p-5">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <span>📅</span> 训练周期进度
        </h3>
        <span className="text-sm text-gray-500">第 {currentDay} 天 / 共 {cycleDays} 天</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2.5 rounded-full transition-all"
          style={{ width: `${progressPct}%` }}
        />
      </div>
      <p className="text-xs text-gray-400 mt-1 text-right">{progressPct}%</p>
    </div>
  );
});

export default CycleProgress;
