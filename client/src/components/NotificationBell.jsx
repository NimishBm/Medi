import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Bell, CheckCheck, X } from 'lucide-react';
import { notificationAPI } from '../services/api';
import { initSocket } from '../services/socket';

const TYPE_ICON = {
  NEW_APPOINTMENT:        '📅',
  APPOINTMENT_CANCELLED:  '❌',
  APPOINTMENT_RESCHEDULED:'🔄',
  CHECKED_IN:             '✅',
  QUEUE_UPDATE:           '🔔',
  CALLED:                 '📢',
  APPOINTMENT_COMPLETED:  '✔️',
  PRESCRIPTION_READY:     '💊',
};

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

export const NotificationBell = () => {
  const { user } = useSelector((s) => s.auth || {});
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread]               = useState(0);
  const [open, setOpen]                   = useState(false);
  const [loading, setLoading]             = useState(false);
  const panelRef                          = useRef(null);

  // ── fetch ──────────────────────────────────────────────────────────────────

  const fetchNotifications = async () => {
    try {
      const res = await notificationAPI.getNotifications();
      const list = res.data?.notifications || res.data || [];
      setNotifications(list);
      setUnread(res.data?.unreadCount ?? list.filter((n) => !n.read).length);
    } catch {
      // silently fail — bell is non-critical
    }
  };

  // ── socket: join personal room & listen ────────────────────────────────────

  useEffect(() => {
    if (!user?._id) return;

    fetchNotifications();

    try {
      const socket = initSocket();
      if (!socket) return;

      const joinRoom = () => {
        socket.emit('join-notifications', { userId: user._id });
      };

      // Join immediately if already connected, otherwise wait for the connect event.
      // Use a single socket.on('connect') listener — do NOT also add socket.once, which
      // would register a second handler on the same event and cause duplicate joins.
      if (socket.connected) {
        joinRoom();
      }
      socket.on('connect', joinRoom);

      const onNew = () => fetchNotifications();
      socket.on('new-notification', onNew);

      return () => {
        socket.off('connect', joinRoom);
        socket.off('new-notification', onNew);
      };
    } catch {
      // socket init failed or not supported in serverless
    }
  }, [user?._id]);

  // ── close on outside click ─────────────────────────────────────────────────

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // ── mark read ──────────────────────────────────────────────────────────────

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
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnread((prev) => Math.max(0, prev - 1));
    } catch {
      // silently fail
    }
  };

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-lg text-gray-600 hover:text-teal-600 hover:bg-teal-50 transition"
        title="Notifications"
      >
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute top-1 right-1 min-w-[17px] h-[17px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none animate-pulse">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl border border-gray-200 shadow-2xl z-[999] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-2">
              <Bell size={14} className="text-teal-600" />
              <span className="font-bold text-gray-800 text-sm">Notifications</span>
              {unread > 0 && (
                <span className="bg-red-100 text-red-600 text-xs font-bold px-1.5 py-0.5 rounded-full">
                  {unread} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unread > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  disabled={loading}
                  className="text-xs text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1 px-2 py-1 rounded hover:bg-teal-50 transition disabled:opacity-50"
                >
                  <CheckCheck size={12} /> Mark all read
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1 rounded hover:bg-gray-200 transition text-gray-400 hover:text-gray-600 ml-1"
              >
                <X size={13} />
              </button>
            </div>
          </div>

          {/* Notification list */}
          <div className="max-h-[420px] overflow-y-auto divide-y divide-gray-50">
            {notifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell size={32} className="mx-auto text-gray-200 mb-3" />
                <p className="text-sm font-medium text-gray-400">No notifications yet</p>
                <p className="text-xs text-gray-300 mt-1">New appointment alerts will appear here</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  onClick={() => !n.read && handleMarkRead(n._id)}
                  className={`flex gap-3 px-4 py-3.5 cursor-pointer transition hover:bg-gray-50 ${
                    !n.read ? 'bg-teal-50/70' : ''
                  }`}
                >
                  {/* Emoji icon */}
                  <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center text-base flex-shrink-0 mt-0.5">
                    {TYPE_ICON[n.type] || '🔔'}
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm leading-snug ${!n.read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                        {n.title}
                      </p>
                      {!n.read && (
                        <span className="w-2 h-2 rounded-full bg-teal-500 flex-shrink-0 mt-1.5" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed line-clamp-2">
                      {n.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">{fmtTime(n.createdAt)}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50 text-center">
              <p className="text-xs text-gray-400">
                Showing last {notifications.length} notifications
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default NotificationBell;
