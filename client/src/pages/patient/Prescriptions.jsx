import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Sidebar } from '../../components/Sidebar';
import { patientNav } from '../../components/PatientNav';
import { prescriptionAPI } from '../../services/api';
import toast from 'react-hot-toast';

export const Prescriptions = () => {
  const { user } = useSelector((state) => state.auth);
  const [prescriptions, setPrescriptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPrescriptions = async () => {
      try {
        const response = await prescriptionAPI.getPrescriptionsByPatient(user._id);
        setPrescriptions(response.data);
      } catch (error) {
        toast.error('Failed to load prescriptions');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrescriptions();
  }, [user._id]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="flex bg-gray-100 min-h-screen">
      <Sidebar navItems={patientNav} />
      <div className="flex-1 flex flex-col">
        <Navbar title="My Prescriptions" />
        <div className="p-8">
          {prescriptions.length === 0 ? (
            <div className="card text-center py-12 bg-blue-50">
              <p className="text-gray-600">No prescriptions yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {prescriptions.map((prescription) => (
                <div key={prescription._id} className="card">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">Dr. {prescription.doctorId.name}</h3>
                      <p className="text-sm text-gray-600">{new Date(prescription.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">Medicines</h4>
                    <div className="space-y-2">
                      {prescription.medicines.map((medicine, idx) => (
                        <div key={idx} className="bg-gray-50 p-3 rounded">
                          <p className="font-medium text-gray-900">{medicine.name}</p>
                          <p className="text-sm text-gray-600">
                            {medicine.dosage} • {medicine.frequency} • {medicine.duration}
                          </p>
                          {medicine.instructions && (
                            <p className="text-xs text-gray-700 mt-1">Note: {medicine.instructions}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {prescription.additionalNotes && (
                    <div className="bg-yellow-50 p-3 rounded">
                      <p className="text-sm"><strong>Notes:</strong> {prescription.additionalNotes}</p>
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
