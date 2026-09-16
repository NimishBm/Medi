import { Link, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/slices/authSlice';

export const Sidebar = ({ navItems }) => {
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <aside className="w-64 bg-white shadow-md h-screen flex flex-col">
      <div className="p-6 border-b">
        <h1 className="text-2xl font-bold text-blue-600">ClinicFlow</h1>
        <p className="text-sm text-gray-600">{user?.role}</p>
      </div>

      <nav className="flex-1 overflow-y-auto p-4">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center px-4 py-3 rounded-lg mb-2 transition-all ${
              location.pathname === item.path
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <span className="mr-3 text-xl">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t">
        <div className="mb-4 pb-4 border-b">
          <p className="font-medium text-gray-900">{user?.name}</p>
          <p className="text-sm text-gray-600">{user?.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all"
        >
          Logout
        </button>
      </div>
    </aside>
  );
};
