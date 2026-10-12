import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Pill, AlertTriangle, Info, Shield, Droplets, Database, Save, CheckCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { addMedicineByBarcode } from '../../firebase/firestoreService';
import toast from 'react-hot-toast';

function Section({ icon: Icon, title, content, color = 'blue' }) {
  if (!content) return null;
  
  const colors = { 
    blue: 'bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-300 icon-blue', 
    yellow: 'bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-300 icon-amber', 
    red: 'bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-300 icon-red',
    brand: 'bg-brand/10 border-brand/20 text-brand-dark dark:text-brand-light icon-brand'
  };

  const iconColors = {
    blue: 'text-blue-500',
    yellow: 'text-amber-500',
    red: 'text-red-500',
    brand: 'text-brand'
  };

  return (
    <div className={`rounded-2xl border p-5 md:p-6 transition-all duration-300 hover:shadow-md ${colors[color]} premium-glass`}>
      <div className="flex items-center gap-3 mb-3 font-bold text-lg">
        <div className={`p-2 rounded-xl bg-white/50 dark:bg-black/20 shadow-sm ${iconColors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-[var(--text-primary)]">{title}</span>
      </div>
      <p className="text-sm md:text-base leading-relaxed text-[var(--text-secondary)] font-medium pl-14">
        {content}
      </p>
    </div>
  );
}

export default function MedicineDetail() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [medicine, setMedicine] = React.useState(state?.medicine);
  const [isSaving, setIsSaving] = React.useState(false);
  const { language } = useLanguage();

  if (!medicine) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in premium-glass rounded-3xl p-10 max-w-lg mx-auto mt-10 text-center">
        <div className="p-6 bg-[var(--bg-secondary)] rounded-full mb-6 ring-1 ring-[var(--border-color)] shadow-inner">
          <Pill className="w-16 h-16 text-[var(--text-secondary)] opacity-50" />
        </div>
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">No data found</h2>
        <p className="text-[var(--text-secondary)] mb-8 font-medium">We couldn't load the details for this medication.</p>
        <button onClick={() => navigate('/search')} className="btn-premium py-3 px-8 w-full font-bold">
          Return to Search
        </button>
      </div>
    );
  }

  const isLocal = medicine.isLocal;
  
  function getLocalField(field) {
    return medicine[`${field}_${language}`] || medicine[`${field}_en`] || medicine[field] || '';
  }

  const name = medicine.name || 'Unknown Medicine';
  
  // Note: Manufacturer info varies based on local vs external data
  const manufacturer = isLocal 
    ? (medicine.manufacturer || 'Local Database (Live FDA Sync Disabled)') 
    : (medicine.manufacturer || 'External Source');
  
  const purpose = getLocalField('simpleExplanation');
  const warnings = getLocalField('precautions');
  const dosage = getLocalField('usageInstructions') || medicine.dosage;
  const sideEffects = getLocalField('sideEffects');

  const handleSave = async () => {
     if (!medicine || isLocal) return;
     setIsSaving(true);
     try {
       await addMedicineByBarcode(medicine.barcode, medicine);
       toast.success(`${medicine.name} permanently saved to database!`, { icon: '💾' });
       // Update visual state so it now acts like a local record
       setMedicine({...medicine, isLocal: true});
     } catch (err) {
       console.error("Save error", err);
       toast.error("Failed to save. Try again.");
     } finally {
       setIsSaving(false);
     }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto animate-fade-in pb-12">
      <button 
        onClick={() => navigate(-1)} 
        className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-brand transition-colors text-sm font-bold group bg-[var(--bg-secondary)] py-2 px-4 rounded-full w-fit hover:shadow-md border border-[var(--border-color)]"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> 
        Back to results
      </button>

      <div className="relative premium-glass rounded-3xl p-8 md:p-10 border-t-4 border-t-brand overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="p-5 bg-gradient-to-br from-brand-light to-brand-dark rounded-2xl shadow-xl shadow-brand/20 ring-1 ring-white/20 flex-shrink-0">
            <Droplets className="w-10 h-10 text-white" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
               <h1 className="text-3xl md:text-4xl font-extrabold text-[var(--text-primary)] tracking-tight">{name}</h1>
               {!isLocal && (
                 <span className="inline-block px-3 py-1 bg-blue-500/10 text-blue-500 font-bold text-xs rounded-full border border-blue-500/20">
                   🌐 Data fetched from external source
                 </span>
               )}
            </div>
            {manufacturer && (
              <p className="text-[var(--text-secondary)] font-medium flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
                Manufactured by <span className="text-[var(--text-primary)] font-bold">{manufacturer}</span>
              </p>
            )}
            
            {!isLocal && (
              <div className="mt-4">
                <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSaving ? <Database className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {isSaving ? "Saving..." : "Save this medicine for future"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        <Section icon={Info} title={isLocal ? "Simple Explanation" : "Purpose & Indications"} content={purpose} color="brand" />
        {isLocal ? (
          <Section icon={Pill} title="Side Effects" content={sideEffects} color="red" />
        ) : (
          <Section icon={Pill} title="Active Ingredients" content={sideEffects} color="blue" />
        )}
        <Section icon={Shield} title="Usage / Dosage" content={dosage} color="yellow" />
        <Section icon={AlertTriangle} title={isLocal ? "Precautions" : "Important Warnings"} content={warnings} color="red" />
      </div>
    </div>
  );
}
