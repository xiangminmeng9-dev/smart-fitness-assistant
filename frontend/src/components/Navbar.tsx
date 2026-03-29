import { Link } from 'react-router-dom';
import useAuthStore from '../store/auth';

const Navbar = () => {
  const { user, logout } = useAuthStore();

  return (
    <nav className="bg-white shadow-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link to="/dashboard" className="flex items-center">
                <div className="h-8 w-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">健</span>
                </div>
                <span className="ml-3 text-xl font-bold text-gray-900">智能健身助手</span>
              </Link>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="text-right">
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
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
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