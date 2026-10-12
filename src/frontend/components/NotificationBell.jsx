import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Download, Pill } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { subscribeToNotifications, markNotificationRead } from '../../firebase/firestoreService';
import BarcodeDisplay from './BarcodeDisplay';
import toast from 'react-hot-toast';

export default function NotificationBell() {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState(null);
  const panelRef = useRef(null);

  useEffect(() => {
    if (!currentUser) return;
    const unsub = subscribeToNotifications((notifs) => {
      setNotifications(notifs);
      // Show toast for new unread notifications
      const unread = notifs.filter(n => !(n.readBy || []).includes(currentUser.uid));
      if (unread.length > 0 && unread[0]?.type === 'new_medicine') {
        // Only toast for newest one if it just arrived
      }
    });
    return () => unsub();
  }, [currentUser]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
        setSelectedNotif(null);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const unreadCount = notifications.filter(
    n => !(n.readBy || []).includes(currentUser?.uid || '')
  ).length;

  async function handleOpen(notif) {
    setSelectedNotif(notif);
    if (currentUser && !(notif.readBy || []).includes(currentUser.uid)) {
      await markNotificationRead(notif.id, currentUser.uid);
    }
  }

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <button
        onClick={() => { setOpen(o => !o); setSelectedNotif(null); }}
        className="relative p-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:bg-brand/10 hover:border-brand/30 transition-all duration-300 group"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-[var(--text-secondary)] group-hover:text-brand transition-colors" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-lg animate-bounce">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div className="absolute left-0 top-full mt-3 w-80 md:w-96 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl shadow-2xl z-50 overflow-hidden animate-fade-in">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]">
            <h3 className="font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Bell className="w-4 h-4 text-brand" />
              Notifications
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-red-500/10 text-red-500 text-xs font-bold rounded-full">{unreadCount} new</span>
              )}
            </h3>
            <button onClick={() => { setOpen(false); setSelectedNotif(null); }} className="p-1 rounded-lg hover:bg-[var(--border-color)] transition-colors">
              <X className="w-4 h-4 text-[var(--text-secondary)]" />
            </button>
          </div>

          {/* Barcode detail view */}
          {selectedNotif ? (
            <div className="p-5 space-y-4">
              <button
                onClick={() => setSelectedNotif(null)}
                className="text-sm text-brand font-semibold hover:underline flex items-center gap-1"
              >
                ← Back to list
              </button>
              <div className="text-center">
                <p className="font-bold text-lg text-[var(--text-primary)] mb-1">{selectedNotif.medicineName}</p>
                <p className="text-sm text-[var(--text-secondary)] mb-4">Barcode: <span className="font-mono text-brand">{selectedNotif.barcode}</span></p>
              </div>
              {selectedNotif.barcode && (
                <BarcodeDisplay
                  value={selectedNotif.barcode}
                  medicineName={selectedNotif.medicineName}
                  onReady={(downloadFn) => {
                    // expose download button
                    selectedNotif._downloadFn = downloadFn;
                  }}
                />
              )}
              <button
                onClick={() => {
                  if (selectedNotif._downloadFn) selectedNotif._downloadFn();
                  else toast('Download ready after barcode loads', { icon: '⏳' });
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-brand to-brand-dark text-white font-bold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-brand/20"
              >
                <Download className="w-5 h-5" />
                Download Barcode
              </button>
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Bell className="w-8 h-8 text-[var(--text-secondary)] opacity-30" />
                  <p className="text-[var(--text-secondary)] text-sm font-medium">No notifications yet</p>
                </div>
              ) : (
                notifications.map(notif => {
                  const isRead = (notif.readBy || []).includes(currentUser?.uid || '');
                  return (
                    <button
                      key={notif.id}
                      onClick={() => handleOpen(notif)}
                      className={`w-full flex items-start gap-3 px-5 py-4 border-b border-[var(--border-color)] last:border-0 hover:bg-[var(--bg-secondary)] transition-colors text-left ${!isRead ? 'bg-brand/5' : ''}`}
                    >
                      <div className={`p-2 rounded-xl flex-shrink-0 mt-0.5 ${!isRead ? 'bg-brand text-white' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'}`}>
                        <Pill className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold truncate ${!isRead ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
                          {notif.medicineName || 'New Medicine'}
                        </p>
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5 line-clamp-2">{notif.message}</p>
                        <p className="text-xs text-brand mt-1 font-semibold">Tap to download barcode →</p>
                      </div>
                      {!isRead && <div className="w-2 h-2 rounded-full bg-brand flex-shrink-0 mt-1.5" />}
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
