import { useSelector } from 'react-redux';

export const Navbar = ({ title }) => {
  const { user } = useSelector((state) => state.auth);
  const currentTime = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="bg-white shadow-sm sticky top-0 z-50">
      <div className="flex justify-between items-center px-8 py-4">
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        <div className="flex items-center gap-4 text-gray-700">
          <span className="text-sm">{currentTime}</span>
          <span className="text-sm">📅 {new Date().toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
};
