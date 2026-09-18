import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Sidebar } from '../../components/Sidebar';
import { Navbar } from '../../components/Navbar';
import { patientNav } from '../../components/PatientNav';
import { consultationAPI } from '../../services/api';
import toast from 'react-hot-toast';

export const History = () => {
  const { user } = useSelector((state) => state.auth);
  const [consultations, setConsultations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await consultationAPI.getConsultationsByPatient(user._id);
        setConsultations(response.data);
      } catch (error) {
        toast.error('Failed to load medical history');
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [user._id]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="flex bg-gray-100 min-h-screen">
      <Sidebar navItems={patientNav} />
      <div className="flex-1 flex flex-col">
        <Navbar title="Medical History" />
        <div className="p-8">
          {consultations.length === 0 ? (
            <div className="card text-center py-12 bg-blue-50">
              <p className="text-gray-600">No consultation history</p>
            </div>
          ) : (
            <div className="space-y-4">
              {consultations.map((consultation) => (
                <div key={consultation._id} className="card">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Dr. {consultation.doctorId.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {consultation.doctorId.specialization}
                      </p>
                    </div>
                    <p className="text-sm text-gray-600">
                      {new Date(consultation.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  {consultation.symptoms.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 mb-2">Symptoms</h4>
                      <p className="text-sm text-gray-700">{consultation.symptoms.join(', ')}</p>
                    </div>
                  )}

                  {consultation.diagnosis && (
                    <div className="mb-4 bg-green-50 p-3 rounded">
                      <h4 className="font-medium text-gray-900 mb-1">Diagnosis</h4>
                      <p className="text-sm text-gray-700">{consultation.diagnosis}</p>
                    </div>
                  )}

                  {consultation.treatmentPlan && (
                    <div className="bg-blue-50 p-3 rounded">
                      <h4 className="font-medium text-gray-900 mb-1">Treatment Plan</h4>
                      <p className="text-sm text-gray-700">{consultation.treatmentPlan}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
