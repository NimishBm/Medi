import { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Bell, CheckCheck, X, Calendar, XCircle, RefreshCw, CheckCircle, Pill, BellRing } from 'lucide-react';
import { notificationAPI } from '../services/api';
import { initSocket } from '../services/socket';
import { requestBrowserPermission } from '../hooks/useDoctorNotifications';

// ── notification type → icon/colour config ───────────────────────────────────
// Add new types here without touching any other code.

const TYPE_CONFIG = {
  NEW_APPOINTMENT:         { Icon: Calendar,    color: 'text-teal-600',   bg: 'bg-teal-50'    },
  APPOINTMENT_CANCELLED:   { Icon: XCircle,     color: 'text-red-500',    bg: 'bg-red-50'     },
  APPOINTMENT_RESCHEDULED: { Icon: RefreshCw,   color: 'text-amber-500',  bg: 'bg-amber-50'   },
  CHECKED_IN:              { Icon: CheckCircle, color: 'text-green-600',  bg: 'bg-green-50'   },
  QUEUE_UPDATE:            { Icon: Bell,        color: 'text-blue-500',   bg: 'bg-blue-50'    },
  CALLED:                  { Icon: Bell,        color: 'text-purple-500', bg: 'bg-purple-50'  },
  APPOINTMENT_COMPLETED:   { Icon: CheckCircle, color: 'text-emerald-600',bg: 'bg-emerald-50' },
  PRESCRIPTION_READY:      { Icon: Pill,        color: 'text-pink-500',   bg: 'bg-pink-50'    },
};
const FALLBACK_CONFIG = { Icon: Bell, color: 'text-gray-500', bg: 'bg-gray-100' };

// ── helpers ───────────────────────────────────────────────────────────────────

const fmtTime = (iso) => {
  const d = new Date(iso);
  const diffMin = Math.floor((Date.now() - d) / 60000);
  if (diffMin < 1)  return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24)  return `${diffHr}h ago`;
  if (diffHr < 48)  return 'yesterday';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

// ── component ─────────────────────────────────────────────────────────────────

