import { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { paymentAPI } from '../../services/api';
import { logout } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';
import {
  Heart,
  LogOut,
  ArrowLeft,
  CreditCard,
  CheckCircle,
  Clock,
  RotateCcw,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  User,
  Calendar,
} from 'lucide-react';
import { NotificationBell } from '../../components/NotificationBell';
import { useDoctorNotifications } from '../../hooks/useDoctorNotifications';

const STATUS_BADGE = {
  PAID: { bg: 'bg-emerald-100 text-emerald-800 border-emerald-300', label: 'Paid' },
  PENDING: { bg: 'bg-amber-100 text-amber-800 border-amber-300', label: 'Pending' },
  REFUNDED: { bg: 'bg-rose-100 text-rose-800 border-rose-300', label: 'Refunded' },
};

const METHOD_BADGE = {
  CASH: 'bg-slate-100 text-slate-700',
  UPI: 'bg-blue-100 text-blue-700',
  CARD: 'bg-purple-100 text-purple-700',
};

export const DoctorPayments = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  useDoctorNotifications(user?._id);

  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [methodFilter, setMethodFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const doctorId = user?._id || user?.id;

  const fetchPayments = async () => {
    if (!doctorId) return;
    try {
      setIsLoading(true);
      const res = await paymentAPI.getPaymentsByDoctor(doctorId);
      setPayments(res.data || []);
    } catch (err) {
      console.error('Failed to load payment history:', err);
      toast.error('Failed to load payment history');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (doctorId) {
      fetchPayments();
    }
  }, [doctorId]);

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      // Status filter
      if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;

      // Method filter
      if (methodFilter !== 'ALL' && p.paymentMethod !== methodFilter) return false;

      // Search query (patient name, email, phone, token)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const patientName = p.patientId?.name?.toLowerCase() || '';
        const patientEmail = p.patientId?.email?.toLowerCase() || '';
        const patientPhone = p.patientId?.phone?.toLowerCase() || '';
        const tokenNum = p.appointmentId?.tokenNumber ? `#${p.appointmentId.tokenNumber}` : '';
        const aptType = p.appointmentId?.appointmentType?.toLowerCase() || '';

        const matches =
          patientName.includes(q) ||
          patientEmail.includes(q) ||
          patientPhone.includes(q) ||
          tokenNum.includes(q) ||
          aptType.includes(q);

        if (!matches) return false;
      }

      return true;
    });
  }, [payments, statusFilter, methodFilter, searchQuery]);

  // Aggregate stats
  const stats = useMemo(() => {
    const totalCollected = payments
      .filter((p) => p.status === 'PAID')
      .reduce((sum, p) => sum + (p.totalAmount || 0), 0);

    const totalRefunded = payments
      .filter((p) => p.status === 'REFUNDED')
      .reduce((sum, p) => sum + (p.totalAmount || 0), 0);

    const pendingCount = payments.filter((p) => p.status === 'PENDING').length;
    const paidCount = payments.filter((p) => p.status === 'PAID').length;
    const refundedCount = payments.filter((p) => p.status === 'REFUNDED').length;

    return {
      totalCollected,
      totalRefunded,
      pendingCount,
      paidCount,
      refundedCount,
      totalTransactions: payments.length,
    };
  }, [payments]);

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#1E3A5F] border-b border-[#2D4F7C] shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/doctor')}
              className="text-teal-300 hover:text-white p-2 rounded-lg hover:bg-white/10 transition"
              title="Back to Dashboard"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="w-10 h-10 bg-[#0D9488] rounded-lg flex items-center justify-center">
              <CreditCard className="text-white" size={22} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-white leading-tight">Patient Payment History</h1>
              <p className="text-xs text-teal-300 hidden sm:block">Doctor Practice Tools</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => navigate('/doctor')}
              className="text-slate-200 hover:text-teal-300 font-medium text-xs sm:text-sm px-3 py-1.5 rounded-lg hover:bg-white/10 transition hidden md:block"
            >
              Dashboard
            </button>
            <button
              onClick={() => navigate('/doctor/appointments')}
              className="text-slate-200 hover:text-teal-300 font-medium text-xs sm:text-sm px-3 py-1.5 rounded-lg hover:bg-white/10 transition hidden md:block"
            >
              Appointments
            </button>
            <button
              onClick={() => navigate('/doctor/queue')}
              className="text-slate-200 hover:text-teal-300 font-medium text-xs sm:text-sm px-3 py-1.5 rounded-lg hover:bg-white/10 transition hidden md:block"
            >
              Live Queue
            </button>
            <div className="hidden md:block h-6 border-l border-white/20"></div>
            <div className="hidden sm:flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full">
              <div className="w-6 h-6 bg-[#0D9488] rounded-full flex items-center justify-center text-white font-bold text-xs">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs sm:text-sm font-medium text-white">{user?.name?.split(' ')[0]}</span>
            </div>
            <NotificationBell />
            <button
              onClick={() => dispatch(logout())}
              className="text-slate-300 hover:text-red-400 font-medium text-xs sm:text-sm px-3 py-1.5 rounded-lg hover:bg-white/10 transition flex items-center gap-1"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Top Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-teal-200 p-5 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total Collected</span>
              <div className="w-9 h-9 bg-emerald-100 rounded-lg flex items-center justify-center">
                <DollarSign size={20} className="text-emerald-700" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-emerald-700">₹{stats.totalCollected.toLocaleString('en-IN')}</p>
            <p className="text-xs text-gray-500 mt-1">{stats.paidCount} successful payments</p>
          </div>

          <div className="bg-white rounded-xl border border-teal-200 p-5 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Refunded</span>
              <div className="w-9 h-9 bg-rose-100 rounded-lg flex items-center justify-center">
                <RotateCcw size={18} className="text-rose-600" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-rose-600">₹{stats.totalRefunded.toLocaleString('en-IN')}</p>
            <p className="text-xs text-gray-500 mt-1">{stats.refundedCount} transactions refunded</p>
          </div>

          <div className="bg-white rounded-xl border border-teal-200 p-5 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Pending</span>
              <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center">
                <Clock size={18} className="text-amber-600" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-amber-600">{stats.pendingCount}</p>
            <p className="text-xs text-gray-500 mt-1">Awaiting completion</p>
          </div>

          <div className="bg-white rounded-xl border border-teal-200 p-5 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total Transactions</span>
              <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp size={18} className="text-blue-600" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-gray-900">{stats.totalTransactions}</p>
            <p className="text-xs text-gray-500 mt-1">All time patient bills</p>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="bg-white rounded-xl border border-teal-200 p-4 shadow-sm flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by patient name, email, phone, token #..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Status Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-gray-600">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs font-semibold bg-gray-50 border border-gray-300 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="ALL">All Status</option>
                <option value="PAID">Paid</option>
                <option value="PENDING">Pending</option>
                <option value="REFUNDED">Refunded</option>
              </select>
            </div>

            {/* Method Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-gray-600">Method:</span>
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="text-xs font-semibold bg-gray-50 border border-gray-300 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="ALL">All Methods</option>
                <option value="CASH">Cash</option>
                <option value="UPI">UPI</option>
                <option value="CARD">Card</option>
              </select>
            </div>
          </div>
        </div>

        {/* Payments Table / List */}
        <div className="bg-white rounded-xl border border-teal-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard size={18} className="text-teal-600" />
              <h2 className="text-base font-bold text-gray-900">Payment Transactions</h2>
            </div>
            <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
              {filteredPayments.length} records
            </span>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-sm font-semibold text-gray-600">Loading payment history...</p>
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="text-center py-16 px-4">
              <CreditCard size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-base font-bold text-gray-700">No payment records found</p>
              <p className="text-xs text-gray-500 mt-1">
                {searchQuery || statusFilter !== 'ALL' || methodFilter !== 'ALL'
                  ? 'Try adjusting your filters or search terms'
                  : 'Patient consultation payments will appear here'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Patient</th>
                    <th className="px-5 py-3">Appointment / Token</th>
                    <th className="px-5 py-3">Consult Fee</th>
                    <th className="px-5 py-3">Extra</th>
                    <th className="px-5 py-3">Total Amount</th>
                    <th className="px-5 py-3">Method</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Notes / Refund</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {filteredPayments.map((p) => {
                    const statusInfo = STATUS_BADGE[p.status] || {
                      bg: 'bg-gray-100 text-gray-700',
                      label: p.status,
                    };
                    const dateFormatted = new Date(p.createdAt || p.paymentDate).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    });
                    const timeFormatted = new Date(p.createdAt || p.paymentDate).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <tr key={p._id} className="hover:bg-teal-50/40 transition">
                        {/* Date */}
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <p className="font-semibold text-gray-900">{dateFormatted}</p>
                          <p className="text-xs text-gray-400">{timeFormatted}</p>
                        </td>

                        {/* Patient */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-teal-100 rounded-full flex items-center justify-center text-teal-800 font-bold text-xs flex-shrink-0">
                              {p.patientId?.name?.charAt(0).toUpperCase() || 'P'}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{p.patientId?.name || 'Walk-in Patient'}</p>
                              <p className="text-xs text-gray-500">{p.patientId?.phone || p.patientId?.email || '—'}</p>
                            </div>
                          </div>
                        </td>

                        {/* Appointment / Token */}
                        <td className="px-5 py-3.5">
                          {p.appointmentId ? (
                            <div>
                              <div className="flex items-center gap-1.5">
                                {p.appointmentId.tokenNumber != null && (
                                  <span className="font-extrabold text-teal-700 text-xs bg-teal-50 border border-teal-200 px-1.5 py-0.5 rounded">
                                    Token #{p.appointmentId.tokenNumber}
                                  </span>
                                )}
                                <span className="text-xs text-gray-600 font-medium">
                                  {p.appointmentId.appointmentTime || ''}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {p.appointmentId.appointmentType || 'General Consultation'}
                              </p>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 italic">No appointment link</span>
                          )}
                        </td>

                        {/* Consultation Fee */}
                        <td className="px-5 py-3.5 font-medium text-gray-700">
                          ₹{p.consultationFee ?? 0}
                        </td>

                        {/* Extra Charges */}
                        <td className="px-5 py-3.5 text-gray-600">
                          ₹{p.additionalCharges ?? 0}
                        </td>

                        {/* Total Amount */}
                        <td className="px-5 py-3.5 font-bold text-gray-900">
                          ₹{p.totalAmount ?? 0}
                        </td>

                        {/* Payment Method */}
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${METHOD_BADGE[p.paymentMethod] || 'bg-gray-100 text-gray-700'}`}>
                            {p.paymentMethod}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span className={`inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-full border ${statusInfo.bg}`}>
                            {statusInfo.label}
                          </span>
                        </td>

                        {/* Notes / Refund info */}
                        <td className="px-5 py-3.5 max-w-[200px] text-xs text-gray-600 truncate">
                          {p.status === 'REFUNDED' ? (
                            <div>
                              <span className="text-rose-600 font-semibold">Refunded: </span>
                              <span>{p.refundReason || 'Appointment cancelled'}</span>
                              {p.refundDate && (
                                <p className="text-[11px] text-gray-400">
                                  {new Date(p.refundDate).toLocaleDateString('en-IN')}
                                </p>
                              )}
                            </div>
                          ) : (
                            p.notes || <span className="text-gray-400">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default DoctorPayments;
