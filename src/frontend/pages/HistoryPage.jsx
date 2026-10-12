import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserHistory, getUserSearchHistory, getUserScanHistory } from '../../firebase/firestoreService';
import { Clock, Pill, Loader, CheckCircle, XCircle, Activity, Search, Scan, Database } from 'lucide-react';

export default function HistoryPage() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('medications'); // 'medications' | 'searches' | 'scans'
  const [history, setHistory] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);
  const [scanHistory, setScanHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    
    setLoading(true);
    Promise.all([
      getUserHistory(currentUser.uid),
      getUserSearchHistory(currentUser.uid),
      getUserScanHistory(currentUser.uid)
    ])
    .then(([meds, searches, scans]) => {
      setHistory(meds);
      setSearchHistory(searches);
      setScanHistory(scans);
    })
    .catch(console.error)
    .finally(() => setLoading(false));
  }, [currentUser]);

  const taken = history.filter(h => h.status === 'taken').length;
  const missed = history.filter(h => h.status === 'missed').length;

  return (
    <div className="space-y-8 animate-fade-in pb-10 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-gradient-to-br from-orange-400 to-amber-500 rounded-2xl shadow-lg shadow-orange-500/20">
          <Clock className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">Activity History</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1 font-medium flex items-center gap-2">
            <Activity className="w-4 h-4 text-orange-500" />
            Track your medications, searches, and scans
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-[var(--bg-secondary)] p-1.5 rounded-2xl mb-8 border border-[var(--border-color)]">
        <button onClick={() => setActiveTab('medications')} className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'medications' ? 'bg-gradient-to-r from-orange-400 to-amber-500 text-white shadow-md' : 'text-[var(--text-secondary)] hover:bg-[var(--glass-bg)] hover:text-orange-500'}`}>
          <Pill className="w-4 h-4" /> Medications
        </button>
        <button onClick={() => setActiveTab('searches')} className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'searches' ? 'bg-gradient-to-r from-brand to-brand-dark text-white shadow-md' : 'text-[var(--text-secondary)] hover:bg-[var(--glass-bg)] hover:text-brand'}`}>
          <Search className="w-4 h-4" /> Searches
        </button>
        <button onClick={() => setActiveTab('scans')} className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'scans' ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-white shadow-md' : 'text-[var(--text-secondary)] hover:bg-[var(--glass-bg)] hover:text-emerald-500'}`}>
          <Scan className="w-4 h-4" /> Scans
        </button>
      </div>

      {/* Stats for Medications only */}
      {activeTab === 'medications' && history.length > 0 && (
        <div className="grid grid-cols-2 gap-4 md:gap-6 animate-fade-in">
          <div className="premium-glass p-5 md:p-6 rounded-3xl flex items-center gap-5 relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="p-4 bg-emerald-500/10 rounded-2xl group-hover:bg-emerald-500 group-hover:shadow-lg group-hover:shadow-emerald-500/20 transition-all duration-300 ring-1 ring-emerald-500/20 z-10">
              <CheckCircle className="w-8 h-8 text-emerald-500 group-hover:text-white transition-colors" />
            </div>
            <div className="z-10">
              <p className="text-3xl font-extrabold text-[var(--text-primary)]">{taken}</p>
              <p className="text-sm text-[var(--text-secondary)] font-bold uppercase tracking-wider mt-1">Doses Taken</p>
            </div>
          </div>
          <div className="premium-glass p-5 md:p-6 rounded-3xl flex items-center gap-5 relative overflow-hidden group hover:border-red-500/30 transition-colors">
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-red-400/10 rounded-full blur-2xl translate-y-1/2 translate-x-1/2"></div>
            <div className="p-4 bg-red-400/10 rounded-2xl group-hover:bg-red-500 group-hover:shadow-lg group-hover:shadow-red-500/20 transition-all duration-300 ring-1 ring-red-400/20 z-10">
              <XCircle className="w-8 h-8 text-red-500 group-hover:text-white transition-colors" />
            </div>
            <div className="z-10">
              <p className="text-3xl font-extrabold text-[var(--text-primary)]">{missed}</p>
              <p className="text-sm text-[var(--text-secondary)] font-bold uppercase tracking-wider mt-1">Doses Missed</p>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 space-y-4 animate-fade-in">
          <div className="relative">
            <div className="absolute inset-0 bg-brand/30 blur-xl rounded-full"></div>
            <Loader className="w-10 h-10 animate-spin text-brand relative z-10" />
          </div>
          <p className="text-[var(--text-secondary)] font-medium animate-pulse">Loading history...</p>
        </div>
      )}

      {/* Empty States */}
      {!loading && activeTab === 'medications' && history.length === 0 && (
        <EmptyState icon={<Clock className="w-10 h-10 text-[var(--text-secondary)] opacity-40 group-hover:text-orange-500/60 transition-colors" />} title="No medication history" subtitle="Your medication logs will appear here once you start tracking your doses." />
      )}
      {!loading && activeTab === 'searches' && searchHistory.length === 0 && (
        <EmptyState icon={<Search className="w-10 h-10 text-[var(--text-secondary)] opacity-40 group-hover:text-brand/60 transition-colors" />} title="No recent searches" subtitle="Medicines you search for will appear in this log." />
      )}
      {!loading && activeTab === 'scans' && scanHistory.length === 0 && (
        <EmptyState icon={<Scan className="w-10 h-10 text-[var(--text-secondary)] opacity-40 group-hover:text-emerald-500/60 transition-colors" />} title="No recent scans" subtitle="Barcodes you scan will be logged here." />
      )}

      <div className="grid gap-4 mt-6">
        {!loading && activeTab === 'medications' && history.map((item, idx) => (
          <div key={item.id} className={`premium-glass p-5 rounded-2xl flex items-center gap-5 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden ${item.status === 'taken' ? 'hover:shadow-emerald-500/10 hover:border-emerald-500/30' : 'hover:shadow-red-500/10 hover:border-red-500/30'}`} style={{ animationDelay: `${idx * 50}ms`, animation: 'fade-in 0.5s ease-out forwards' }}>
            <div className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl ${item.status === 'taken' ? 'bg-gradient-to-b from-emerald-400 to-teal-500' : 'bg-gradient-to-b from-red-400 to-rose-500'}`}></div>
            <div className={`p-3 rounded-xl ml-2 flex-shrink-0 shadow-inner ring-1 ${item.status === 'taken' ? 'bg-emerald-500/10 ring-emerald-500/20' : 'bg-red-400/10 ring-red-400/20'}`}>
              {item.status === 'taken' ? <CheckCircle className="w-6 h-6 text-emerald-500" /> : <XCircle className="w-6 h-6 text-red-500" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-[var(--text-primary)] text-lg truncate mb-1">{item.medicineName}</p>
              <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-sm text-[var(--text-secondary)] font-medium">
                {item.dosage && <span className="bg-[var(--bg-secondary)] px-2 py-0.5 rounded-md border border-[var(--border-color)]">{item.dosage}</span>}
                <span className={`px-2 py-0.5 rounded-md ${item.status === 'taken' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'}`}>
                  {item.status === 'taken' ? 'Taken' : 'Missed'}
                </span>
                {item.takenAt?.seconds && (
                  <span className="flex items-center gap-1.5 ml-auto text-xs opacity-70">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(item.takenAt.seconds * 1000).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short', hour12: true })}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}

        {!loading && activeTab === 'searches' && searchHistory.map((item, idx) => (
          <div key={item.id} className="premium-glass p-5 rounded-2xl flex items-center gap-5 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden hover:border-brand/30 hover:shadow-brand/10" style={{ animationDelay: `${idx * 50}ms`, animation: 'fade-in 0.5s ease-out forwards' }}>
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-brand-light to-brand-dark rounded-l-2xl"></div>
            <div className="p-3 bg-brand/10 ring-1 ring-brand/20 rounded-xl ml-2 flex-shrink-0">
              <Search className="w-6 h-6 text-brand" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-[var(--text-primary)] text-lg truncate mb-1">"{item.query}"</p>
              <div className="flex items-center gap-x-3 text-sm text-[var(--text-secondary)] font-medium">
                <span className="bg-[var(--bg-secondary)] px-2 py-0.5 rounded-md border border-[var(--border-color)]">{item.resultCount} results</span>
                {item.timestamp?.seconds && (
                  <span className="flex items-center gap-1.5 ml-auto text-xs opacity-70">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(item.timestamp.seconds * 1000).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}

        {!loading && activeTab === 'scans' && scanHistory.map((item, idx) => (
          <div key={item.id} className={`premium-glass p-5 rounded-2xl flex items-center gap-5 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden ${item.found ? 'hover:border-emerald-500/30' : 'hover:border-amber-500/30'}`} style={{ animationDelay: `${idx * 50}ms`, animation: 'fade-in 0.5s ease-out forwards' }}>
            <div className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl ${item.found ? 'bg-gradient-to-b from-emerald-400 to-teal-500' : 'bg-gradient-to-b from-amber-400 to-orange-500'}`}></div>
            <div className={`p-3 rounded-xl ml-2 flex-shrink-0 ring-1 ${item.found ? 'bg-emerald-500/10 ring-emerald-500/20' : 'bg-amber-500/10 ring-amber-500/20'}`}>
               <Scan className={`w-6 h-6 ${item.found ? 'text-emerald-500' : 'text-amber-500'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-[var(--text-primary)] text-lg truncate mb-1">{item.medicineName}</p>
              <div className="flex items-center gap-x-3 text-sm text-[var(--text-secondary)] font-medium">
                <span className="text-xs font-mono bg-[var(--bg-secondary)] px-2 py-0.5 rounded-md border border-[var(--border-color)]">{item.barcode}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${item.found ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>{item.found ? 'Found' : 'Not Found'}</span>
                {item.timestamp?.seconds && (
                  <span className="flex items-center gap-1.5 ml-auto text-xs opacity-70">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(item.timestamp.seconds * 1000).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ icon, title, subtitle }) {
  return (
    <div className="premium-glass rounded-3xl p-12 text-center flex flex-col items-center justify-center border-dashed border-2 border-[var(--glass-border)] hover:border-brand/30 transition-colors group animate-fade-in">
      <div className="p-5 bg-[var(--bg-secondary)] rounded-full mb-5 ring-1 ring-[var(--border-color)] shadow-inner group-hover:scale-110 transition-transform duration-500">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">{title}</h3>
      <p className="text-[var(--text-secondary)] font-medium max-w-sm">{subtitle}</p>
    </div>
  );
}
