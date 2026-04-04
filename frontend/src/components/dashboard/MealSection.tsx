import { memo } from 'react';
import type { MealSectionProps } from './types';

type MealSource = 'self_cook' | 'takeout' | 'eat_out';

const mealSourceTabs: { key: MealSource; label: string }[] = [
  { key: 'self_cook', label: '自己做' },
  { key: 'takeout', label: '点外卖' },
  { key: 'eat_out', label: '店里吃' },
];

const MealSection = memo(function MealSection({ meals, source, onSourceChange }: MealSectionProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <span className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center text-green-600">🥗</span>
          饮食计划
        </h2>
        <div className="flex bg-gray-100 rounded-lg p-1">
          {mealSourceTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => onSourceChange(tab.key)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                source === tab.key
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        {meals.map((meal, i) => {
          const option = meal[source as keyof typeof meal] as {
            name: string;
            calories: number;
            protein_g: number;
            carbs_g: number;
            fat_g: number;
            ingredients?: string[];
            recipe_brief?: string;
            platform?: string;
            store_suggestion?: string;
            restaurant_type?: string;
          } | undefined;

          if (!option) return null;

          return (
            <div key={i} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                    {meal.meal_type}
                  </span>
                  <span className="text-xs text-gray-400 ml-2">{meal.time}</span>
                </div>
                <p className="text-sm font-semibold text-green-600">{option.calories} 千卡</p>
              </div>
              <p className="font-medium text-gray-900">{option.name}</p>
              <div className="flex gap-4 mt-2">
                <span className="text-xs text-gray-500">蛋白质 {option.protein_g}g</span>
                <span className="text-xs text-gray-500">碳水 {option.carbs_g}g</span>
                <span className="text-xs text-gray-500">脂肪 {option.fat_g}g</span>
              </div>
              {source === 'self_cook' && option.ingredients && (
                <p className="mt-2 text-xs text-gray-500">🛒 食材：{option.ingredients.join('、')}</p>
              )}
              {source === 'self_cook' && option.recipe_brief && (
                <p className="mt-1 text-xs text-gray-500">👨‍🍳 做法：{option.recipe_brief}</p>
              )}
              {source === 'takeout' && option.platform && (
                <p className="mt-2 text-xs text-gray-500">📱 平台：{option.platform}</p>
              )}
              {source === 'takeout' && option.store_suggestion && (
                <p className="mt-1 text-xs text-gray-500">🏪 推荐：{option.store_suggestion}</p>
              )}
              {source === 'eat_out' && option.restaurant_type && (
                <p className="mt-2 text-xs text-gray-500">🍽️ 推荐：{option.restaurant_type}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});

export default MealSection;
