import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import usePlanStore from '../store/plan';
import useProfileStore from '../store/profile';
import toast from 'react-hot-toast';

// Dashboard 组件
import {
  HeaderSection,
  WorkoutGroupCard,
  MealSection,
  CalorieSummary,
  CycleProgress,
  ProfileOverview
} from '../components/dashboard';

type MealSource = 'self_cook' | 'takeout' | 'eat_out';

const MUSCLE_GROUP_ICONS: Record<string, string> = {
  '胸': '🫁', '背': '🔙', '肩': '💪', '腿': '🦵',
  '手臂': '🤜', '腹部': '🎯', '核心': '🧘', '有氧': '🏃'
};

const DashboardPage = () => {
  const navigate = useNavigate();
  const {
    todayPlan, weather, motivation, selectedDate, isLoading, isGenerating,
    isWeatherLoading, error, scheduledMuscleGroups, isRestDay, availableMuscleGroups,
    isScheduleLoading, fetchTodayPlan, generateTodayPlan, toggleExerciseComplete,
    setSelectedDate, fetchWeather, fetchMotivation, fetchSchedule
  } = usePlanStore();
  const { profile, fetchProfile } = useProfileStore();
  const [mealSource, setMealSource] = useState<MealSource>('self_cook');
  const [locationName, setLocationName] = useState('');
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [showRegenerate, setShowRegenerate] = useState(false);

  useEffect(() => {
    fetchTodayPlan(selectedDate);
    fetchProfile();
  }, []);

  useEffect(() => {
    fetchMotivation(selectedDate);
    if (profile?.location_lat && profile?.location_lng) {
      fetchWeather(profile.location_lat, profile.location_lng, selectedDate);
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${profile.location_lat}&lon=${profile.location_lng}&zoom=10&accept-language=zh`)
        .then(r => r.json())
        .then(data => { if (data.display_name) setLocationName(data.display_name.split(',')[0]); })
        .catch(() => {});
    } else {
      fetchWeather(undefined, undefined, selectedDate);
    }
  }, [profile, selectedDate]);

  // Fetch schedule when no plan exists
  useEffect(() => {
    if (!todayPlan) {
      fetchSchedule(selectedDate);
    }
  }, [selectedDate, todayPlan]);

  // Initialize selected groups from schedule
  useEffect(() => {
    if (scheduledMuscleGroups && selectedGroups.length === 0) {
      setSelectedGroups(scheduledMuscleGroups);
    }
  }, [scheduledMuscleGroups]);

  const toggleGroup = (group: string) => {
    setSelectedGroups(prev =>
      prev.includes(group) ? prev.filter(g => g !== group) : [...prev, group]
    );
  };

  const handleGenerate = async (groups: string[]) => {
    if (!profile) { navigate('/profile'); return; }
    const success = await generateTodayPlan(selectedDate, groups.length > 0 ? groups : undefined);
    if (!success && error) {
      // Show user-friendly error based on error content
      if (error.includes('AI服务未配置') || error.includes('API Key')) {
        toast.error('请先在"设置"中配置AI模型的API Key', { duration: 5000 });
      } else if (error.includes('AI服务调用失败') || error.includes('502')) {
        toast.error('AI服务暂时不可用，请稍后重试或检查API配置', { duration: 5000 });
      } else if (error.includes('503')) {
        toast.error('AI服务未就绪，请在设置中配置API Key', { duration: 5000 });
      }
    }
    setShowRegenerate(false);
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
      <HeaderSection
        weather={weather}
        selectedDate={selectedDate}
        isToday={isToday}
        locationName={locationName}
        onChangeDate={changeDate}
        onGoToday={() => setSelectedDate(new Date().toISOString().split('T')[0])}
        isWeatherLoading={isWeatherLoading}
      />

      {motivation && <MotivationBanner quote={motivation.quote} />}

      {profile && <ProfileOverview profile={profile} />}

      {profile?.training_cycle_days && profile?.cycle_start_date && (
        <CycleProgress
          cycleStart={profile.cycle_start_date}
          cycleDays={profile.training_cycle_days}
          selectedDate={selectedDate}
        />
      )}

      {!todayPlan && (
        <>
          <MuscleGroupSelectorCard
            isGenerating={isGenerating}
            hasProfile={!!profile}
            onGenerate={handleGenerate}
            scheduledGroups={scheduledMuscleGroups}
            availableGroups={availableMuscleGroups}
            isRestDay={isRestDay}
            isScheduleLoading={isScheduleLoading}
            selectedGroups={selectedGroups}
            onToggleGroup={toggleGroup}
          />
          {profile && <FitnessTips goal={profile.fitness_goal} />}
        </>
      )}

      {todayPlan && plan && !showRegenerate && (
        <>
          <SplitDayBanner plan={plan} isCompleted={todayPlan.completed} />
          {plan.weather_impact && <WeatherImpact text={plan.weather_impact} />}
          {plan.warmup?.length > 0 && <PhaseCard title="热身阶段" icon="🔥" items={plan.warmup} bg="from-orange-50 to-amber-50" border="border-orange-100" />}
          {plan.workout_groups?.map((group, gi) => (
            <WorkoutGroupCard key={gi} group={group} planId={todayPlan.id} groupIndex={gi} onToggleExercise={toggleExerciseComplete} />
          ))}
          {plan.cooldown?.length > 0 && <PhaseCard title="放松拉伸" icon="🧘" items={plan.cooldown} bg="from-teal-50 to-cyan-50" border="border-teal-100" />}
          <MealSection meals={plan.meal_plan} source={mealSource} onSourceChange={setMealSource} />
          {plan.calorie_summary && <CalorieSummary summary={plan.calorie_summary} />}
          {plan.recommendations?.length > 0 && <RecommendationsCard items={plan.recommendations} />}
          <div className="flex justify-center">
            <button
              onClick={() => { setShowRegenerate(true); fetchSchedule(selectedDate); setSelectedGroups([]); }}
              className="px-6 py-2.5 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 hover:text-gray-800 transition text-sm"
            >
              重新生成今日计划
            </button>
          </div>
        </>
      )}

      {todayPlan && showRegenerate && (
        <MuscleGroupSelectorCard
          isGenerating={isGenerating}
          hasProfile={!!profile}
          onGenerate={handleGenerate}
          scheduledGroups={scheduledMuscleGroups}
          availableGroups={availableMuscleGroups}
          isRestDay={isRestDay}
          isScheduleLoading={isScheduleLoading}
          selectedGroups={selectedGroups}
          onToggleGroup={toggleGroup}
          isRegenerate
          onCancel={() => setShowRegenerate(false)}
        />
      )}
    </div>
  );
};

export default DashboardPage;

/* ---- 辅助组件 ---- */

function MotivationBanner({ quote }: { quote: string }) {
  return (
    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-5 text-white shadow-md">
      <p className="text-lg font-medium text-center">{quote}</p>
    </div>
  );
}

function SplitDayBanner({ plan, isCompleted }: { plan: { training_split: string; split_day: string }; isCompleted: boolean }) {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-5 text-white shadow-md">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-blue-200">{plan.training_split}</p>
          <h2 className="text-xl font-bold mt-1">{plan.split_day}</h2>
        </div>
        <div className="text-right">
          <div className="text-4xl">💪</div>
          {isCompleted && <span className="text-xs bg-green-400 text-white px-2 py-0.5 rounded-full">已完成</span>}
        </div>
      </div>
    </div>
  );
}

function MuscleGroupSelectorCard({
  isGenerating,
  hasProfile,
  onGenerate,
  scheduledGroups,
  availableGroups,
  isRestDay,
  isScheduleLoading,
  selectedGroups,
  onToggleGroup,
  isRegenerate = false,
  onCancel,
}: {
  isGenerating: boolean;
  hasProfile: boolean;
  onGenerate: (groups: string[]) => void;
  scheduledGroups: string[] | null;
  availableGroups: string[];
  isRestDay: boolean;
  isScheduleLoading: boolean;
  selectedGroups: string[];
  onToggleGroup: (group: string) => void;
  isRegenerate?: boolean;
  onCancel?: () => void;
}) {
  const isCustomized = JSON.stringify(selectedGroups) !== JSON.stringify(scheduledGroups || []);

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 text-center">
      <svg className="mx-auto h-14 w-14 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
      <h2 className="mt-3 text-xl font-semibold text-gray-900">今日还没有健身计划</h2>

      {isScheduleLoading ? (
        <div className="mt-4 flex justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
        </div>
      ) : availableGroups.length > 0 ? (
        <div className="mt-4">
          {isRestDay && scheduledGroups?.length === 0 ? (
            <div>
              <p className="text-gray-500">今日为休息日</p>
              <p className="text-sm text-gray-400 mt-1">您可以选择肌群覆盖休息日安排</p>
            </div>
          ) : (
            <p className="text-gray-500 mb-3">
              {isCustomized ? '✏️ 已自定义肌群组合' : '🎯 系统推荐肌群（点击可修改）'}
            </p>
          )}
          <div className="flex flex-wrap justify-center gap-3">
            {availableGroups.map(group => {
              const selected = selectedGroups.includes(group);
              return (
                <button
                  key={group}
                  type="button"
                  onClick={() => onToggleGroup(group)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full border-2 transition-all text-sm font-medium ${
                    selected
                      ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm'
                      : 'border-gray-200 text-gray-400 hover:border-gray-400 hover:text-gray-500'
                  }`}
                >
                  <span>{MUSCLE_GROUP_ICONS[group] || '💪'}</span>
                  <span>{group}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="mt-4 text-gray-500">请先在个人信息中选择训练肌群</p>
      )}

      <div className="flex gap-3 justify-center mt-6">
        {isRegenerate && onCancel && (
          <button
            onClick={onCancel}
            className="px-6 py-3 border border-gray-300 text-gray-600 font-medium rounded-lg hover:bg-gray-50 transition"
          >
            取消
          </button>
        )}
        <button
          onClick={() => onGenerate(selectedGroups)}
          disabled={isGenerating || !hasProfile || selectedGroups.length === 0}
          className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
              AI生成中...
            </span>
          ) : !hasProfile ? '去填写个人信息' : isRegenerate ? '重新生成' : '生成今日计划'}
        </button>
      </div>
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
  const antiAgingTips = [
    { icon: '💪', title: '力量抗衰', desc: '力量训练维持肌肉量和基础代谢，是抗衰老的基石' },
    { icon: '🧍', title: '体态年轻', desc: '驼背和腹部突出是显老杀手，核心训练和日常姿势至关重要' },
    { icon: '☀️', title: '防晒护肤', desc: '做好防晒SPF30+，坚持清洁+保湿+防晒的基础护肤流程' },
    { icon: '👁️', title: '眼部状态', desc: '疲劳的眼神让人显老，保证睡眠和适当眼部放松' },
  ];

  const goalTips = goal === '减脂' ? fatLossTips : goal === '增肌' ? muscleGainTips : [...fatLossTips.slice(0, 2), ...muscleGainTips.slice(0, 2)];
  const tips = [...goalTips.slice(0, 3), antiAgingTips[Math.floor(Math.random() * antiAgingTips.length)]];
  const title = goal === '减脂' ? '减脂与抗衰贴士' : goal === '增肌' ? '增肌与抗衰贴士' : '健身与抗衰贴士';

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
