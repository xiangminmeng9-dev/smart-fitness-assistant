import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/auth';
import useProfileStore from '../store/profile';
import { planApi } from '../api/plan';
import type { FitnessPlan } from '../types/plan';

const UserPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { profile, isLoading: profileLoading, fetchProfile } = useProfileStore();
  const [plans, setPlans] = useState<FitnessPlan[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
    planApi.getPlans().then(data => {
      setPlans(data);
      setStatsLoading(false);
    }).catch(() => setStatsLoading(false));
  }, []);

  const stats = useMemo(() => {
    const total = plans.length;
    const completed = plans.filter(p => p.completed).length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, rate };
  }, [plans]);

  const bmi = useMemo(() => {
    if (profile?.height && profile?.weight) {
      const h = Number(profile.height);
      const w = Number(profile.weight);
      if (h > 0 && w > 0) return (w / ((h / 100) ** 2)).toFixed(1);
    }
    return null;
  }, [profile]);

  const bmiCategory = useMemo(() => {
    if (!bmi) return null;
    const val = parseFloat(bmi);
    if (val < 18.5) return { label: '偏瘦', color: 'text-blue-600', bg: 'bg-blue-50' };
    if (val < 24) return { label: '正常', color: 'text-green-600', bg: 'bg-green-50' };
    if (val < 28) return { label: '偏胖', color: 'text-yellow-600', bg: 'bg-yellow-50' };
    return { label: '肥胖', color: 'text-red-600', bg: 'bg-red-50' };
  }, [bmi]);

  const goalLabel = profile?.fitness_goal === '增肌' ? '增肌' : '减脂';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* User Header */}
      <div className="bg-white rounded-xl shadow-lg p-6 flex items-center gap-5">
        <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-2xl">{user?.username?.charAt(0).toUpperCase()}</span>
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{user?.username}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {profile ? `${goalLabel}目标 · 每周${profile.fitness_frequency || 3}次` : '尚未填写个人信息'}
          </p>
        </div>
        <button onClick={() => navigate('/profile')} className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
          {profile ? '编辑资料' : '填写资料'}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <StatsCard label="生成计划" value={statsLoading ? '-' : String(stats.total)} icon="📋" bg="bg-blue-50" color="text-blue-600" />
        <StatsCard label="已完成" value={statsLoading ? '-' : String(stats.completed)} icon="✅" bg="bg-green-50" color="text-green-600" />
        <StatsCard label="完成率" value={statsLoading ? '-' : `${stats.rate}%`} icon="📊" bg="bg-purple-50" color="text-purple-600" />
      </div>

      {/* Profile Summary */}
      {profileLoading ? (
        <div className="bg-white rounded-xl shadow-lg p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-3 text-sm text-gray-500">加载个人信息...</p>
        </div>
      ) : profile ? (
        <ProfileCard profile={profile} bmi={bmi} bmiCategory={bmiCategory} />
      ) : (
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <svg className="mx-auto h-14 w-14 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <h2 className="mt-4 text-lg font-semibold text-gray-900">还没有填写个人信息</h2>
          <p className="mt-1 text-sm text-gray-500">填写后即可生成个性化健身计划</p>
          <button onClick={() => navigate('/profile')} className="mt-5 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg shadow-md hover:from-blue-700 hover:to-indigo-700 transition-all">
            去填写
          </button>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ActionCard title="今日健身计划" desc="查看或生成今天的健身计划" icon="🏋️" onClick={() => navigate('/dashboard')} />
        <ActionCard title="健身小贴士" desc="获取实用的健身知识和建议" icon="💡" onClick={() => navigate('/tips')} />
      </div>
    </div>
  );
};

export default UserPage;

/* ---- Sub-components ---- */

function StatsCard({ label, value, icon, bg, color }: { label: string; value: string; icon: string; bg: string; color: string }) {
  return (
    <div className="bg-white rounded-xl shadow p-5 text-center">
      <div className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${bg} mb-3`}>
        <span className="text-lg">{icon}</span>
      </div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </div>
  );
}

function ProfileCard({ profile, bmi, bmiCategory }: { profile: any; bmi: string | null; bmiCategory: any }) {
  const items = [
    { label: '年龄', value: profile.age ? `${profile.age} 岁` : '-' },
    { label: '身高', value: profile.height ? `${profile.height} cm` : '-' },
    { label: '体重', value: profile.weight ? `${profile.weight} kg` : '-' },
    { label: '健身目标', value: profile.fitness_goal || '-' },
    { label: '每周频次', value: profile.fitness_frequency ? `${profile.fitness_frequency} 次` : '-' },
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">个人信息</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {items.map(item => (
          <div key={item.label} className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">{item.label}</p>
            <p className="text-sm font-medium text-gray-900 mt-1">{item.value}</p>
          </div>
        ))}
        {bmi && bmiCategory && (
          <div className={`p-3 rounded-lg ${bmiCategory.bg}`}>
            <p className="text-xs text-gray-500">BMI 指数</p>
            <p className={`text-sm font-medium mt-1 ${bmiCategory.color}`}>{bmi} ({bmiCategory.label})</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ActionCard({ title, desc, icon, onClick }: { title: string; desc: string; icon: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="bg-white rounded-xl shadow p-5 text-left hover:shadow-md transition-shadow w-full flex items-center gap-4">
      <div className="h-12 w-12 bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0">
        <span className="text-2xl">{icon}</span>
      </div>
      <div>
        <h3 className="font-medium text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500 mt-0.5">{desc}</p>
      </div>
    </button>
  );
}
