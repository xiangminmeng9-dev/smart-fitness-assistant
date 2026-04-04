import { memo } from 'react';
import type { WorkoutGroupCardProps } from './types';

const WorkoutGroupCard = memo(function WorkoutGroupCard({
  group,
  planId,
  groupIndex,
  onToggleExercise
}: WorkoutGroupCardProps) {
  const completedCount = group.exercises.filter(ex => ex.exercise_completed).length;
  const allDone = completedCount === group.exercises.length;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <span className="h-8 w-8 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600">🏋️</span>
          {group.muscle_group}
        </h3>
        <span className={`text-xs px-2 py-1 rounded-full ${allDone ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
          {completedCount}/{group.exercises.length} 完成
        </span>
      </div>
      <div className="space-y-3">
        {group.exercises.map((ex, i) => (
          <div
            key={i}
            className={`p-4 rounded-lg transition-all ${ex.exercise_completed ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}
          >
            <div className="flex items-center gap-3">
              <button
                onClick={() => onToggleExercise(planId, groupIndex, i, !ex.exercise_completed)}
                className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                  ex.exercise_completed
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'border-gray-300 hover:border-green-400'
                }`}
                aria-label={ex.exercise_completed ? '取消完成' : '标记完成'}
              >
                {ex.exercise_completed && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className={`font-medium ${ex.exercise_completed ? 'text-green-700 line-through' : 'text-gray-900'}`}>
                    {ex.name}
                  </p>
                  <p className="text-sm font-semibold text-orange-600">{ex.calories_burned} 千卡</p>
                </div>
                <div className="flex flex-wrap gap-3 mt-2">
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                    {ex.sets} 组 × {ex.reps}
                  </span>
                  <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                    休息 {ex.rest_seconds}s
                  </span>
                  {ex.weight_suggestion && (
                    <span className="text-xs px-2 py-1 bg-gray-200 text-gray-600 rounded-full">
                      {ex.weight_suggestion}
                    </span>
                  )}
                </div>
                {ex.notes && <p className="mt-2 text-xs text-gray-500">💡 {ex.notes}</p>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

export default WorkoutGroupCard;
