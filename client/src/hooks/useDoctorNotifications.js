/**
 * useDoctorNotifications
 *
 * Call once at the top of any doctor page component.
 *
 * What it does:
 *  1. Joins the doctor's Socket.IO rooms (doctor-${id}, notifications-${id}, queue-${id})
 *  2. Shows an in-app react-hot-toast when a patient books an appointment
 *  3. Shows a browser (OS-level) notification when the tab is hidden or the
 *     permission has been granted — using the Web Notifications API.
 *     Falls back silently to the bell badge if permission is denied or unsupported.
 *
 * Browser permission is NOT requested automatically on mount (browsers block
 * auto-prompts). The NotificationBell renders an "Enable notifications" button
 * when Notification.permission === 'default'; clicking it calls
 * requestBrowserPermission() exported from this module.
 *
 * Usage:
 *   import { useDoctorNotifications } from '../../hooks/useDoctorNotifications';
 *   useDoctorNotifications(user._id);
 */
import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { initSocket, joinRooms } from '../services/socket';

// ── browser notification helpers ─────────────────────────────────────────────

/** Returns true if the Web Notifications API is available in this browser. */
const browserNotificationsSupported = () =>
  typeof window !== 'undefined' && 'Notification' in window;

/**
 * Ask the browser for notification permission.
 * Safe to call from a user-gesture handler (button click).
 * Returns the resulting permission string: 'granted' | 'denied' | 'default'
 */
export const requestBrowserPermission = async () => {
  if (!browserNotificationsSupported()) return 'denied';
  if (Notification.permission === 'granted') return 'granted';
  const result = await Notification.requestPermission();
  return result;
};

/**
 * Fire a browser notification using real data from the socket payload.
 * Only fires when permission is 'granted'.
 * Clicking the notification focuses the tab.
 *
 * @param {object} data  – the raw socket `new-appointment` payload
 */
const showBrowserNotification = (data) => {
  if (!browserNotificationsSupported()) return;
  if (Notification.permission !== 'granted') return;

  const patientName  = data?.patientName  || 'A patient';
  const time         = data?.time         || '';
  const date         = data?.date         ? new Date(data.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) : '';
  const tokenNo      = data?.tokenNumber  != null ? `Token #${data.tokenNumber}` : '';
  const apptType     = data?.bookedFor?.isFamilyMember
    ? `for ${data.bookedFor.name} (${data.bookedFor.relationship || 'family'})`
    : '';

  const titleLine = `📅 New Appointment — ${patientName}`;
  const bodyParts = [
    time  ? `Time: ${time}`  : null,
    date  ? `Date: ${date}`  : null,
    tokenNo                  ? tokenNo : null,
    apptType                 ? apptType : null,
  ].filter(Boolean);

  const notification = new Notification(titleLine, {
    body:    bodyParts.join('\n') || 'View appointment details in ClinicFlow',
    icon:    '/favicon.ico',      // uses the project's existing favicon
    tag:     `appt-${data?.appointmentId || Date.now()}`, // deduplication key
    requireInteraction: false,
  });

  // Clicking the browser notification focuses the ClinicFlow tab
  notification.onclick = () => {
    window.focus();
    notification.close();
  };
};

// ── hook ─────────────────────────────────────────────────────────────────────

export const useDoctorNotifications = (doctorId) => {
  useEffect(() => {
    if (!doctorId) return;

    const socket = initSocket();

    const doJoin = () => joinRooms('doctor', doctorId);

    // Join rooms immediately if already connected; re-join on every reconnect
    if (socket.connected) doJoin();
    socket.on('connect', doJoin);

    // Fires whenever a patient books an appointment with this doctor
    const onNewAppointment = (data) => {
      const patientName = data?.patientName || 'A patient';
      const time        = data?.time        || '';
      const tokenNo     = data?.tokenNumber != null ? ` · Token #${data.tokenNumber}` : '';

      // 1. Always show in-app toast (works even when permission is denied)
      toast.success(`📅 New appointment\n${patientName}${time ? ' at ' + time : ''}${tokenNo}`, {
        duration: 7000,
        style: { maxWidth: '340px', whiteSpace: 'pre-line' },
      });

      // 2. Also fire a browser (OS-level) notification with full appointment data
      //    — only if permission has been granted by the user
      showBrowserNotification(data);
    };

    socket.on('new-appointment', onNewAppointment);

    return () => {
      socket.off('connect',         doJoin);
      socket.off('new-appointment', onNewAppointment);
    };
  }, [doctorId]);
};
