import React, { useState, useRef, useEffect } from 'react';
import { FileText, Zap, UploadCloud, CheckCircle, Loader, Info, AlertTriangle, Pill } from 'lucide-react';
import toast from 'react-hot-toast';
import { createWorker } from 'tesseract.js';
import { getAllMedicines } from '../../firebase/firestoreService';
import { searchOpenFdaByName } from '../services/openFdaService';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
export default function UploadPrescription() {
  const { currentUser } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrText, setOcrText] = useState('');
  const [medicines, setMedicines] = useState([]);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [hasScanned, setHasScanned] = useState(false);
  const fileInputRef = useRef(null);
  const { language, setLanguage, LANGUAGES } = useLanguage();

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Show preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    try {
      setIsProcessing(true);
      setMedicines([]);
      setHasScanned(false);
      setOcrText('');

      toast('Analyzing prescription...', { icon: '🔍', duration: 3000 });

      // 1. Run OCR (Tesseract) using worker pattern for v7
      const worker = await createWorker('eng');
      const { data: { text } } = await worker.recognize(file);
      await worker.terminate();

      const lowerText = text.toLowerCase();
      setOcrText(text);

      // 2. Fetch all medicines from our Mock/Firebase DB safely
      let allMeds = [];
      try {
        allMeds = await getAllMedicines();
      } catch (dbErr) {
        console.warn("Could not fetch local medicines (permission issue or empty), falling back to FDA API", dbErr);
      }

      // 3. Find Matches
      // We look for medicine names that appear in the OCR text
      let foundMeds = allMeds.filter(med => {
        if (!med.name) return false;
        return lowerText.includes(med.name.toLowerCase());
      });

      // 4. OpenFDA Fallback if local search yields nothing
      if (foundMeds.length === 0) {
        // Extract the most likely medication name candidates (words > 4 chars)
        const candidates = lowerText.match(/[a-z]{5,}/g) || [];
        if (candidates.length > 0) {
          toast('Searching external database for all matches...', { icon: '☁️' });
          
          // Get unique candidates, sort by length (longest first) to get best potential names
          const uniqueCandidates = [...new Set(candidates)]
             .sort((a, b) => b.length - a.length)
             .slice(0, 4); // Check top 4 words

          const externalMedsPromises = uniqueCandidates.map(word => searchOpenFdaByName(word));
          const resultsArray = await Promise.all(externalMedsPromises);
          
          // Combine results, taking the top 1-2 match from each word
          resultsArray.forEach(meds => {
             if (meds && meds.length > 0) {
                foundMeds.push(...meds.slice(0, 2));
             }
          });

          if (foundMeds.length > 0) {
            toast.success(`Found potential matches from external API!`, { icon: '🌐' });
          }
        }
      }

      // Remove duplicates so the same medicine info isn't shown multiple times
      const uniqueMeds = [];
      const seenNames = new Set();
      for (const m of foundMeds) {
        const lowerName = (m.name || '').toLowerCase();
        if (!seenNames.has(lowerName)) {
           seenNames.add(lowerName);
           uniqueMeds.push(m);
        }
      }

      setMedicines(uniqueMeds);
      setHasScanned(true);

      if (uniqueMeds.length > 0) {
        toast.success(`Found ${uniqueMeds.length} medicines!`);
      } else {
        toast.error('No known medicines found in this prescription.');
      }

    } catch (err) {
      console.error(err);
      toast.error(`Error: ${err.message || 'Failed to process image'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const startUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  function getField(med, field) {
    return med[`${field}_${language}`] || med[`${field}_en`] || med[field] || '';
  }

  function getExplanation(med) {
    return getField(med, 'simpleExplanation');
  }

  const playAudio = (medicine) => {
    window.speechSynthesis.cancel();
    
    // Construct readable text
    const textPieces = [
      medicine.name,
      medicine.dosage,
      getField(medicine, 'simpleExplanation'),
      getField(medicine, 'usageInstructions') ? `Usage: ${getField(medicine, 'usageInstructions')}` : '',
      getField(medicine, 'precautions') ? `Precautions: ${getField(medicine, 'precautions')}` : '',
      getField(medicine, 'sideEffects') ? `Side Effects: ${getField(medicine, 'sideEffects')}` : ''
    ].filter(Boolean).join('. ');

    const utterance = new SpeechSynthesisUtterance(textPieces);
    
    // Map internal language codes to speech synthesis locales
    if (language === 'hi') utterance.lang = 'hi-IN';
    else if (language === 'mr') utterance.lang = 'mr-IN';
    else utterance.lang = 'en-US';

    window.speechSynthesis.speak(utterance);
    toast.success('Playing audio description...');
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl shadow-lg shadow-indigo-500/20">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">Upload Prescription</h1>
            <p className="text-[var(--text-secondary)] text-sm mt-1 font-medium flex items-center gap-2">
              <Zap className="w-4 h-4 text-accent" /> AI-powered text extraction
            </p>
          </div>
        </div>
      </div>

      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Upload area */}
      <div className="premium-glass rounded-3xl overflow-hidden relative group border-2 border-dashed border-[var(--border-color)] hover:border-indigo-500/50 transition-colors">
        <div className="w-full bg-[var(--bg-secondary)] flex flex-col items-center justify-center relative overflow-hidden min-h-[300px] cursor-pointer" onClick={startUpload}>
          {previewUrl && !isProcessing ? (
            <img src={previewUrl} alt="Prescription" className="w-full h-full object-contain absolute inset-0 opacity-40 z-0" />
          ) : null}

          <div className="flex flex-col items-center justify-center h-full w-full py-16 relative z-10 gap-4">
            <div className="w-48 h-36 border-4 border-indigo-500/60 rounded-3xl relative bg-[var(--bg-primary)] shadow-lg flex items-center justify-center overflow-hidden">
              {isProcessing ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader className="w-10 h-10 text-indigo-500 animate-spin" />
                  <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest animate-pulse">Scanning...</span>
                </div>
              ) : (
                <UploadCloud className="w-10 h-10 text-indigo-500/60 group-hover:scale-110 transition-transform" />
              )}
            </div>
            <p className="text-[var(--text-primary)] font-bold text-lg mt-2">
              {isProcessing ? 'Extracting Text via AI...' : 'Click to Upload Prescription'}
            </p>
            <p className="text-[var(--text-secondary)] text-sm font-medium px-4 text-center max-w-sm">
              Upload a clear image of your doctor's prescription. We will automatically detect medicines and show you their details.
            </p>
          </div>
        </div>
      </div>

      {/* Language Selector if we have results */}
      {hasScanned && medicines.length > 0 && (
        <div className="flex items-center justify-end">
          <div className="flex items-center gap-1 p-1 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)]">
            {LANGUAGES.map(l => (
              <button
                key={l.code}
                onClick={() => setLanguage(l.code)}
                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${language === l.code ? 'bg-indigo-600 text-white shadow' : 'text-[var(--text-secondary)] hover:text-indigo-500'}`}
              >
                {l.full}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results grid */}
      {hasScanned && (
        <div className="space-y-6 animate-fade-in mt-4">
          {medicines.length === 0 ? (
            <div className="premium-glass p-6 rounded-2xl border-amber-500/30 bg-amber-500/5 flex items-start gap-4">
              <AlertTriangle className="w-8 h-8 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-[var(--text-primary)] text-lg mb-1">No medicines recognized</p>
                <p className="text-[var(--text-secondary)] text-sm font-medium">
                  We couldn't confidently identify any medicines in our database from the OCR text.
                  Ensure the image is clear, well-lit, and the writing is legible.
                </p>
                <div className="mt-4 p-4 bg-black/5 dark:bg-white/5 rounded-xl border border-[var(--border-color)]">
                  <p className="text-xs text-[var(--text-secondary)] font-mono font-bold mb-2">RAW EXTRACTED TEXT:</p>
                  <p className="text-sm font-mono text-[var(--text-primary)] whitespace-pre-wrap">{ocrText || '(No text extracted)'}</p>
                </div>
              </div>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold flex items-center gap-2 text-[var(--text-primary)]">
                <CheckCircle className="text-emerald-500 w-6 h-6" /> Recognized Medicines ({medicines.length})
              </h2>

              <div className="grid grid-cols-1 gap-6">
                {medicines.map(medicine => (
                  <div key={medicine.id} className="premium-glass rounded-3xl overflow-hidden hover:shadow-xl transition-shadow relative">
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-indigo-500" />
                    <div className="p-6 md:p-8 space-y-6">

                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div>
                          <h2 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">{medicine.name}</h2>
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            {medicine.dosage && (
                              <span className="inline-block px-4 py-1 bg-indigo-500/10 text-indigo-500 font-bold text-sm rounded-full">
                                {medicine.dosage}
                              </span>
                            )}
                            {medicine.isLocal === false && (
                              <span className="inline-block px-4 py-1 bg-blue-500/10 text-blue-500 font-bold text-sm rounded-full border border-blue-500/20">
                                🌐 Data fetched from external source (FDA)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {getExplanation(medicine) && (
                        <div className="p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl">
                          <p className="text-sm font-bold text-indigo-500 mb-1 uppercase tracking-wider flex items-center gap-1">💡 Simple Explanation</p>
                          <p className="text-[var(--text-primary)] text-lg font-medium leading-relaxed">{getExplanation(medicine)}</p>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {getField(medicine, 'usageInstructions') && (
                          <DetailSection icon="📋" title="Usage Instructions" text={getField(medicine, 'usageInstructions')} color="blue" />
                        )}
                        {getField(medicine, 'precautions') && (
                          <DetailSection icon="⚠️" title="Precautions" text={getField(medicine, 'precautions')} color="amber" />
                        )}
                        {getField(medicine, 'sideEffects') && (
                          <DetailSection icon="🩺" title="Side Effects" text={getField(medicine, 'sideEffects')} color="red" />
                        )}
                      </div>

                      <div className="border-t border-[var(--border-color)] pt-5 flex items-center justify-between">
                        <p className="text-sm text-[var(--text-secondary)] font-medium">🔊 Listen to medicine details in your language:</p>
                        <button 
                          onClick={() => playAudio(medicine)}
                          className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-sm font-bold transition-all shadow-md flex items-center gap-2"
                        >
                          ▶ Play Audio
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-4 bg-black/5 dark:bg-white/5 rounded-xl border border-[var(--border-color)]">
                <p className="text-xs text-[var(--text-secondary)] font-mono font-bold mb-2">RAW EXTRACTED TEXT (For debugging):</p>
                <p className="text-sm font-mono text-[var(--text-primary)] whitespace-pre-wrap max-h-40 overflow-y-auto">{ocrText}</p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function DetailSection({ icon, title, text, color }) {
  const colors = {
    blue: 'bg-blue-500/5 border-blue-500/20',
    amber: 'bg-amber-500/5 border-amber-500/20',
    red: 'bg-red-500/5 border-red-500/20',
  };
  return (
    <div className={`rounded-2xl border p-4 ${colors[color] || ''}`}>
      <p className="font-bold text-[var(--text-primary)] mb-2 flex items-center gap-2 text-sm uppercase tracking-wider">{icon} {title}</p>
      <p className="text-[var(--text-secondary)] text-sm font-medium leading-relaxed">{text}</p>
    </div>
  );
}
