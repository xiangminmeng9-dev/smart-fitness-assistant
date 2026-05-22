import { Link } from 'react-router-dom';
import useAuthStore from '../store/auth';

interface NavbarProps {
  onMenuClick?: () => void;
}

const Navbar = ({ onMenuClick }: NavbarProps) => {
  const { user, logout } = useAuthStore();

  return (
    <nav className="bg-white shadow-md border-b border-gray-200 fixed top-0 left-0 right-0 z-30">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            {/* Mobile menu button */}
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 mr-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex-shrink-0">
              <Link to="/dashboard" className="flex items-center">
                <div className="h-8 w-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">健</span>
                </div>
                <span className="ml-3 text-xl font-bold text-gray-900 hidden sm:inline">智能健身助手</span>
              </Link>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{user?.username}</p>
                <p className="text-xs text-gray-500">欢迎回来</p>
              </div>
              <div className="h-8 w-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                <span className="text-white font-medium text-sm">
                  {user?.username?.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>

            <button
              onClick={logout}
              className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              退出
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
