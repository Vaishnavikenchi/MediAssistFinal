import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserProfile, updateUserProfile } from '../../firebase/firestoreService';
import { User, Mail, Calendar, Save, Loader, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [age, setAge] = useState('');

  useEffect(() => {
    if (!currentUser) return;
    getUserProfile(currentUser.uid)
      .then((data) => {
        setProfile(data);
        setAge(data?.age || '');
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [currentUser]);

  async function handleSave() {
    setSaving(true);
    try {
      await updateUserProfile(currentUser.uid, { age: age ? Number(age) : null });
      toast.success('Profile updated successfully!', { icon: '✨' });
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  }

  const createdAt = currentUser?.metadata?.creationTime
    ? new Date(currentUser.metadata.creationTime).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
    : 'N/A';

  return (
    <div className="space-y-8 animate-fade-in pb-10 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-gradient-to-br from-brand-light to-brand-dark rounded-2xl shadow-lg shadow-brand/20">
          <User className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">Profile</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1 font-medium flex items-center gap-2">
            <Shield className="w-4 h-4 text-accent" />
            Manage your account information
          </p>
        </div>
      </div>

      {/* Avatar */}
      <div className="premium-glass p-8 md:p-10 flex flex-col items-center rounded-3xl relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-64 h-64 bg-brand/10 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        
        <div className="relative">
          <div className="absolute inset-0 bg-brand/20 blur-xl rounded-full scale-150 group-hover:bg-brand/30 transition-colors duration-500"></div>
          <div className="w-24 h-24 bg-gradient-to-br from-brand to-brand-dark rounded-full flex items-center justify-center text-white text-4xl font-extrabold mb-5 relative z-10 shadow-xl shadow-brand/30 ring-4 ring-white/20 transform group-hover:scale-105 transition-transform duration-500">
            {currentUser?.displayName?.charAt(0).toUpperCase() || 'U'}
          </div>
        </div>
        
        <h2 className="text-2xl font-extrabold text-[var(--text-primary)] relative z-10">{currentUser?.displayName || 'User'}</h2>
        <p className="text-[var(--text-secondary)] mt-1 font-medium relative z-10">{currentUser?.email}</p>
        {currentUser?.email === 'baradmanik@gmail.com' && (
          <div className="mt-4 px-4 py-1.5 bg-gradient-to-r from-accent to-accent-dark text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-lg shadow-accent/20 relative z-10 flex items-center gap-1.5 cursor-default hover:scale-105 transition-transform">
            <Shield className="w-3.5 h-3.5" />
            Admin Privileges
          </div>
        )}
      </div>

      {/* Info Cards */}
      <div className="space-y-4">
        {[
          { icon: User, label: 'Display Name', value: currentUser?.displayName || 'Not set', color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { icon: Mail, label: 'Email Address', value: currentUser?.email, color: 'text-brand', bg: 'bg-brand/10' },
          { icon: Calendar, label: 'Member Since', value: createdAt, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
        ].map(({ icon: Icon, label, value, color, bg }, index) => (
          <div 
            key={label} 
            className="premium-glass p-5 rounded-2xl flex items-center gap-5 hover:-translate-y-0.5 transition-transform duration-300"
            style={{ animationDelay: `${index * 100}ms`, animation: 'fade-in 0.5s ease-out forwards' }}
          >
            <div className={`p-3 rounded-xl ${bg} ring-1 ring-[var(--glass-border)] shadow-inner flex-shrink-0`}>
              <Icon className={`w-6 h-6 ${color}`} />
            </div>
            <div>
              <p className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-0.5">{label}</p>
              <p className="text-[var(--text-primary)] font-semibold text-lg">{value}</p>
            </div>
          </div>
        ))}

        {/* Editable age */}
        <div className="premium-glass p-6 md:p-8 rounded-3xl relative overflow-hidden" style={{ animationDelay: '300ms', animation: 'fade-in 0.5s ease-out forwards' }}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
          
          <label className="block text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-3">Update Age</label>
          <div className="flex flex-col sm:flex-row gap-4 relative z-10">
            <div className="relative flex-1 group">
              <input
                type="number" 
                value={age} 
                onChange={e => setAge(e.target.value)} 
                min={1} 
                max={120}
                placeholder="Enter your age"
                className="input-premium py-3 w-full"
              />
            </div>
            <button 
              onClick={handleSave} 
              disabled={saving}
              className="btn-premium py-3 px-8 flex flex-1 sm:flex-none items-center justify-center gap-2 text-sm font-bold hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {saving ? <Loader className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              <span>Save Changes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
