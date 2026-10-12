import React, { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserReminders, updateReminder, addHistory, sendEmailNotification } from '../../firebase/firestoreService';
import { useLanguage } from '../context/LanguageContext';
import toast from 'react-hot-toast';

export default function NotificationManager() {
  const { currentUser } = useAuth();
  const { language, currentLang } = useLanguage();
  const notifiedSet = useRef(new Set());

  const parseTime = (timeStr) => {
    if (!timeStr) return null;
    const [hours, mins] = timeStr.split(':');
    const d = new Date();
    d.setHours(parseInt(hours, 10), parseInt(mins, 10), 0, 0);
    return d;
  };

  const getTodayString = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  };

  function speakReminder(reminder, lang) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const name = reminder.medicineName || '';
    const dosage = reminder.dosage ? ` — ${reminder.dosage}` : '';

    let script = '';
    if (lang === 'hi') {
      script = `दवाई लेने का समय हो गया है। ${name}${dosage} लें।`;
    } else if (lang === 'mr') {
      script = `औषध घेण्याची वेळ झाली आहे। ${name}${dosage} घ्या.`;
    } else {
      script = `Medication reminder. It's time to take your medicine: ${name}${dosage}. Please take it now.`;
    }

    const utterance = new SpeechSynthesisUtterance(script);
    utterance.lang = currentLang?.bcp47 || 'en-US';
    utterance.rate = 0.9;
    utterance.volume = 1;

    // Pick best matching voice
    const voices = window.speechSynthesis.getVoices();
    const langCode = (currentLang?.bcp47 || 'en').split('-')[0];
    const match = voices.find(v => v.lang.startsWith(langCode));
    if (match) utterance.voice = match;

    window.speechSynthesis.speak(utterance);
  }

  useEffect(() => {
    if (!currentUser) return;

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const checkReminders = async () => {
      try {
        const reminders = await getUserReminders(currentUser.uid);
        const now = new Date();
        const todayStr = getTodayString();

        reminders.forEach(async r => {
          if (r.lastTakenDate === todayStr) return;

          const reminderTime = parseTime(r.time);
          if (!reminderTime) return;

          const diffMs = now.getTime() - reminderTime.getTime();
          const diffMinutes = Math.floor(diffMs / 60000);

          if (diffMinutes >= 0 && diffMinutes <= 10 && !notifiedSet.current.has(r.id + todayStr)) {
            notifiedSet.current.add(r.id + todayStr);

            // ── System notification ──
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('💊 MediAssist Reminder', {
                body: `Time to take: ${r.medicineName}${r.dosage ? ` (${r.dosage})` : ''}`,
                icon: '/vite.svg',
              });
            }

            // ── Voice Announcement (language-aware) ──
            speakReminder(r, language);

            // ── Email ──
            if (currentUser?.email) {
              sendEmailNotification(currentUser.email, r);
            }

            // ── In-app toast ──
            toast(`💊 Time to take: ${r.medicineName}${r.dosage ? ` (${r.dosage})` : ''}`, {
              icon: '🔔',
              duration: 10000,
              style: {
                borderRadius: '16px',
                background: '#10b981',
                color: '#fff',
                fontWeight: 'bold',
                fontSize: '16px',
              },
            });

          } else if (diffMinutes > 15 && r.lastMissedDate !== todayStr) {
            try {
              const docRef = await addHistory(currentUser.uid, {
                medicineName: r.medicineName,
                dosage: r.dosage || '1',
                status: 'missed',
              });
              await updateReminder(r.id, {
                lastMissedDate: todayStr,
                lastMissedHistoryId: docRef.id,
              });
              toast.error(`Missed dose logged: ${r.medicineName}`, { icon: '⚠️', duration: 6000 });
            } catch (e) {
              console.error('Failed to log missed dose', e);
            }
          }
        });
      } catch (e) {
        console.error('Reminder check failed:', e);
      }
    };

    checkReminders();
    const interval = setInterval(checkReminders, 10000);
    return () => clearInterval(interval);
  }, [currentUser, language]);

  return null;
}
