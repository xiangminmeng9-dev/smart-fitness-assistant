import { memo } from 'react';
import type { ProfileOverviewProps } from './types';

function StatCard({ icon, label, value, bg }: { icon: string; label: string; value: string; bg: string }) {
  return (
    <div className={`${bg} rounded-xl p-3 text-center`}>
      <p className="text-lg">{icon}</p>
      <p className="text-xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}

const ProfileOverview = memo(function ProfileOverview({ profile }: ProfileOverviewProps) {
  const bmi = profile.height && profile.weight
    ? (profile.weight / ((profile.height / 100) ** 2)).toFixed(1)
    : null;

  const bmiCategory = bmi ? (
    parseFloat(bmi) < 18.5 ? { label: '偏瘦', color: 'text-blue-600' } :
    parseFloat(bmi) < 24 ? { label: '正常', color: 'text-green-600' } :
    parseFloat(bmi) < 28 ? { label: '偏胖', color: 'text-yellow-600' } :
    { label: '肥胖', color: 'text-red-600' }
  ) : null;

  const goalIcon = profile.fitness_goal === '减脂' ? '🔥' : profile.fitness_goal === '增肌' ? '💪' : '🎯';

  // Estimate daily calorie target (Mifflin-St Jeor rough estimate)
  const bmr = profile.weight && profile.height && profile.age
    ? Math.round(10 * profile.weight + 6.25 * profile.height - 5 * profile.age + 5)
    : null;
  const tdee = bmr ? Math.round(bmr * (profile.fitness_frequency && profile.fitness_frequency >= 4 ? 1.55 : 1.375)) : null;
  const targetCalories = tdee ? (
    profile.fitness_goal === '减脂' ? Math.round(tdee * 0.8) :
    profile.fitness_goal === '增肌' ? Math.round(tdee * 1.15) :
    tdee
  ) : null;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <span className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">📊</span>
        我的身体数据
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {profile.age && <StatCard icon="🎂" label="年龄" value={`${profile.age}岁`} bg="bg-pink-50" />}
        {profile.height && <StatCard icon="📏" label="身高" value={`${profile.height}cm`} bg="bg-indigo-50" />}
        {profile.weight && <StatCard icon="⚖️" label="体重" value={`${profile.weight}kg`} bg="bg-cyan-50" />}
        {bmi && bmiCategory && (
          <div className="bg-emerald-50 rounded-xl p-3 text-center">
            <p className="text-lg">📐</p>
            <p className={`text-xl font-bold ${bmiCategory.color}`}>{bmi}</p>
            <p className="text-xs text-gray-500 mt-0.5">BMI · {bmiCategory.label}</p>
          </div>
        )}
        {profile.fitness_goal && <StatCard icon={goalIcon} label="目标" value={profile.fitness_goal} bg="bg-amber-50" />}
        {profile.fitness_frequency && <StatCard icon="📅" label="每周训练" value={`${profile.fitness_frequency}次`} bg="bg-violet-50" />}
      </div>
      {targetCalories && (
        <div className="mt-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg flex items-center justify-between">
          <span className="text-sm text-gray-600">每日建议摄入热量</span>
          <span className="text-lg font-bold text-emerald-600">{targetCalories} 千卡</span>
        </div>
      )}
    </div>
  );
});

export default ProfileOverview;
