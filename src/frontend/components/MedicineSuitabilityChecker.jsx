import React, { useState } from 'react';
import { ShieldCheck, AlertTriangle, User, Activity, AlertCircle, Pill, Search } from 'lucide-react';

export default function MedicineSuitabilityChecker() {
  const [profile, setProfile] = useState({
    age: '',
    allergies: '',
    conditions: ''
  });
  const [medicine, setMedicine] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleProfileChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const evaluateMedicine = (e) => {
    e.preventDefault();
    if (!medicine.trim()) return;
    
    setLoading(true);
    setResult(null);

    // Mock evaluation logic based on user rules
    setTimeout(() => {
      const medLower = medicine.toLowerCase();
      const allergiesLower = profile.allergies.toLowerCase();
      const conditionsLower = profile.conditions.toLowerCase();
      const age = parseInt(profile.age, 10);

      let evaluation = {
        medicine: medicine,
        status: 'Safe',
        reason: 'No detected conflicts with your age, allergies, or health conditions.',
        alternatives: []
      };

      // Rule 1: Ibuprofen + Hypertension or Age > 60
      if (medLower.includes('ibuprofen') && (conditionsLower.includes('hypertension') || conditionsLower.includes('bp') || age >= 60)) {
        evaluation = {
          medicine,
          status: 'Risky',
          reason: 'Ibuprofen is an NSAID that can increase blood pressure. It is not suitable for patients with hypertension or older adults at risk of kidney stress.',
          alternatives: ['Paracetamol']
        };
      }
      // Rule 2: Penicillin allergy
      else if ((medLower.includes('penicillin') || medLower.includes('amoxicillin')) && allergiesLower.includes('penicillin')) {
        evaluation = {
          medicine,
          status: 'Risky',
          reason: 'Severe risk of allergic reaction due to your listed penicillin allergy.',
          alternatives: ['Azithromycin', 'Doxycycline']
        };
      }
      // Rule 3: Paracetamol + Liver issues
      else if (medLower.includes('paracetamol') && (conditionsLower.includes('liver') || conditionsLower.includes('hepatic'))) {
        evaluation = {
          medicine,
          status: 'Risky',
          reason: 'Paracetamol is metabolized in the liver and poses severe toxicity risks for patients with liver conditions.',
          alternatives: ['Ibuprofen (if BP is normal)']
        };
      }

      setResult(evaluation);
      setLoading(false);
    }, 600);
  };

  return (
    <div className="premium-glass rounded-3xl p-6 md:p-8 relative overflow-hidden group border border-[var(--border-color)]">
      {/* Decorative Background */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-brand/5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-[var(--bg-secondary)] rounded-xl ring-1 ring-[var(--border-color)]">
            <ShieldCheck className="w-6 h-6 text-brand" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">Personalized Suitability Check</h2>
            <p className="text-sm text-[var(--text-secondary)] font-medium">Verify if a medicine is safe for your specific health profile</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Input Form */}
          <div className="space-y-4 bg-[var(--bg-secondary)] p-5 rounded-2xl shadow-inner border border-[var(--border-color)]">
            <h3 className="font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-brand" /> My Health Profile
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider ml-1">Age</label>
                <input type="number" name="age" value={profile.age} onChange={handleProfileChange} placeholder="e.g. 55" className="input-premium w-full !py-2.5" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider ml-1">Allergies</label>
                <input type="text" name="allergies" value={profile.allergies} onChange={handleProfileChange} placeholder="e.g. Penicillin" className="input-premium w-full !py-2.5" />
              </div>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider ml-1">Health Conditions</label>
              <textarea name="conditions" value={profile.conditions} onChange={handleProfileChange} rows="2" placeholder="e.g. Hypertension, Diabetes" className="input-premium w-full resize-none !py-2.5"></textarea>
            </div>

            <form onSubmit={evaluateMedicine} className="pt-4 border-t border-[var(--border-color)] mt-4">
              <div className="flex gap-2">
                <div className="relative flex-1 group">
                  <Pill className="absolute left-3 top-3 w-5 h-5 text-[var(--text-secondary)] group-focus-within:text-brand transition-colors" />
                  <input type="text" value={medicine} onChange={e => setMedicine(e.target.value)} placeholder="Medicine to check (e.g. Ibuprofen)" className="input-premium w-full pl-10 !py-2.5 bg-[var(--bg-primary)] shadow-inner" required />
                </div>
                <button type="submit" disabled={loading} className="btn-premium px-4 flex items-center justify-center gap-2">
                  {loading ? <Activity className="w-5 h-5 animate-pulse" /> : <Search className="w-5 h-5" />}
                  Check
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Results Display */}
          <div className="flex flex-col h-full">
            <h3 className="font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-brand" /> Analysis Result
            </h3>
            
            <div className={`flex-1 rounded-2xl p-6 flex flex-col items-center justify-center text-center transition-all duration-500 border ${
              !result ? 'bg-[var(--bg-secondary)] border-[var(--border-color)] border-dashed' 
              : result.status === 'Safe' ? 'bg-emerald-500/10 border-emerald-500/30' 
              : 'bg-amber-500/10 border-amber-500/30'
            }`}>
              
              {!result && !loading && (
                <div className="text-[var(--text-secondary)] opacity-70">
                  <ShieldCheck className="w-12 h-12 mb-3 mx-auto opacity-50" />
                  <p className="font-medium">Enter your details and a medicine to get personalized advice.</p>
                </div>
              )}

              {loading && (
                <div className="text-brand flex flex-col items-center">
                  <Activity className="w-12 h-12 mb-3 animate-spin" />
                  <p className="font-bold animate-pulse">Analyzing interactions...</p>
                </div>
              )}

              {result && !loading && (
                <div className="w-full text-left animate-fade-in">
                  <div className="flex flex-col items-center text-center mb-4">
                    {result.status === 'Safe' ? (
                      <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-2 ring-4 ring-emerald-500/10">
                        <ShieldCheck className="w-8 h-8 text-emerald-500" />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mb-2 ring-4 ring-amber-500/10">
                        <AlertTriangle className="w-8 h-8 text-amber-500" />
                      </div>
                    )}
                    <h4 className="text-xl font-extrabold text-[var(--text-primary)]">
                       {result.medicine} is <span className={result.status === 'Safe' ? 'text-emerald-500' : 'text-amber-500'}>{result.status}</span>
                    </h4>
                  </div>
                  
                  <div className="space-y-3 bg-[var(--bg-primary)] p-4 rounded-xl ring-1 ring-[var(--glass-border)] shadow-sm">
                    <div>
                      <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider block mb-1">Reasoning</span>
                      <p className="text-sm font-medium text-[var(--text-primary)] leading-relaxed">{result.reason}</p>
                    </div>
                    {result.alternatives.length > 0 && (
                      <div className="pt-2 border-t border-[var(--border-color)]">
                        <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider block mb-1">Safe Alternatives</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {result.alternatives.map((alt, i) => (
                            <span key={i} className="px-3 py-1 bg-brand/10 text-brand text-xs font-bold rounded-lg">{alt}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
