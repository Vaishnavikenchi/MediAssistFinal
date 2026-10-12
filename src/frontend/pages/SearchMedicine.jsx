import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Pill, ChevronRight, Loader, Sparkles, Database } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { getAllMedicines, addSearchHistory } from '../../firebase/firestoreService';
import { searchOpenFdaByName } from '../services/openFdaService';
import Fuse from 'fuse.js';

export default function SearchMedicine() {
  const { currentUser } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [localMedicines, setLocalMedicines] = useState([]);
  const [localMatches, setLocalMatches] = useState([]);
  const [loadingLocal, setLoadingLocal] = useState(true);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchLocal() {
      try {
        const data = await getAllMedicines();
        setLocalMedicines(data);
      } catch (err) {
        console.error('Error fetching local medicines:', err);
      } finally {
        setLoadingLocal(false);
      }
    }
    fetchLocal();
  }, []);

  async function handleSearch(e) {
    e.preventDefault();
    if (!query.trim()) return;
    const cleanQuery = query.trim();
    setLoading(true);
    setSearched(true);
    try {
      // 1. Local Search via Fuse.js (Fuzzy, partial, case-insensitive)
      const fuseOptions = {
        keys: ['name', 'barcode'],
        threshold: 0.3, // 0.0 is exact, 1.0 is anything. 0.3 allows slight typos
        ignoreLocation: true, // match anywhere in the string
      };
      const fuse = new Fuse(localMedicines, fuseOptions);
      
      // Fuse returns array of { item, refIndex }
      const fuseResults = fuse.search(cleanQuery);
      const matches = fuseResults.map(result => result.item);
      setLocalMatches(matches);

      let externalResults = [];
      // Only fetch from OpenFDA if not found locally
      if (matches.length === 0) {
         externalResults = await searchOpenFdaByName(cleanQuery);
      }
      
      setResults(externalResults);
      if (externalResults.length === 0 && matches.length === 0) {
        toast('No results found locally or in external databases.', { icon: '🔍', style: { background: 'var(--glass-bg)', color: 'var(--text-primary)', backdropFilter: 'blur(12px)', border: '1px solid var(--glass-border)' }});
      }
      
      if (currentUser) {
        addSearchHistory(currentUser.uid, query, matches.length + externalResults.length).catch(console.error);
      }
    } catch {
      toast.error('Search failed. Please try again.', { style: { background: 'var(--glass-bg)', color: 'var(--text-primary)', backdropFilter: 'blur(12px)', border: '1px solid var(--glass-border)' }});
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-gradient-to-br from-brand-light to-brand-dark rounded-2xl shadow-lg shadow-brand/20">
          <Search className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">Medicine Search</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1 font-medium flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent" />
            Powered by FDA OpenData
          </p>
        </div>
      </div>

      <div className="premium-glass rounded-3xl p-6 md:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
        
        <form onSubmit={handleSearch} className="relative z-10 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-4 w-5 h-5 text-[var(--text-secondary)] group-focus-within:text-brand transition-colors" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for Ibuprofen, Amoxicillin..."
              className="input-premium pl-12 py-3.5 text-base w-full shadow-inner bg-[var(--bg-secondary)] focus:bg-[var(--bg-primary)]"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-premium py-3.5 px-8 flex items-center justify-center gap-2 md:w-auto w-full disabled:opacity-70 disabled:cursor-not-allowed group whitespace-nowrap"
          >
            {loading ? <Loader className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5 group-hover:scale-110 transition-transform" />}
            <span>Search</span>
          </button>
        </form>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="relative">
            <div className="absolute inset-0 bg-brand/30 blur-xl rounded-full"></div>
            <Loader className="w-10 h-10 animate-spin text-brand relative z-10" />
          </div>
          <p className="text-[var(--text-secondary)] font-medium animate-pulse">Searching database...</p>
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <div className="premium-glass rounded-3xl p-12 text-center flex flex-col items-center justify-center">
          <div className="p-4 bg-[var(--bg-secondary)] rounded-full mb-4 ring-1 ring-[var(--border-color)] shadow-inner">
            <Pill className="w-8 h-8 text-[var(--text-secondary)] opacity-50" />
          </div>
          <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">No medicines found</h3>
          <p className="text-[var(--text-secondary)] font-medium max-w-md">We couldn't find any exact matches in the FDA database. Try checking your spelling or using a generic name.</p>
        </div>
      )}

      {/* Local Medicines Section (when not searching or loading) */}
      {!loading && !searched && (
        <div className="space-y-4 pt-4">
          <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-500" />
            My Database Medicines {loadingLocal && <Loader className="w-4 h-4 animate-spin inline ml-2" />}
          </h2>
          {localMedicines.length === 0 && !loadingLocal ? (
             <p className="text-[var(--text-secondary)] font-medium">No medicines in local database yet.</p>
          ) : (
             <div className="grid gap-4">
               {localMedicines.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => navigate(`/medicine/${m.id}`, { state: { medicine: { isLocal: true, ...m } } })}
                    className="w-full premium-glass p-5 rounded-2xl flex items-center justify-between group cursor-pointer text-left hover:border-emerald-500/40 transition-colors animate-fade-in"
                  >
                    <div className="flex items-center gap-5 overflow-hidden">
                      <div className="p-3 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-xl group-hover:from-emerald-500 group-hover:to-teal-500 transition-all duration-300 ring-1 ring-[var(--glass-border)] group-hover:ring-emerald-500/50 flex-shrink-0">
                        <Database className="w-6 h-6 text-emerald-500 group-hover:text-white transition-colors" />
                      </div>
                      <div className="flex-1 min-w-0 pr-4">
                        <p className="font-bold text-[var(--text-primary)] text-lg truncate group-hover:text-emerald-500 transition-colors">{m.name}</p>
                        <p className="text-sm text-[var(--text-secondary)] font-medium truncate mt-0.5">{m.dosage || 'Local Record'}</p>
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center group-hover:bg-emerald-500/10 transition-colors flex-shrink-0">
                      <ChevronRight className="w-5 h-5 text-[var(--text-secondary)] group-hover:text-emerald-500 transition-colors group-hover:translate-x-0.5 transform duration-300" />
                    </div>
                  </button>
               ))}
             </div>
          )}
        </div>
      )}

        <div className="space-y-8 pt-4">
          {/* Local Matches */}
          {localMatches.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-500" />
                Found {localMatches.length} results from My Database
              </h2>
              <div className="grid gap-4">
                {localMatches.map((m, idx) => (
                  <button
                    key={m.id}
                    onClick={() => navigate(`/medicine/${m.id}`, { state: { medicine: { isLocal: true, ...m } } })}
                    className="w-full premium-glass p-5 rounded-2xl flex items-center justify-between group cursor-pointer text-left hover:border-emerald-500/40 transition-colors"
                    style={{ animationDelay: `${idx * 50}ms`, animation: 'fade-in 0.5s ease-out forwards' }}
                  >
                    <div className="flex items-center gap-5 overflow-hidden">
                      <div className="p-3 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-xl group-hover:from-emerald-500 group-hover:to-teal-500 transition-all duration-300 ring-1 ring-[var(--glass-border)] group-hover:ring-emerald-500/50 flex-shrink-0">
                        <Database className="w-6 h-6 text-emerald-500 group-hover:text-white transition-colors" />
                      </div>
                      <div className="flex-1 min-w-0 pr-4">
                        <p className="font-bold text-[var(--text-primary)] text-lg truncate group-hover:text-emerald-500 transition-colors">{m.name}</p>
                        <p className="text-sm text-[var(--text-secondary)] font-medium truncate mt-0.5">{m.dosage || 'Local Record'}</p>
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center group-hover:bg-emerald-500/10 transition-colors flex-shrink-0">
                      <ChevronRight className="w-5 h-5 text-[var(--text-secondary)] group-hover:text-emerald-500 transition-colors group-hover:translate-x-0.5 transform duration-300" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* FDA Results */}
          {results.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
                Found {results.length} results from External Source (FDA)
              </h2>
              <div className="grid gap-4">
                {results.map((item, idx) => {
                  const name = item.name;
                  const manufacturer = item.manufacturer;
                  return (
                    <button
                      key={idx}
                      onClick={() => navigate(`/medicine/${idx}`, { state: { medicine: item } })}
                      className="w-full premium-glass p-5 rounded-2xl flex items-center justify-between group cursor-pointer text-left hover:border-brand/40 transition-colors"
                      style={{ animationDelay: `${idx * 50}ms`, animation: 'fade-in 0.5s ease-out forwards' }}
                    >
                      <div className="flex items-center gap-5 overflow-hidden">
                        <div className="p-3 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-xl group-hover:from-brand group-hover:to-brand-dark transition-all duration-300 ring-1 ring-[var(--glass-border)] group-hover:ring-brand/50 flex-shrink-0">
                          <Pill className="w-6 h-6 text-brand group-hover:text-white transition-colors" />
                        </div>
                        <div className="flex-1 min-w-0 pr-4">
                          <p className="font-bold text-[var(--text-primary)] text-lg truncate group-hover:text-brand transition-colors">{name}</p>
                          <p className="text-sm text-[var(--text-secondary)] font-medium truncate mt-0.5">{manufacturer}</p>
                        </div>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center group-hover:bg-brand/10 transition-colors flex-shrink-0">
                        <ChevronRight className="w-5 h-5 text-[var(--text-secondary)] group-hover:text-brand transition-colors group-hover:translate-x-0.5 transform duration-300" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
    </div>
  );
}
