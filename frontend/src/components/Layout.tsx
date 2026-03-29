import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useAuthStore from '../store/auth';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const Layout = () => {
  const { isAuthenticated, _hasHydrated } = useAuthStore();
  const location = useLocation();

  // Wait for Zustand persist to hydrate before checking auth
  if (!_hasHydrated) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;