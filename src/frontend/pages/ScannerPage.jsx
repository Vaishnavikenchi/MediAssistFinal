import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Scan, Zap, UploadCloud, CheckCircle, Loader, Search, Info, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { Html5Qrcode } from 'html5-qrcode';
import { getMedicineByBarcode, addScanHistory } from '../../firebase/firestoreService';
import { searchOpenFdaByBarcode } from '../services/openFdaService';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import VoiceAssistant from '../components/VoiceAssistant';

export default function ScannerPage() {
  const { currentUser } = useAuth();
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [medicine, setMedicine] = useState(null);
  const [fetchingMed, setFetchingMed] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);
  const { language, setLanguage, LANGUAGES } = useLanguage();

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Show preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    try {
      setIsScanning(true);
      setScanResult(null);
      setMedicine(null);
      setNotFound(false);

      const html5QrCode = new Html5Qrcode('reader');
      const decodedText = await html5QrCode.scanFile(file, true);

      setScanResult(decodedText);
      toast.success(`Barcode detected: ${decodedText}`);

      // Fetch from Firestore
      setFetchingMed(true);
      try {
        let med = await getMedicineByBarcode(decodedText);
        
        if (!med) {
          // Fallback to External API
          med = await searchOpenFdaByBarcode(decodedText);
        }
        
        if (currentUser) {
           addScanHistory(currentUser.uid, decodedText, med ? med.name : 'Unknown', !!med).catch(console.error);
        }

        if (med) {
           setMedicine(med);
           if (med.isLocal === false) {
             toast.success(`Found from external API: ${med.name}`, { icon: '🌐' });
           } else {
             toast.success(`Found: ${med.name}`, { icon: '💊' });
           }
        } else {
           setNotFound(true);
           toast('Medicine not found in local or external databases.', { icon: '🔍' });
        }
      } finally {
        setFetchingMed(false);
      }
    } catch (err) {
      toast.error('Could not read barcode from image. Please try another image.');
      setScanResult(null);
    } finally {
      setIsScanning(false);
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

  return (
    <div className="space-y-8 animate-fade-in pb-10 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-brand-light to-brand-dark rounded-2xl shadow-lg shadow-brand/20">
            <Scan className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">Upload Barcode</h1>
            <p className="text-[var(--text-secondary)] text-sm mt-1 font-medium flex items-center gap-2">
              <Zap className="w-4 h-4 text-accent" /> Upload image → Get medicine info
            </p>
          </div>
        </div>
      </div>

      {/* Hidden container for html5-qrcode library to attach to */}
      <div id="reader" style={{ display: 'none' }}></div>
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleFileUpload}
        style={{ display: 'none' }}
      />

      {/* Upload area */}
      <div className="premium-glass rounded-3xl overflow-hidden relative group border-2 border-dashed border-[var(--border-color)] hover:border-brand/50 transition-colors">
        <div className="w-full bg-[var(--bg-secondary)] flex flex-col items-center justify-center relative overflow-hidden min-h-[300px] cursor-pointer" onClick={startUpload}>
          {previewUrl && !isScanning && !fetchingMed ? (
            <img src={previewUrl} alt="Barcode Preview" className="w-full h-full object-contain absolute inset-0 opacity-50" />
          ) : null}

          <div className="flex flex-col items-center justify-center h-full w-full py-16 relative z-10 gap-4">
            <div className="w-48 h-36 border-4 border-brand/60 rounded-3xl relative bg-[var(--bg-primary)] shadow-lg flex items-center justify-center">
              {isScanning ? (
                <Loader className="w-10 h-10 text-brand animate-spin" />
              ) : (
                <UploadCloud className="w-10 h-10 text-brand/50" />
              )}
            </div>
            <p className="text-[var(--text-primary)] font-bold text-lg mt-2">
              {isScanning ? 'Scanning Image...' : 'Click to Upload Barcode'}
            </p>
            <p className="text-[var(--text-secondary)] text-sm font-medium px-4 text-center max-w-sm">
              Upload an image of the medicine's barcode to instantly retrieve its details and instructions.
            </p>
          </div>
        </div>
      </div>

      {/* Scan Result bar */}
      {scanResult && (
        <div className="premium-glass p-5 rounded-2xl flex items-center gap-4 border-emerald-500/30 bg-emerald-500/5">
          <CheckCircle className="w-8 h-8 text-emerald-500 flex-shrink-0" />
          <div>
            <p className="font-bold text-[var(--text-primary)]">Barcode Detected</p>
            <p className="text-emerald-600 font-mono text-sm">{scanResult}</p>
          </div>
        </div>
      )}

      {/* Loading medicine */}
      {fetchingMed && (
        <div className="flex items-center justify-center gap-3 py-6">
          <Loader className="w-6 h-6 animate-spin text-brand" />
          <span className="text-[var(--text-secondary)] font-medium">Looking up medicine…</span>
        </div>
      )}

      {/* Not Found */}
      {notFound && !fetchingMed && (
        <div className="premium-glass p-6 rounded-2xl border-amber-500/30 bg-amber-500/5 flex items-start gap-4">
          <AlertTriangle className="w-8 h-8 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-[var(--text-primary)] text-lg mb-1">Medicine not in database</p>
            <p className="text-[var(--text-secondary)] text-sm font-medium">
              Barcode <span className="font-mono text-amber-600">{scanResult}</span> was not found. Ask your admin to add it.
            </p>
          </div>
        </div>
      )}

      {/* Medicine Detail Card */}
      {medicine && !fetchingMed && (
        <div className="premium-glass rounded-3xl overflow-hidden animate-fade-in">
          {/* Top accent */}
          <div className="h-2 bg-gradient-to-r from-brand to-accent" />
          <div className="p-6 md:p-8 space-y-6">
            {/* Name & Dosage */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div>
                <h2 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">{medicine.name}</h2>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  {medicine.dosage && (
                    <span className="inline-block px-4 py-1 bg-brand/10 text-brand font-bold text-sm rounded-full">{medicine.dosage}</span>
                  )}
                  {medicine.isLocal === false && (
                    <span className="inline-block px-4 py-1 bg-blue-500/10 text-blue-500 font-bold text-sm rounded-full border border-blue-500/20">🌐 Data fetched from external source (FDA)</span>
                  )}
                </div>
              </div>
              {/* Language selector inside card */}
              <div className="flex items-center gap-1 p-1 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)] flex-shrink-0">
                {LANGUAGES.map(l => (
                  <button
                    key={l.code}
                    onClick={() => setLanguage(l.code)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${language === l.code ? 'bg-brand text-white shadow' : 'text-[var(--text-secondary)] hover:text-brand'}`}
                  >
                    {l.full}
                  </button>
                ))}
              </div>
            </div>

            {/* Simple Explanation */}
            {getExplanation(medicine) && (
              <div className="p-4 bg-brand/5 border border-brand/20 rounded-2xl">
                <p className="text-sm font-bold text-brand mb-1 uppercase tracking-wider flex items-center gap-1">💡 Simple Explanation</p>
                <p className="text-[var(--text-primary)] text-lg font-medium leading-relaxed">{getExplanation(medicine)}</p>
              </div>
            )}

            {/* Detail Grid */}
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

            {/* Voice Assistant */}
            <div className="border-t border-[var(--border-color)] pt-5">
              <p className="text-sm text-[var(--text-secondary)] font-medium mb-3">🔊 Voice assistance for elderly users:</p>
              <VoiceAssistant medicine={medicine} />
            </div>
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="flex gap-4 p-5 premium-glass rounded-2xl bg-brand/5 border-brand/20">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-brand to-accent" />
        <Info className="w-6 h-6 text-brand flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-[var(--text-primary)] mb-1">Upload Tips</h4>
          <ul className="text-sm text-[var(--text-secondary)] font-medium leading-relaxed list-disc list-inside space-y-1">
            <li>Ensure the barcode is clear and in focus in the image.</li>
            <li>Crop the image if needed before uploading.</li>
            <li>Make sure the barcode lines are visible and unobstructed.</li>
          </ul>
        </div>
      </div>
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
