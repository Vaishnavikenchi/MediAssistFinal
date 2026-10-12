import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { addReminder } from '../../firebase/firestoreService';
import { Bell, ArrowLeft, Loader, PlusCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const frequencies = ['Once daily', 'Twice daily', 'Three times daily', 'Every 4 hours', 'Weekly', 'As needed'];

const Field = ({ label, children, required }) => (
  <div className="relative group">
    <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2 ml-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
  </div>
);

export default function AddReminder() {
  const { currentUser } = useAuth();
  const [form, setForm] = useState({
    medicineName: '',
    dosage: '',
    frequency: frequencies[0],
    time: '08:00',
    startDate: '',
    endDate: '',
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  // Parse 24h into 12h parts for our custom UI
  const parsedTime = React.useMemo(() => {
    if (!form.time) return { h: '08', m: '00', ampm: 'AM' };
    const [hStr, mStr] = form.time.split(':');
    let h = parseInt(hStr, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    if (h === 0) h = 12;
    return { h: h.toString().padStart(2, '0'), m: mStr, ampm };
  }, [form.time]);

  // Convert custom UI selections back to 24h before saving to state
  const updateTime = (h, m, ampm) => {
    let h24 = parseInt(h, 10);
    if (ampm === 'PM' && h24 < 12) h24 += 12;
    if (ampm === 'AM' && h24 === 12) h24 = 0;
    setForm(prev => ({ ...prev, time: `${h24.toString().padStart(2, '0')}:${m}` }));
  };

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.medicineName.trim()) return toast.error('Please enter a medicine name');
    setLoading(true);
    try {
      if (navigator.onLine) {
        // Online: save directly to Firebase
        await addReminder(currentUser.uid, form);
        toast.success('Reminder saved successfully!', { icon: '✨' });
      } else {
        // Offline: save to localStorage with a flag
        const newReminder = { 
          ...form, 
          id: 'temp_' + Date.now().toString(), 
          offlineSync: true 
        };
        const localKey = `reminders_${currentUser.uid}`;
        const localData = JSON.parse(localStorage.getItem(localKey) || '[]');
        localData.push(newReminder);
        localStorage.setItem(localKey, JSON.stringify(localData));
        toast.success('Offline mode: data saved locally!', { icon: '💾' });
      }
      navigate('/reminders');
    } catch {
      toast.error('Failed to save reminder');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in pb-12">
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-brand transition-colors text-sm font-bold group bg-[var(--bg-secondary)] py-2 px-4 rounded-full hover:shadow-md border border-[var(--border-color)]"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> 
          Back
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="p-3 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl shadow-lg shadow-emerald-500/20">
          <PlusCircle className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">Add Reminder</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1 font-medium">Create a new medication schedule</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="premium-glass rounded-3xl p-6 md:p-8 space-y-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

        <div className="space-y-6 relative z-10">
          <Field label="Medicine Name" required>
            <input 
              type="text" 
              value={form.medicineName} 
              onChange={set('medicineName')} 
              required 
              placeholder="e.g. Paracetamol 500mg" 
              className="input-premium w-full" 
            />
          </Field>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field label="Dosage">
              <input 
                type="text" 
                value={form.dosage} 
                onChange={set('dosage')} 
                placeholder="e.g. 1 tablet" 
                className="input-premium w-full" 
              />
            </Field>
            
            <Field label="Frequency">
              <div className="relative">
                <select 
                  value={form.frequency} 
                  onChange={set('frequency')} 
                  className="input-premium w-full appearance-none pr-10 cursor-pointer bg-[var(--bg-primary)]"
                >
                  {frequencies.map(f => <option key={f} value={f} className="bg-[var(--bg-primary)]">{f}</option>)}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-[var(--text-secondary)]">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </Field>
          </div>
          
          <Field label="Time">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex items-center gap-2 flex-1">
                {/* Hour Dropdown */}
                <div className="relative flex-1">
                  <select 
                    value={parsedTime.h}
                    onChange={(e) => updateTime(e.target.value, parsedTime.m, parsedTime.ampm)}
                    className="input-premium w-full text-center appearance-none cursor-pointer bg-[var(--bg-primary)] px-2"
                  >
                    {Array.from({length: 12}, (_, i) => {
                      const val = (i + 1).toString().padStart(2, '0');
                      return <option key={val} value={val} className="bg-[var(--bg-primary)]">{val}</option>;
                    })}
                  </select>
                </div>
                
                <span className="text-xl font-bold text-[var(--text-secondary)] pb-1">:</span>
                
                {/* Minute Dropdown */}
                <div className="relative flex-1">
                  <select 
                    value={parsedTime.m}
                    onChange={(e) => updateTime(parsedTime.h, e.target.value, parsedTime.ampm)}
                    className="input-premium w-full text-center appearance-none cursor-pointer bg-[var(--bg-primary)] px-2"
                  >
                    {Array.from({length: 60}, (_, i) => {
                      const val = i.toString().padStart(2, '0');
                      return <option key={val} value={val} className="bg-[var(--bg-primary)]">{val}</option>;
                    })}
                  </select>
                </div>
              </div>

              {/* AM/PM Selector */}
              <div className="relative sm:w-1/3 mt-2 sm:mt-0">
                <select 
                  value={parsedTime.ampm}
                  onChange={(e) => updateTime(parsedTime.h, parsedTime.m, e.target.value)}
                  className="input-premium w-full text-center appearance-none cursor-pointer bg-brand/10 text-brand font-bold border border-brand/30"
                >
                  <option value="AM" className="bg-[var(--bg-primary)] text-[var(--text-primary)] font-normal">AM</option>
                  <option value="PM" className="bg-[var(--bg-primary)] text-[var(--text-primary)] font-normal">PM</option>
                </select>
              </div>
            </div>
            
            {/* Visual confirmation comment */}
            <p className="text-[10px] text-[var(--text-secondary)] mt-2 opacity-70 ml-1">
              Time is saved properly using 24-hour format ({form.time})
            </p>
          </Field>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[var(--border-color)]">
            <Field label="Start Date">
              <input 
                type="date" 
                value={form.startDate} 
                onChange={set('startDate')} 
                className="input-premium w-full cursor-text" 
              />
            </Field>
            <Field label="End Date (Optional)">
              <input 
                type="date" 
                value={form.endDate} 
                onChange={set('endDate')} 
                className="input-premium w-full cursor-text" 
              />
            </Field>
          </div>

          <div className="pt-6 mt-4">
            <button 
              type="submit" 
              disabled={loading}
              className="btn-premium w-full py-4 text-lg flex items-center justify-center gap-3 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              {loading ? <Loader className="w-6 h-6 animate-spin relative z-10" /> : <Bell className="w-6 h-6 relative z-10 group-hover:scale-110 transition-transform" />}
              <span className="relative z-10 font-bold">{loading ? 'Saving Schedule...' : 'Save Reminder Schedule'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
