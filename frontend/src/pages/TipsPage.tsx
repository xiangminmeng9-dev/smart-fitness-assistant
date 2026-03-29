import { useEffect, useState } from 'react';
import api from '../api/auth';

interface TipsCategory {
  title: string;
  icon: string;
  bg: string;
  border: string;
  iconBg: string;
  tips: string[];
}

const categories: TipsCategory[] = [
  {
    title: '训练技巧',
    icon: '🏋️',
    bg: 'from-orange-50 to-amber-50',
    border: 'border-orange-100',
    iconBg: 'bg-orange-100',
    tips: [
      '热身5-10分钟再开始正式训练，降低受伤风险',
      '力量训练时注意呼吸节奏：发力时呼气，还原时吸气',
      '每组动作之间休息60-90秒，保持训练节奏',
      '逐渐增加训练重量或次数，避免长期停滞',
      '训练后进行10分钟拉伸，帮助肌肉恢复',
    ],
  },
  {
    title: '饮食营养',
    icon: '🥗',
    bg: 'from-green-50 to-emerald-50',
    border: 'border-green-100',
    iconBg: 'bg-green-100',
    tips: [
      '训练后30分钟内补充蛋白质，促进肌肉修复',
      '每天保证充足的水分摄入，至少2升',
      '减脂期间适当降低碳水摄入，但不要完全断碳',
      '增肌期间保证每公斤体重1.6-2.2克蛋白质摄入',
      '多吃蔬菜水果，补充维生素和膳食纤维',
    ],
  },
  {
    title: '休息恢复',
    icon: '😴',
    bg: 'from-blue-50 to-indigo-50',
    border: 'border-blue-100',
    iconBg: 'bg-blue-100',
    tips: [
      '保证每天7-8小时高质量睡眠',
      '同一肌群训练后至少休息48小时再训练',
      '适当进行泡沫轴放松，缓解肌肉紧张',
      '每周安排1-2天完全休息日',
      '感到身体疲劳或疼痛时，及时调整训练强度',
    ],
  },
  {
    title: '心理建设',
    icon: '🧠',
    bg: 'from-purple-50 to-pink-50',
    border: 'border-purple-100',
    iconBg: 'bg-purple-100',
    tips: [
      '设定具体、可衡量的短期目标，增强成就感',
      '记录训练日志，直观看到自己的进步',
      '找一个训练伙伴，互相监督和鼓励',
      '不要和别人比较，专注于自己的进步',
      '享受运动的过程，而不仅仅关注结果',
    ],
  },
];

const TipsPage = () => {
  const [dailyTips, setDailyTips] = useState<string[]>([]);
  const [tipsLoading, setTipsLoading] = useState(true);
  const [expandedCategory, setExpandedCategory] = useState<number | null>(null);

  const fetchTips = async () => {
    setTipsLoading(true);
    try {
      const res = await api.get('/system/tips');
      setDailyTips(res.data.tips || []);
    } catch {
      setDailyTips([]);
    } finally {
      setTipsLoading(false);
    }
  };

  useEffect(() => {
    fetchTips();
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">健身小贴士</h1>
        <p className="mt-2 text-gray-500">科学健身，从了解正确的知识开始</p>
      </div>

      {/* Daily Tips from API */}
      <DailyTipsCard tips={dailyTips} loading={tipsLoading} onRefresh={fetchTips} />

      {/* Categorized Tips */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {categories.map((cat, idx) => (
          <CategoryCard
            key={cat.title}
            category={cat}
            expanded={expandedCategory === idx}
            onToggle={() => setExpandedCategory(expandedCategory === idx ? null : idx)}
          />
        ))}
      </div>
    </div>
  );
};

export default TipsPage;

/* ---- Sub-components ---- */

function DailyTipsCard({ tips, loading, onRefresh }: { tips: string[]; loading: boolean; onRefresh: () => void }) {
  return (
    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <span>✨</span> 今日推荐
        </h2>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="px-3 py-1.5 text-sm bg-white/20 hover:bg-white/30 rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? '加载中...' : '换一批'}
        </button>
      </div>
      {loading ? (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
        </div>
      ) : tips.length > 0 ? (
        <ul className="space-y-3">
          {tips.map((tip, i) => (
            <li key={i} className="bg-white/10 rounded-lg p-3 text-sm">
              {tip}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-white/70 text-center py-4">暂无推荐</p>
      )}
    </div>
  );
}

function CategoryCard({ category, expanded, onToggle }: { category: TipsCategory; expanded: boolean; onToggle: () => void }) {
  const visibleTips = expanded ? category.tips : category.tips.slice(0, 3);

  return (
    <div className={`bg-gradient-to-br ${category.bg} rounded-xl border ${category.border} p-5`}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`h-10 w-10 ${category.iconBg} rounded-lg flex items-center justify-center`}>
          <span className="text-lg">{category.icon}</span>
        </div>
        <h3 className="font-semibold text-gray-900">{category.title}</h3>
      </div>
      <ul className="space-y-2">
        {visibleTips.map((tip, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-gray-400 flex-shrink-0" />
            {tip}
          </li>
        ))}
      </ul>
      {category.tips.length > 3 && (
        <button onClick={onToggle} className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium">
          {expanded ? '收起' : `查看全部 ${category.tips.length} 条`}
        </button>
      )}
    </div>
  );
}
