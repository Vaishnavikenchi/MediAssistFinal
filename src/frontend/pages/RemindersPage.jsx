import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserReminders, deleteReminder as deleteReminderFS, updateReminder, addHistory, updateHistory, addReminder, deleteHistoryByMedicine } from '../../firebase/firestoreService';
import { Bell, Plus, Trash2, Clock, Loader, Calendar, Droplets, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RemindersPage() {
  const { currentUser } = useAuth();
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);

  const getTodayString = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  };

  const formatTime12h = (timeStr) => {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':');
    let hours = parseInt(h, 10);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours}:${m} ${ampm}`;
  };

  const [offlineMode, setOfflineMode] = useState(!navigator.onLine);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setOfflineMode(false);
      syncAndFetch(); // Sync data when coming back online
    };
    const handleOffline = () => setOfflineMode(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    
    // 1. First load from localStorage for instant display
    const localKey = `reminders_${currentUser.uid}`;
    const localData = localStorage.getItem(localKey);
    if (localData) {
      setReminders(JSON.parse(localData));
      setLoading(false);
    }

    // 2. Then sync with Firebase if online
    if (navigator.onLine) {
      syncAndFetch();
    } else {
      setLoading(false);
    }
  }, [currentUser]);

  // Sync logic to push local changes and fetch fresh data
  async function syncAndFetch() {
    if (!currentUser) return;
    try {
      const localKey = `reminders_${currentUser.uid}`;
      const localData = JSON.parse(localStorage.getItem(localKey) || '[]');
      
      // Push any offline-created reminders to Firebase
      const offlineReminders = localData.filter(r => r.offlineSync);
      for (const r of offlineReminders) {
        const { id, offlineSync, ...dataToSave } = r; // remove temp id and flag
        await addReminder(currentUser.uid, dataToSave);
      }
      
      // Fetch fresh data from Firebase
      const freshData = await getUserReminders(currentUser.uid);
      setReminders(freshData);
      
      // Update local storage with fresh data
      localStorage.setItem(localKey, JSON.stringify(freshData));
    } catch {
      toast.error('Failed to sync reminders with server');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!navigator.onLine && String(id).startsWith('temp_')) {
      // If it's a locally stored unsynced item, just remove it from localStorage
      const localKey = `reminders_${currentUser.uid}`;
      const localData = JSON.parse(localStorage.getItem(localKey) || '[]');
      const newData = localData.filter(r => r.id !== id);
      localStorage.setItem(localKey, JSON.stringify(newData));
      setReminders(newData);
      toast.success('Offline reminder deleted');
      return;
    } else if (!navigator.onLine) {
      return toast.error('Cannot delete synced reminders while offline.');
    }

    try {
      // Find the specific reminder data before deleting it
      const reminderToDelete = reminders.find((r) => r.id === id);
      
      await deleteReminderFS(id);
      
      // Delete associated history if reminder existed
      if (reminderToDelete && reminderToDelete.medicineName) {
        await deleteHistoryByMedicine(currentUser.uid, reminderToDelete.medicineName);
      }
      
      setReminders((prev) => prev.filter((r) => r.id !== id));
      toast.success('Reminder and its history deleted');
    } catch {
      toast.error('Failed to delete reminder');
    }
  }

  async function handleMarkTaken(reminder) {
    if (!navigator.onLine) {
      return toast.error('Please connect to the internet to mark as taken.');
    }

    const today = getTodayString();
    if (reminder.lastTakenDate === today) return; // Already taken today

    try {
      if (reminder.lastMissedDate === today && reminder.lastMissedHistoryId) {
        // 1. It was marked missed earlier today. Update the existing history record.
        await updateHistory(reminder.lastMissedHistoryId, {
          status: 'taken',
          takenAt: new Date() // approximate serverTimestamp since direct import missing, or just let firestore update it
        });
      } else {
        // 1. Log to new history
        await addHistory(currentUser.uid, {
          medicineName: reminder.medicineName,
          dosage: reminder.dosage || reminder.quantity || '1',
          status: 'taken'
        });
      }
      
      // 2. Update reminder record
      await updateReminder(reminder.id, {
        lastTakenDate: today,
        lastMissedDate: null,
        lastMissedHistoryId: null
      });

      // Update local state smoothly
      setReminders(prev => prev.map(r => r.id === reminder.id ? { ...r, lastTakenDate: today, lastMissedDate: null } : r));
      toast.success('Great job marking your medicine as taken!', { icon: '👏' });
    } catch (err) {
      console.error("Mark taken failed:", err);
      toast.error("Failed to update status.");
    }
  }

  const todayStr = getTodayString();

  return (
    <div className="space-y-8 animate-fade-in pb-10 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl shadow-lg shadow-emerald-500/20">
            <Bell className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">Reminders</h1>
            <p className="text-[var(--text-secondary)] text-sm mt-1 font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-500" />
              Manage your medication schedule
            </p>
            {offlineMode && (
              <span className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                Offline mode: data saved locally
              </span>
            )}
          </div>
        </div>
        
        <Link to="/reminders/add"
          className="btn-premium py-3 px-6 flex items-center justify-center gap-2 text-sm whitespace-nowrap group">
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" /> 
          <span>Add Reminder</span>
        </Link>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="relative">
            <div className="absolute inset-0 bg-brand/30 blur-xl rounded-full"></div>
            <Loader className="w-10 h-10 animate-spin text-brand relative z-10" />
          </div>
          <p className="text-[var(--text-secondary)] font-medium animate-pulse">Loading schedule...</p>
        </div>
      )}

      {!loading && reminders.length === 0 && (
        <div className="premium-glass rounded-3xl p-12 text-center flex flex-col items-center justify-center border-dashed border-2 border-[var(--glass-border)] hover:border-brand/30 transition-colors group">
          <div className="p-5 bg-[var(--bg-secondary)] rounded-full mb-5 ring-1 ring-[var(--border-color)] shadow-inner group-hover:scale-110 transition-transform duration-500">
            <Bell className="w-10 h-10 text-[var(--text-secondary)] opacity-40 group-hover:text-emerald-500/60 transition-colors" />
          </div>
          <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">No active reminders</h3>
          <p className="text-[var(--text-secondary)] font-medium max-w-sm mb-6">Stay on top of your health by setting up your first medication reminder.</p>
          <Link to="/reminders/add" className="text-brand font-bold flex items-center gap-1 hover:text-brand-dark transition-colors group/link p-2 bg-brand/5 rounded-lg px-4 hover:bg-brand/10">
            <Plus className="w-4 h-4 group-hover/link:rotate-90 transition-transform" /> Add your first reminder
          </Link>
        </div>
      )}

      {!loading && reminders.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
          {reminders.map((r, idx) => {
            const isTakenToday = r.lastTakenDate === todayStr;
            
            return (
              <div 
                key={r.id} 
                className={`premium-glass p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 group transition-colors relative overflow-hidden ${isTakenToday ? 'border-emerald-500/40 bg-emerald-500/5' : 'hover:border-emerald-500/30'}`}
                style={{ animationDelay: `${idx * 100}ms`, animation: 'fade-in 0.5s ease-out forwards' }}
              >
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b ${isTakenToday ? 'from-emerald-400 to-green-500' : 'from-emerald-400 to-teal-500'} rounded-l-2xl`}></div>
                
                <div className="flex items-start sm:items-center gap-4 pl-2 flex-1">
                  <div className={`p-3 rounded-xl transition-all duration-300 ring-1 flex-shrink-0 ${isTakenToday ? 'bg-emerald-500 shadow-lg shadow-emerald-500/20 ring-emerald-500/20' : 'bg-emerald-500/10 group-hover:bg-emerald-500 group-hover:shadow-lg group-hover:shadow-emerald-500/20 ring-emerald-500/20'}`}>
                    {isTakenToday ? (
                      <CheckCircle2 className="w-6 h-6 text-white" />
                    ) : (
                      <Droplets className="w-6 h-6 text-emerald-600 dark:text-emerald-400 group-hover:text-white transition-colors" />
                    )}
                  </div>
                  <div>
                    <h3 className={`font-bold text-lg mb-1 transition-colors flex items-center gap-2 ${isTakenToday ? 'text-emerald-600 dark:text-emerald-400' : 'text-[var(--text-primary)] group-hover:text-emerald-600 dark:group-hover:text-emerald-400'}`}>
                      {r.medicineName}
                      {isTakenToday && <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-full font-bold uppercase tracking-wider">Taken</span>}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-medium text-[var(--text-secondary)]">
                      <span className="flex items-center gap-1.5 text-brand dark:text-brand-light bg-brand/10 px-2 py-0.5 rounded-md">
                        <Clock className="w-3.5 h-3.5" />
                        {formatTime12h(r.time)}
                      </span>
                      <span className="flex items-center gap-1">
                         <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                         {r.frequency}
                      </span>
                      {r.dosage && (
                        <span className="flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                          {r.dosage}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pl-2 sm:pl-0 border-t border-[var(--border-color)] sm:border-t-0 pt-3 sm:pt-0 mt-2 sm:mt-0 flex-wrap sm:flex-nowrap">
                  
                  {!isTakenToday && (
                    <button 
                      onClick={() => handleMarkTaken(r)}
                      className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold rounded-lg transition-colors flex items-center gap-2 text-sm border border-emerald-500/20"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Mark Taken
                    </button>
                  )}
                  
                  {r.startDate && (
                    <div className="text-xs hidden md:block font-semibold text-[var(--text-secondary)] bg-[var(--bg-secondary)] px-3 py-1.5 rounded-lg border border-[var(--border-color)]">
                      {r.startDate} → {r.endDate || 'Ongoing'}
                    </div>
                  )}
                  
                  <button 
                    onClick={() => handleDelete(r.id)} 
                    className="p-2.5 text-red-400 hover:text-white hover:bg-red-500 rounded-xl transition-all shadow-sm ring-1 ring-red-400/20 hover:shadow-red-500/20 hover:shadow-lg focus:outline-none"
                    title="Delete Reminder"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
