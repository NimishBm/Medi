import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export const BookAppointment = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const doctorId = searchParams.get('doctorId');
    if (doctorId) {
      navigate(`/patient/doctors/${doctorId}`);
    } else {
      navigate('/patient');
    }
  }, [navigate, searchParams]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
};
