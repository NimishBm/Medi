import { useState, useEffect } from 'react';
import { queueAPI, appointmentAPI } from '../services/api';
import { initSocket } from '../services/socket';

export const WaitingRoomDisplay = () => {
  const [displayData, setDisplayData] = useState(null);
  const [upcomingQueue, setUpcomingQueue] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // For demo, get first doctor's queue
        const appointmentRes = await appointmentAPI.getTodayAppointments();
        if (appointmentRes.data.length > 0) {
          const doctorId = appointmentRes.data[0].doctorId._id;
          const queueRes = await queueAPI.getQueueByDoctorId(doctorId);

          const consulting = queueRes.data.queue.find((q) => q.status === 'CONSULTING');
          const upcoming = queueRes.data.queue
            .filter((q) => q.status === 'WAITING')
            .sort((a, b) => a.tokenNumber - b.tokenNumber)
            .slice(0, 5);

          setDisplayData({
            doctor: appointmentRes.data[0].doctorId,
            consulting,
            room: appointmentRes.data[0].doctorId.roomNumber,
          });
          setUpcomingQueue(upcoming);
        }
      } catch (error) {
        console.error('Failed to load display data', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000); // Refresh every 10 seconds

    const socket = initSocket();
    socket.on('queue-update', fetchData);

    return () => {
      clearInterval(interval);
      socket.off('queue-update', fetchData);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="w-full h-screen bg-blue-600 flex items-center justify-center">
        <div className="text-white text-4xl">Loading...</div>
      </div>
    );
  }

  if (!displayData) {
    return (
      <div className="w-full h-screen bg-blue-600 flex items-center justify-center">
        <div className="text-white text-4xl">No clinic data available</div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-gradient-to-b from-blue-700 to-blue-900 flex flex-col items-center justify-center p-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-8xl font-bold text-white mb-4">CLINIC FLOW</h1>
        <p className="text-4xl text-blue-200">Dr. {displayData.doctor.name}</p>
        <p className="text-2xl text-blue-200 mt-2">{displayData.doctor.specialization}</p>
      </div>

      <div className="flex gap-12 w-full max-w-6xl">
        {/* Currently Serving */}
        <div className="flex-1 flex flex-col items-center">
          <div className="bg-white rounded-3xl shadow-2xl p-12 w-full">
            <p className="text-center text-gray-600 text-3xl font-medium mb-4">NOW SERVING</p>
            <p className="text-center text-8xl font-bold text-blue-600 mb-6">
              #{displayData.consulting?.tokenNumber || '—'}
            </p>
            <p className="text-center text-gray-600 text-3xl font-medium mb-4">ROOM {displayData.room}</p>
            <p className="text-center text-green-600 text-2xl font-semibold">Please proceed to consultation room</p>
          </div>
        </div>

        {/* Up Next */}
        <div className="flex-1">
          <div className="bg-white rounded-3xl shadow-2xl p-8 w-full">
            <p className="text-center text-gray-600 text-2xl font-medium mb-6">UP NEXT</p>
            <div className="space-y-4">
              {upcomingQueue.map((item, idx) => (
                <div
                  key={item._id}
                  className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-2xl border-2 border-blue-300"
                >
                  <p className="text-5xl font-bold text-blue-600 text-center">#{item.tokenNumber}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 text-center">
        <p className="text-white text-2xl">
          {new Date().toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })}
        </p>
      </div>
    </div>
  );
};