export const NotificationBell = () => {
  const { user } = useSelector((s) => s.auth || {});
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread]               = useState(0);
  const [open, setOpen]                   = useState(false);
  const [loading, setLoading]             = useState(false);
  // Track browser permission so the "Enable" button disappears once granted
  const [browserPermission, setBrowserPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  );
  const panelRef = useRef(null);

  const isDoctor = user?.role === 'DOCTOR';

  const handleEnableBrowserNotifications = async () => {
    const result = await requestBrowserPermission();
    setBrowserPermission(result);
  };

  // ── fetch from API ─────────────────────────────────────────────────────────

  const fetchNotifications = useCallback(async () => {
    if (!user?._id) return;
    try {
      const res = await notificationAPI.getNotifications();
      const list = res.data?.notifications || res.data || [];
      setNotifications(list);
      setUnread(res.data?.unreadCount ?? list.filter((n) => !n.read).length);
    } catch {
      // non-critical — fail silently
    }
  }, [user?._id]);

  // ── socket + poll setup ────────────────────────────────────────────────────
  // Only doctor pages need this — for patients NotificationBell is not rendered.

  useEffect(() => {
    if (!user?._id || !isDoctor) return;

    // Initial fetch
    fetchNotifications();

    // Fallback: re-fetch every 30 s in case socket misses an event
    const pollId = setInterval(fetchNotifications, 30_000);

    // Socket wiring
    const socket = initSocket();

    const joinDoctorRoom = () => {
      socket.emit('join-doctor-notifications', { doctorId: user._id });
    };

    // Join immediately if already connected; re-join on every reconnect
    if (socket.connected) {
      joinDoctorRoom();
    }
    socket.on('connect', joinDoctorRoom);

    // Both event names the server can emit
    socket.on('new-notification', fetchNotifications);
    socket.on('new-appointment',  fetchNotifications);

    return () => {
      clearInterval(pollId);
      socket.off('connect',          joinDoctorRoom);
      socket.off('new-notification', fetchNotifications);
      socket.off('new-appointment',  fetchNotifications);
    };
  }, [user?._id, isDoctor, fetchNotifications]);

  // ── close panel on outside click ──────────────────────────────────────────

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // ── auto mark-all-read when panel opens ───────────────────────────────────

  useEffect(() => {
    if (!open || unread === 0) return;
    // Fire-and-forget — optimistic update first, API call in background
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnread(0);
    notificationAPI.markAllRead().catch(() => {});
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── mark read / delete helpers ────────────────────────────────────────────

  const handleMarkAllRead = async () => {
    setLoading(true);
    try {
      await notificationAPI.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnread(0);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await notificationAPI.markRead(id);
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
      setUnread((c) => Math.max(0, c - 1));
    } catch { /* silent */ }
  };

  const handleDeleteOne = async (e, id) => {
    e.stopPropagation(); // don't also trigger mark-read on the row
    // Optimistic removal
    setNotifications((prev) => {
      const removed = prev.find((n) => n._id === id);
      if (removed && !removed.read) setUnread((c) => Math.max(0, c - 1));
      return prev.filter((n) => n._id !== id);
    });
    notificationAPI.deleteOne(id).catch(() => {});
  };

  const handleClearAll = async () => {
    setLoading(true);
    try {
      await notificationAPI.clearAll();
      setNotifications([]);
      setUnread(0);
    } finally {
      setLoading(false);
    }
  };

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="relative" ref={panelRef}>

      {/* Bell button */}
      <button
        type="button"
        onClick={() => { setOpen((o) => !o); if (!open) fetchNotifications(); }}
        className="relative p-2 rounded-lg text-slate-300 hover:text-teal-300 hover:bg-white/10 transition"
        title="Notifications"
      >
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute top-1 right-1 min-w-[17px] h-[17px] bg-red-500 text-white
                           text-[10px] font-bold rounded-full flex items-center justify-center
                           px-0.5 leading-none animate-pulse">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl border border-gray-200 shadow-2xl z-[999] overflow-hidden">

          {/* Header — doctor theme */}
          <div className="bg-[#1E3A5F] border-b border-[#2D4F7C]">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <Bell size={14} className="text-teal-300" />
                <span className="font-bold text-white text-sm">Notifications</span>
                {unread > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                    {unread} new
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1 rounded hover:bg-white/10 transition text-teal-300 hover:text-white"
              >
                <X size={13} />
              </button>
            </div>

            {/* Enable browser notifications prompt — only when not yet asked */}
            {isDoctor && browserPermission === 'default' && (
              <button
                type="button"
                onClick={handleEnableBrowserNotifications}
                className="w-full flex items-center gap-2 px-4 py-2 bg-teal-700/50 hover:bg-teal-600/60 transition text-xs text-teal-100 border-t border-teal-600/30"
              >
                <BellRing size={12} className="flex-shrink-0" />
                <span>Enable browser notifications for new appointments</span>
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[420px] overflow-y-auto divide-y divide-gray-50">
            {notifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell size={32} className="mx-auto text-gray-200 mb-3" />
                <p className="text-sm font-medium text-gray-400">No notifications yet</p>
                <p className="text-xs text-gray-300 mt-1">Appointment alerts will appear here</p>
              </div>
            ) : (
              notifications.map((n) => {
                const cfg = TYPE_CONFIG[n.type] || FALLBACK_CONFIG;
                return (
                  <div
                    key={n._id}
                    onClick={() => !n.read && handleMarkRead(n._id)}
                    className={`group flex gap-3 px-4 py-3.5 cursor-pointer hover:bg-gray-50 transition ${
                      !n.read ? 'bg-teal-50/60' : ''
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-full ${cfg.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                      <cfg.Icon size={16} className={cfg.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm leading-snug ${!n.read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                          {n.title}
                        </p>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {!n.read && <span className="w-2 h-2 rounded-full bg-teal-500 mt-1.5" />}
                          <button
                            type="button"
                            onClick={(e) => handleDeleteOne(e, n._id)}
                            title="Dismiss"
                            className="opacity-0 group-hover:opacity-100 transition p-0.5 rounded hover:bg-red-100 text-gray-400 hover:text-red-500 mt-0.5"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed line-clamp-2">{n.message}</p>
                      <p className="text-xs text-gray-400 mt-1">{fmtTime(n.createdAt)}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-2">
              <p className="text-xs text-gray-400">{notifications.length} notification{notifications.length !== 1 ? 's' : ''}</p>
              <div className="flex items-center gap-2">
                {unread > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    disabled={loading}
                    className="text-xs text-teal-600 hover:text-teal-800 font-medium flex items-center gap-1 disabled:opacity-50"
                  >
                    <CheckCheck size={11} /> Mark all read
                  </button>
                )}
                {unread > 0 && <span className="text-gray-300 text-xs">|</span>}
                <button
                  type="button"
                  onClick={handleClearAll}
                  disabled={loading}
                  className="text-xs text-red-400 hover:text-red-600 font-medium flex items-center gap-1 disabled:opacity-50"
                >
                  <X size={11} /> Clear all
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
