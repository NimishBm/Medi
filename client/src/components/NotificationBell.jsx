import { useState, useEffect, useRef } from 'react';
import { Bell, X, CalendarX, CalendarClock, CheckCheck } from 'lucide-react';
import { notificationAPI } from '../services/api';
import { getSocket } from '../services/socket';
import toast from 'react-hot-toast';

const T = '#0D9488';

const TYPE_ICON = {
  APPOINTMENT_CANCELLED:   <CalendarX  size={16} color="#EF4444" />,
  APPOINTMENT_RESCHEDULED: <CalendarClock size={16} color="#F59E0B" />,
};

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60)   return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export const NotificationBell = ({ userId }) => {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const unread = notifications.filter(n => !n.read).length;

  useEffect(() => {
    notificationAPI.getAll()
      .then(r => setNotifications(r.data))
      .catch(() => {});
  }, []);

  // Join user room + listen for real-time notifications
  useEffect(() => {
    if (!userId) return;
    const socket = getSocket();
    socket.emit('join-notifications', { userId });
    const handler = (notification) => {
      setNotifications(prev => [notification, ...prev]);
      toast(notification.title, {
        icon: notification.type === 'APPOINTMENT_CANCELLED' ? '❌' : '📅',
        duration: 5000,
      });
    };
    socket.on('notification', handler);
    return () => socket.off('notification', handler);
  }, [userId]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markAllRead = async () => {
    try {
      await notificationAPI.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch {}
  };

  const markOneRead = async (id) => {
    try {
      await notificationAPI.markRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    } catch {}
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', padding: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}
      >
        <Bell size={20} color="#374151" strokeWidth={2} />
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: 0, right: 0,
            background: '#EF4444', color: '#fff',
            fontSize: 10, fontWeight: 800, lineHeight: 1,
            minWidth: 16, height: 16, borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 3px',
          }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0,
          width: 340, maxHeight: 440, overflowY: 'auto',
          background: '#fff', borderRadius: 16,
          boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
          border: '1.5px solid #E5E7EB',
          zIndex: 200,
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px 10px', borderBottom: '1px solid #F3F4F6' }}>
            <span style={{ fontWeight: 800, fontSize: 14, color: '#111827' }}>
              Notifications {unread > 0 && <span style={{ color: T }}>({unread})</span>}
            </span>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {unread > 0 && (
                <button onClick={markAllRead}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: T, fontWeight: 600 }}>
                  <CheckCheck size={13} /> Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', display: 'flex' }}>
                <X size={16} />
              </button>
            </div>
          </div>

          {/* List */}
          {notifications.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>
              <Bell size={28} color="#D1D5DB" style={{ marginBottom: 8 }} />
              <p style={{ margin: 0 }}>No notifications yet</p>
            </div>
          ) : (
            notifications.map(n => (
              <div
                key={n._id}
                onClick={() => !n.read && markOneRead(n._id)}
                style={{
                  display: 'flex', gap: 12, padding: '12px 16px',
                  background: n.read ? '#fff' : '#F0FDF4',
                  borderBottom: '1px solid #F9FAFB',
                  cursor: n.read ? 'default' : 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => { if (!n.read) e.currentTarget.style.background = '#ECFDF5'; }}
                onMouseLeave={e => { if (!n.read) e.currentTarget.style.background = '#F0FDF4'; }}
              >
                <div style={{ flexShrink: 0, marginTop: 2 }}>{TYPE_ICON[n.type]}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontWeight: n.read ? 500 : 700, fontSize: 13, color: '#111827' }}>{n.title}</p>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: '#6B7280', lineHeight: 1.4 }}>{n.message}</p>
                  <p style={{ margin: '4px 0 0', fontSize: 11, color: '#9CA3AF' }}>{timeAgo(n.createdAt)}</p>
                </div>
                {!n.read && (
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: T, flexShrink: 0, marginTop: 5 }} />
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
