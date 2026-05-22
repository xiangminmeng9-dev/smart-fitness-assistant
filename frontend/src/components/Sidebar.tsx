import { Link, useLocation } from 'react-router-dom';

interface SidebarProps {
  onClose?: () => void;
}

const navItems = [
  { path: '/dashboard', label: '仪表盘', icon: '📊' },
  { path: '/profile', label: '个人资料', icon: '👤' },
  { path: '/calendar', label: '日历', icon: '📅' },
  { path: '/tips', label: '健身贴士', icon: '💡' },
  { path: '/settings', label: '设置', icon: '⚙️' },
];

const Sidebar = ({ onClose }: SidebarProps) => {
  const location = useLocation();

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200 shadow-sm">
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 lg:hidden">
        <span className="text-lg font-bold text-gray-800">智能健身助手</span>
        <button onClick={onClose} className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <span className="mr-3 text-lg">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default Sidebar;
