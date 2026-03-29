import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import usePlanStore from '../store/plan';
import useProfileStore from '../store/profile';
import type { WorkoutGroup, MealPlan, CalorieSummary as CalorieSummaryType } from '../types/plan';
import type { UserProfile } from '../types/user';

type MealSource = 'self_cook' | 'takeout' | 'eat_out';
const mealSourceTabs: { key: MealSource; label: string }[] = [
  { key: 'self_cook', label: '自己做' },
  { key: 'takeout', label: '点外卖' },
  { key: 'eat_out', label: '店里吃' },
];

const DashboardPage = () => {
  const navigate = useNavigate();
  const { todayPlan, weather, motivation, selectedDate, isLoading, isGenerating, fetchTodayPlan, generateTodayPlan, toggleExerciseComplete, setSelectedDate, fetchWeather, fetchMotivation } = usePlanStore();
  const { profile, fetchProfile } = useProfileStore();
  const [mealSource, setMealSource] = useState<MealSource>('self_cook');
  const [locationName, setLocationName] = useState('');

  useEffect(() => {
    fetchTodayPlan(selectedDate);
    fetchProfile();
  }, []);

  useEffect(() => {
    fetchMotivation(selectedDate);
    if (profile?.location_lat && profile?.location_lng) {
      fetchWeather(profile.location_lat, profile.location_lng, selectedDate);
      // Reverse geocode for display
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${profile.location_lat}&lon=${profile.location_lng}&zoom=10&accept-language=zh`)
        .then(r => r.json())
        .then(data => { if (data.display_name) setLocationName(data.display_name.split(',')[0]); })
        .catch(() => {});
    } else {
      fetchWeather(undefined, undefined, selectedDate);
    }
  }, [profile, selectedDate]);

  const handleGenerate = async () => {
    if (!profile) { navigate('/profile'); return; }
    await generateTodayPlan(selectedDate);
  };

  const changeDate = (offset: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + offset);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载今日计划中...</p>
        </div>
      </div>
    );
  }

  const plan = todayPlan?.plan_data;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <HeaderSection weather={weather} selectedDate={selectedDate} isToday={isToday} locationName={locationName} onChangeDate={changeDate} onGoToday={() => setSelectedDate(new Date().toISOString().split('T')[0])} />
      {motivation && <MotivationBanner quote={motivation.quote} />}

      {profile && <ProfileOverview profile={profile} />}

      {profile?.training_cycle_days && profile?.cycle_start_date && (
        <CycleProgress cycleStart={profile.cycle_start_date} cycleDays={profile.training_cycle_days} selectedDate={selectedDate} />
      )}

      {!todayPlan && (
        <>
          <NoPlanCard isGenerating={isGenerating} hasProfile={!!profile} onGenerate={handleGenerate} />
          {profile && <FitnessTips goal={profile.fitness_goal} />}
        </>
      )}

      {todayPlan && plan && (
        <>
          {/* Split Day Banner */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-5 text-white shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-200">{plan.training_split}</p>
                <h2 className="text-xl font-bold mt-1">{plan.split_day}</h2>
              </div>
              <div className="text-right">
                <div className="text-4xl">💪</div>
                {todayPlan.completed && <span className="text-xs bg-green-400 text-white px-2 py-0.5 rounded-full">已完成</span>}
              </div>
            </div>
          </div>

          {plan.weather_impact && <WeatherImpact text={plan.weather_impact} />}

          {/* Warmup */}
          {plan.warmup?.length > 0 && (
            <PhaseCard title="热身阶段" icon="🔥" items={plan.warmup} bg="from-orange-50 to-amber-50" border="border-orange-100" />
          )}

          {/* Workout Groups */}
          {plan.workout_groups?.map((group, gi) => (
            <WorkoutGroupCard key={gi} group={group} planId={todayPlan.id} groupIndex={gi} onToggleExercise={toggleExerciseComplete} />
          ))}

          {/* Cooldown */}
          {plan.cooldown?.length > 0 && (
            <PhaseCard title="放松拉伸" icon="🧘" items={plan.cooldown} bg="from-teal-50 to-cyan-50" border="border-teal-100" />
          )}

          {/* Meal Plan */}
          <MealSection meals={plan.meal_plan} source={mealSource} onSourceChange={setMealSource} />

          {plan.calorie_summary && (
            <CalorieSummary summary={plan.calorie_summary} />
          )}

          {plan.recommendations?.length > 0 && (
            <RecommendationsCard items={plan.recommendations} />
          )}
        </>
      )}
    </div>
  );
};

export default DashboardPage;

/* ---- Sub-components ---- */

function HeaderSection({ weather, selectedDate, isToday, locationName, onChangeDate, onGoToday }: { weather: any; selectedDate: string; isToday: boolean; locationName: string; onChangeDate: (n: number) => void; onGoToday: () => void }) {
  const dateStr = new Date(selectedDate + 'T00:00:00').toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{isToday ? '今日健身计划' : '健身计划'}</h1>
          <div className="flex items-center gap-3 mt-1">
            <button onClick={() => onChangeDate(-1)} className="p-1 rounded hover:bg-gray-200 transition" aria-label="前一天">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <p className="text-gray-600">{dateStr}</p>
            <button onClick={() => onChangeDate(1)} className="p-1 rounded hover:bg-gray-200 transition" aria-label="后一天">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
            </button>
            {!isToday && (
              <button onClick={onGoToday} className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 transition">回到今天</button>
            )}
          </div>
          {locationName && (
            <p className="mt-1 text-sm text-gray-400 flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
              {locationName}
            </p>
          )}
        </div>
        {weather && (
          <div className="flex items-center gap-3 bg-white rounded-xl shadow px-5 py-3">
            <span className="text-3xl">{weather.icon}</span>
            <div>
              <p className="text-lg font-semibold text-gray-900">{weather.temperature}°C</p>
              <p className="text-sm text-gray-500">{weather.condition} · {weather.location}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MotivationBanner({ quote }: { quote: string }) {
  return (
    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-5 text-white shadow-md">
      <p className="text-lg font-medium text-center">{quote}</p>
    </div>
  );
}

function NoPlanCard({ isGenerating, hasProfile, onGenerate }: { isGenerating: boolean; hasProfile: boolean; onGenerate: () => void }) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-10 text-center">
      <svg className="mx-auto h-16 w-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
      <h2 className="mt-4 text-xl font-semibold text-gray-900">今日还没有健身计划</h2>
      <p className="mt-2 text-gray-500">{hasProfile ? '点击下方按钮，AI将为您生成专业健身计划' : '请先填写个人信息，再生成健身计划'}</p>
      <button onClick={onGenerate} disabled={isGenerating} className="mt-6 px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg shadow-md transition-all disabled:opacity-50">
        {isGenerating ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
            AI生成中...
          </span>
        ) : hasProfile ? '生成今日计划' : '去填写个人信息'}
      </button>
    </div>
  );
}

function WeatherImpact({ text }: { text: string }) {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
      <span className="text-xl">🌤️</span>
      <p className="text-sm text-blue-800">{text}</p>
    </div>
  );
}

function PhaseCard({ title, icon, items, bg, border }: { title: string; icon: string; items: string[]; bg: string; border: string }) {
  return (
    <div className={`bg-gradient-to-br ${bg} rounded-xl ${border} border p-5`}>
      <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
        <span>{icon}</span> {title}
      </h3>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-gray-400 flex-shrink-0" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function WorkoutGroupCard({ group, planId, groupIndex, onToggleExercise }: { group: WorkoutGroup; planId: number; groupIndex: number; onToggleExercise: (planId: number, gi: number, ei: number, done: boolean) => void }) {
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
          <div key={i} className={`p-4 rounded-lg transition-all ${ex.exercise_completed ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}>
            <div className="flex items-center gap-3">
              <button
                onClick={() => onToggleExercise(planId, groupIndex, i, !ex.exercise_completed)}
                className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                  ex.exercise_completed ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 hover:border-green-400'
                }`}
                aria-label={ex.exercise_completed ? '取消完成' : '标记完成'}
              >
                {ex.exercise_completed && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                )}
              </button>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className={`font-medium ${ex.exercise_completed ? 'text-green-700 line-through' : 'text-gray-900'}`}>{ex.name}</p>
                  <p className="text-sm font-semibold text-orange-600">{ex.calories_burned} 千卡</p>
                </div>
                <div className="flex flex-wrap gap-3 mt-2">
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">{ex.sets} 组 × {ex.reps}</span>
                  <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">休息 {ex.rest_seconds}s</span>
                  {ex.weight_suggestion && <span className="text-xs px-2 py-1 bg-gray-200 text-gray-600 rounded-full">{ex.weight_suggestion}</span>}
                </div>
                {ex.notes && <p className="mt-2 text-xs text-gray-500">💡 {ex.notes}</p>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MealSection({ meals, source, onSourceChange }: { meals: MealPlan[]; source: MealSource; onSourceChange: (s: MealSource) => void }) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <span className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center text-green-600">🥗</span>
          饮食计划
        </h2>
        <div className="flex bg-gray-100 rounded-lg p-1">
          {mealSourceTabs.map(tab => (
            <button key={tab.key} onClick={() => onSourceChange(tab.key)} className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${source === tab.key ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        {meals.map((meal, i) => {
          const option = meal[source];
          if (!option) return null;
          return (
            <div key={i} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{meal.meal_type}</span>
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
}

function CalorieSummary({ summary }: { summary: CalorieSummaryType }) {
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
          <p className={`text-2xl font-bold ${isDeficit ? 'text-purple-600' : 'text-red-600'}`}>{net_calories > 0 ? '+' : ''}{net_calories}</p>
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
}

function RecommendationsCard({ items }: { items: string[] }) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <span className="h-8 w-8 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">💡</span>
        专业建议
      </h2>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-purple-400 flex-shrink-0" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function CycleProgress({ cycleStart, cycleDays, selectedDate }: { cycleStart: string; cycleDays: number; selectedDate: string }) {
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
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2.5 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
      </div>
      <p className="text-xs text-gray-400 mt-1 text-right">{progressPct}%</p>
    </div>
  );
}

function ProfileOverview({ profile }: { profile: UserProfile }) {
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
}

function StatCard({ icon, label, value, bg }: { icon: string; label: string; value: string; bg: string }) {
  return (
    <div className={`${bg} rounded-xl p-3 text-center`}>
      <p className="text-lg">{icon}</p>
      <p className="text-xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}

function FitnessTips({ goal }: { goal?: '减脂' | '增肌' }) {
  const fatLossTips = [
    { icon: '🏃', title: '有氧为主', desc: '每周3-5次有氧运动，每次30-45分钟，心率保持在最大心率的60-70%' },
    { icon: '🥗', title: '控制热量', desc: '每日热量缺口300-500千卡，避免极端节食，保证基础代谢' },
    { icon: '💧', title: '充足饮水', desc: '每天至少2L水，运动前后额外补充，促进代谢和脂肪分解' },
    { icon: '😴', title: '充足睡眠', desc: '每晚7-8小时睡眠，睡眠不足会增加饥饿感并降低代谢率' },
  ];
  const muscleGainTips = [
    { icon: '🏋️', title: '力量为主', desc: '每周4-5次力量训练，注重复合动作，逐步增加负重' },
    { icon: '🥩', title: '蛋白质充足', desc: '每公斤体重摄入1.6-2.2g蛋白质，分散在每餐中摄入' },
    { icon: '⏰', title: '训练后补充', desc: '训练后30分钟内补充蛋白质和碳水，促进肌肉恢复和生长' },
    { icon: '📈', title: '渐进超负荷', desc: '每周尝试增加重量或次数，持续给肌肉新的刺激' },
  ];

  const tips = goal === '减脂' ? fatLossTips : goal === '增肌' ? muscleGainTips : [...fatLossTips.slice(0, 2), ...muscleGainTips.slice(0, 2)];
  const title = goal === '减脂' ? '减脂小贴士' : goal === '增肌' ? '增肌小贴士' : '健身小贴士';

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <span className="h-8 w-8 bg-yellow-100 rounded-lg flex items-center justify-center text-yellow-600">📚</span>
        {title}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tips.map((tip, i) => (
          <div key={i} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
            <span className="text-2xl flex-shrink-0">{tip.icon}</span>
            <div>
              <p className="font-medium text-gray-900">{tip.title}</p>
              <p className="text-sm text-gray-500 mt-1">{tip.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
