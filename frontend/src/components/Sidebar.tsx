import { NavLink } from 'react-router-dom';
import {
  HomeIcon,
  UserIcon,
  ChartBarIcon,
  LightBulbIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';

const Sidebar = () => {
  const navigation = [
    { name: '仪表盘', href: '/dashboard', icon: HomeIcon },
    { name: '我的主页', href: '/user', icon: UserIcon },
    { name: '健身计划', href: '/profile', icon: ChartBarIcon },
    { name: '健身小贴士', href: '/tips', icon: LightBulbIcon },
    { name: '日历视图', href: '/calendar', icon: CalendarIcon },
  ];

  return (
    <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 pt-16">
      <div className="flex-1 flex flex-col min-h-0 border-r border-gray-200 bg-white">
        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
          <nav className="flex-1 px-4 space-y-1">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon
                      className={`mr-3 flex-shrink-0 h-5 w-5 ${
                        isActive
                          ? 'text-blue-600'
                          : 'text-gray-400 group-hover:text-gray-500'
                      }`}
                      aria-hidden="true"
                    />
                    {item.name}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="mt-8 px-4">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-2">今日目标</h3>
              <p className="text-xs text-gray-600 mb-3">完成您的健身计划，保持动力！</p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '45%' }}></div>
              </div>
              <p className="text-xs text-gray-500 mt-2 text-right">45% 完成</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;