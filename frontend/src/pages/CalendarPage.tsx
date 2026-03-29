import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { planApi } from '../api/plan';
import usePlanStore from '../store/plan';
import type { FitnessPlan } from '../types/plan';

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日'];

const CalendarPage = () => {
  const navigate = useNavigate();
  const { setSelectedDate } = usePlanStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [plans, setPlans] = useState<FitnessPlan[]>([]);
  const [loading, setLoading] = useState(true);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    const fetchMonthPlans = async () => {
      setLoading(true);
      const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
      const lastDay = new Date(year, month + 1, 0).getDate();
      const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      try {
        const data = await planApi.getPlans(startDate, endDate);
        setPlans(data);
      } catch {
        setPlans([]);
      } finally {
        setLoading(false);
      }
    };
    fetchMonthPlans();
  }, [year, month]);

  const planMap = useMemo(() => {
    const map: Record<string, FitnessPlan> = {};
    plans.forEach(p => { map[p.plan_date] = p; });
    return map;
  }, [plans]);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    let startWeekday = firstDay.getDay() - 1;
    if (startWeekday < 0) startWeekday = 6;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: (number | null)[] = [];
    for (let i = 0; i < startWeekday; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    while (days.length % 7 !== 0) days.push(null);
    return days;
  }, [year, month]);

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToday = () => setCurrentDate(new Date());

  const stats = useMemo(() => {
    const total = plans.length;
    const completed = plans.filter(p => p.completed).length;
    return { total, completed, rate: total > 0 ? Math.round((completed / total) * 100) : 0 };
  }, [plans]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">日历视图</h1>
        <p className="mt-1 text-gray-500">查看每日健身计划完成情况</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
          <p className="text-sm text-gray-500">本月计划</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
          <p className="text-sm text-gray-500">已完成</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">{stats.rate}%</p>
          <p className="text-sm text-gray-500">完成率</p>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-gray-900">{year}年{month + 1}月</h2>
            <button onClick={goToday} className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors">今天</button>
          </div>
          <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {WEEKDAYS.map(d => (
            <div key={d} className="text-center text-sm font-medium text-gray-500 py-2">{d}</div>
          ))}
        </div>

        {/* Days grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, i) => {
              if (day === null) return <div key={i} className="aspect-square" />;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const plan = planMap[dateStr];
              const isToday = dateStr === todayStr;
              const isFuture = new Date(dateStr) > today;

              return (
                <button
                  key={i}
                  onClick={() => {
                    if (!isFuture) {
                      setSelectedDate(dateStr);
                      navigate('/dashboard');
                    }
                  }}
                  disabled={isFuture}
                  className={`aspect-square rounded-lg flex flex-col items-center justify-center gap-1 text-sm transition-all
                    ${isToday ? 'ring-2 ring-blue-500 bg-blue-50 font-bold' : ''}
                    ${isFuture ? 'text-gray-300 cursor-default' : 'hover:bg-gray-100 cursor-pointer'}
                    ${!isToday && !isFuture ? 'text-gray-700' : ''}
                  `}
                >
                  <span>{day}</span>
                  {plan && (
                    <span className={`h-2 w-2 rounded-full ${plan.completed ? 'bg-green-500' : 'bg-orange-400'}`} />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="h-2.5 w-2.5 rounded-full bg-green-500" /> 已完成
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="h-2.5 w-2.5 rounded-full bg-orange-400" /> 未完成
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="h-2.5 w-2.5 rounded-full ring-2 ring-blue-500 bg-blue-50" /> 今天
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;
