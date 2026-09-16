import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Sidebar } from '../../components/Sidebar';
import { Navbar } from '../../components/Navbar';
import { paymentAPI } from '../../services/api';
import toast from 'react-hot-toast';

const patientNav = [
  { path: '/patient', label: 'Dashboard', icon: '📊' },
  { path: '/patient/payments', label: 'Payments', icon: '💰' },
];

export const Payments = () => {
  const { user } = useSelector((state) => state.auth);
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const response = await paymentAPI.getPaymentsByPatient(user._id);
        setPayments(response.data);
      } catch (error) {
        toast.error('Failed to load payments');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPayments();
  }, [user._id]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  const totalPaid = payments.filter((p) => p.status === 'PAID').reduce((sum, p) => sum + p.totalAmount, 0);
  const totalPending = payments.filter((p) => p.status === 'PENDING').reduce((sum, p) => sum + p.totalAmount, 0);

  return (
    <div className="flex bg-gray-100 min-h-screen">
      <Sidebar navItems={patientNav} />
      <div className="flex-1 flex flex-col">
        <Navbar title="Payments & Bills" />
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="card border-l-4 border-green-600">
              <h3 className="text-sm font-medium text-gray-600 mb-1">Total Paid</h3>
              <p className="text-3xl font-bold text-green-600">₹{totalPaid}</p>
            </div>
            <div className="card border-l-4 border-yellow-600">
              <h3 className="text-sm font-medium text-gray-600 mb-1">Pending</h3>
              <p className="text-3xl font-bold text-yellow-600">₹{totalPending}</p>
            </div>
            <div className="card border-l-4 border-blue-600">
              <h3 className="text-sm font-medium text-gray-600 mb-1">Total Transactions</h3>
              <p className="text-3xl font-bold text-blue-600">{payments.length}</p>
            </div>
          </div>

          {payments.length === 0 ? (
            <div className="card text-center py-12 bg-blue-50">
              <p className="text-gray-600">No payment records</p>
            </div>
          ) : (
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Payment History</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Date</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Doctor</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Consultation</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Additional</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Total</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Method</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => (
                      <tr key={payment._id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {new Date(payment.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">Dr. {payment.doctorId.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">₹{payment.consultationFee}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">₹{payment.additionalCharges}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900">₹{payment.totalAmount}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{payment.paymentMethod}</td>
                        <td className="px-4 py-3">
                          <span className={`badge ${
                            payment.status === 'PAID' ? 'badge-success' :
                            payment.status === 'PENDING' ? 'badge-warning' : 'badge-danger'
                          } text-xs`}>
                            {payment.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
