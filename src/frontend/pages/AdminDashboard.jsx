import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  getAllActivityLogs, getAllUsers, getAllMedicines,
  addMedicineByBarcode, updateMedicine, deleteMedicine,
  createMedicineNotification, promoteUserToAdmin, demoteAdminToUser, logActivity
} from '../../firebase/firestoreService';
import {
  Shield, Users, Activity, Pill, Loader, Database, Search,
  Clock, Plus, Pencil, Trash2, X, Save, Camera, Scan,
  Download, CheckCircle, AlertTriangle, RefreshCw, BarChart2
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import BarcodeDisplay from '../components/BarcodeDisplay';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

// ─── EMPTY FORM ───────────────────────────────────────────────────────────────
const emptyForm = {
  barcode: '', name: '', dosage: '',
  usageInstructions_en: '', usageInstructions_hi: '', usageInstructions_mr: '',
  precautions_en: '', precautions_hi: '', precautions_mr: '',
  sideEffects_en: '', sideEffects_hi: '', sideEffects_mr: '',
  simpleExplanation_en: '', simpleExplanation_hi: '', simpleExplanation_mr: '',
};

// ─── LABEL COMPONENT ─────────────────────────────────────────────────────────
function Label({ children }) {
  return <label className="block text-sm font-bold text-[var(--text-secondary)] mb-1.5">{children}</label>;
}

function Input({ ...props }) {
  return (
    <input
      {...props}
      className="input-premium text-base font-medium py-3 w-full"
    />
  );
}

function Textarea({ ...props }) {
  return (
    <textarea
      {...props}
      rows={3}
      className="input-premium text-base font-medium py-3 w-full resize-none"
    />
  );
}

// ─── BARCODE SCANNER MODAL ───────────────────────────────────────────────────
function BarcodeScannerModal({ onScan, onClose }) {
  const scannerRef = useRef(null);
  const instanceRef = useRef(null);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    startScanner();
    return () => {
      stopScanner();
    };
  }, []);

  async function startScanner() {
    try {
      setScanning(true);
      const scanner = new Html5Qrcode('admin-scanner-reader');
      instanceRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 150 } },
        (text) => {
          onScan(text);
          stopScanner(scanner);
        },
        () => {}
      );
    } catch (err) {
      toast.error('Camera access failed. Please check permissions.');
      setScanning(false);
    }
  }

  async function stopScanner(inst) {
    const scanner = inst || instanceRef.current;
    if (scanner) {
      try {
        if (scanner.isScanning) await scanner.stop();
        scanner.clear();
      } catch (_) {}
    }
    setScanning(false);
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[var(--bg-primary)] rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-[var(--border-color)]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg text-[var(--text-primary)] flex items-center gap-2">
            <Scan className="w-5 h-5 text-brand" />
            Scan Barcode
          </h3>
          <button
            onClick={() => { stopScanner(); onClose(); }}
            className="p-2 rounded-xl hover:bg-red-500/10 hover:text-red-500 transition-colors text-[var(--text-secondary)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div
          id="admin-scanner-reader"
          ref={scannerRef}
          className="w-full rounded-2xl overflow-hidden bg-black min-h-[200px]"
        />
        <p className="text-center text-sm text-[var(--text-secondary)] mt-3 font-medium">
          Point camera at barcode on medicine packaging
        </p>
      </div>
    </div>
  );
}

// ─── MEDICINE FORM ────────────────────────────────────────────────────────────
function MedicineForm({ initialData = emptyForm, onSubmit, loading, barcodeDisabled = false }) {
  const [form, setForm] = useState(initialData);
  const [showScanner, setShowScanner] = useState(false);
  const [generatedBarcode, setGeneratedBarcode] = useState('');
  const downloadFnRef = useRef(null);

  useEffect(() => { setForm(initialData); }, [JSON.stringify(initialData)]);

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  function handleScan(barcode) {
    setForm(f => ({ ...f, barcode }));
    setShowScanner(false);
    toast.success(`Barcode scanned: ${barcode}`, { icon: '📷' });
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.barcode.trim()) { toast.error('Barcode is required'); return; }
    if (!form.name.trim()) { toast.error('Medicine name is required'); return; }
    onSubmit(form, () => {
      setGeneratedBarcode(form.barcode);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {showScanner && (
        <BarcodeScannerModal onScan={handleScan} onClose={() => setShowScanner(false)} />
      )}

      {/* Barcode Row */}
      <div>
        <Label>Barcode Number *</Label>
        <div className="flex gap-3">
          <Input
            type="text"
            value={form.barcode}
            onChange={set('barcode')}
            placeholder="e.g. 8901234567890"
            disabled={barcodeDisabled}
            required
          />
          {!barcodeDisabled && (
            <button
              type="button"
              onClick={() => setShowScanner(true)}
              className="flex-shrink-0 flex items-center gap-2 px-4 py-3 bg-brand/10 hover:bg-brand/20 text-brand font-bold rounded-xl border border-brand/30 transition-all whitespace-nowrap"
            >
              <Camera className="w-5 h-5" />
              Scan
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <Label>Medicine Name *</Label>
          <Input type="text" value={form.name} onChange={set('name')} placeholder="e.g. Paracetamol" required />
        </div>
        <div>
          <Label>Dosage</Label>
          <Input type="text" value={form.dosage} onChange={set('dosage')} placeholder="e.g. 500mg tablet" />
        </div>
      </div>

      {/* Multilingual Explanations */}
      <div className="premium-glass rounded-2xl p-5 space-y-6 border-brand/20 bg-brand/5">
        <h4 className="font-bold text-[var(--text-primary)] flex items-center gap-2 text-base">
          🌍 Multilingual Details
        </h4>

        {/* Simple Explanation */}
        <div className="space-y-3">
          <h5 className="font-bold text-brand text-sm tracking-wider uppercase">Simple Explanation</h5>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label>🇬🇧 English</Label>
              <Textarea value={form.simpleExplanation_en} onChange={set('simpleExplanation_en')} placeholder="e.g. Used to reduce fever" />
            </div>
            <div>
              <Label>🇮🇳 Hindi (हिंदी)</Label>
              <Textarea value={form.simpleExplanation_hi} onChange={set('simpleExplanation_hi')} placeholder="e.g. बुखार कम करने की दवा" />
            </div>
            <div>
              <Label>🇮🇳 Marathi (मराठी)</Label>
              <Textarea value={form.simpleExplanation_mr} onChange={set('simpleExplanation_mr')} placeholder="e.g. ताप कमी करण्यासाठी" />
            </div>
          </div>
        </div>

        {/* Usage Instructions */}
        <div className="space-y-3">
          <h5 className="font-bold text-blue-500 text-sm tracking-wider uppercase">Usage Instructions</h5>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label>🇬🇧 English</Label>
              <Textarea value={form.usageInstructions_en} onChange={set('usageInstructions_en')} placeholder="e.g. Take after food" />
            </div>
            <div>
              <Label>🇮🇳 Hindi (हिंदी)</Label>
              <Textarea value={form.usageInstructions_hi} onChange={set('usageInstructions_hi')} placeholder="e.g. खाने के बाद लें" />
            </div>
            <div>
              <Label>🇮🇳 Marathi (मराठी)</Label>
              <Textarea value={form.usageInstructions_mr} onChange={set('usageInstructions_mr')} placeholder="e.g. जेवणानंतर घ्या" />
            </div>
          </div>
        </div>

        {/* Precautions */}
        <div className="space-y-3">
          <h5 className="font-bold text-amber-500 text-sm tracking-wider uppercase">Precautions</h5>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label>🇬🇧 English</Label>
              <Textarea value={form.precautions_en} onChange={set('precautions_en')} placeholder="e.g. Avoid alcohol" />
            </div>
            <div>
              <Label>🇮🇳 Hindi (हिंदी)</Label>
              <Textarea value={form.precautions_hi} onChange={set('precautions_hi')} placeholder="e.g. शराब न पिएं" />
            </div>
            <div>
              <Label>🇮🇳 Marathi (मराठी)</Label>
              <Textarea value={form.precautions_mr} onChange={set('precautions_mr')} placeholder="e.g. मद्यपान टाळा" />
            </div>
          </div>
        </div>

        {/* Side Effects */}
        <div className="space-y-3">
          <h5 className="font-bold text-red-500 text-sm tracking-wider uppercase">Side Effects</h5>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label>🇬🇧 English</Label>
              <Textarea value={form.sideEffects_en} onChange={set('sideEffects_en')} placeholder="e.g. Nausea, Dizziness" />
            </div>
            <div>
              <Label>🇮🇳 Hindi (हिंदी)</Label>
              <Textarea value={form.sideEffects_hi} onChange={set('sideEffects_hi')} placeholder="e.g. मतली, चक्कर आना" />
            </div>
            <div>
              <Label>🇮🇳 Marathi (मराठी)</Label>
              <Textarea value={form.sideEffects_mr} onChange={set('sideEffects_mr')} placeholder="e.g. मळमळ, चक्कर येणे" />
            </div>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full btn-premium py-4 text-lg flex items-center justify-center gap-3 disabled:opacity-60"
      >
        {loading ? <Loader className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
        {loading ? 'Saving…' : barcodeDisabled ? 'Update Medicine' : 'Add Medicine'}
      </button>

      {/* Generated Barcode Preview */}
      {generatedBarcode && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center gap-2 text-emerald-600 font-bold text-base">
            <CheckCircle className="w-5 h-5" />
            Medicine added! Barcode generated:
          </div>
          <BarcodeDisplay
            value={generatedBarcode}
            medicineName={form.name}
            onReady={(fn) => { downloadFnRef.current = fn; }}
          />
          <button
            type="button"
            onClick={() => downloadFnRef.current && downloadFnRef.current()}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20"
          >
            <Download className="w-5 h-5" />
            Download Barcode PNG
          </button>
        </div>
      )}
    </form>
  );
}

// ─── EDIT MODAL ───────────────────────────────────────────────────────────────
function EditModal({ medicine, onClose, onSaved }) {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(form) {
    setLoading(true);
    try {
      const { barcode, ...rest } = form;
      await updateMedicine(medicine.id, rest);
      toast.success('Medicine updated!');
      onSaved();
      onClose();
    } catch {
      toast.error('Failed to update medicine');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[var(--bg-primary)] rounded-3xl p-6 md:p-8 w-full max-w-2xl shadow-2xl border border-[var(--border-color)] my-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-extrabold text-[var(--text-primary)] flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl shadow-lg">
              <Pencil className="w-5 h-5 text-white" />
            </div>
            Edit Medicine
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-red-500/10 hover:text-red-500 transition-colors text-[var(--text-secondary)]">
            <X className="w-5 h-5" />
          </button>
        </div>
        <MedicineForm
          initialData={{
            barcode: medicine.id,
            name: medicine.name || '',
            dosage: medicine.dosage || '',
            usageInstructions_en: medicine.usageInstructions_en || medicine.usageInstructions || '',
            usageInstructions_hi: medicine.usageInstructions_hi || '',
            usageInstructions_mr: medicine.usageInstructions_mr || '',
            precautions_en: medicine.precautions_en || medicine.precautions || '',
            precautions_hi: medicine.precautions_hi || '',
            precautions_mr: medicine.precautions_mr || '',
            sideEffects_en: medicine.sideEffects_en || medicine.sideEffects || '',
            sideEffects_hi: medicine.sideEffects_hi || '',
            sideEffects_mr: medicine.sideEffects_mr || '',
            simpleExplanation_en: medicine.simpleExplanation_en || '',
            simpleExplanation_hi: medicine.simpleExplanation_hi || '',
            simpleExplanation_mr: medicine.simpleExplanation_mr || '',
          }}
          onSubmit={handleSubmit}
          loading={loading}
          barcodeDisabled={true}
        />
      </div>
    </div>
  );
}

// ─── MEDICINE CARD ────────────────────────────────────────────────────────────
function MedicineCard({ medicine, onEdit, onDelete }) {
  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  async function confirmDelete() {
    setDeleting(true);
    try {
      await deleteMedicine(medicine.id);
      toast.success(`${medicine.name} deleted`);
      onDelete(medicine.id);
    } catch {
      toast.error('Failed to delete');
    } finally {
      setDeleting(false);
      setShowConfirm(false);
    }
  }

  return (
    <div className="premium-glass p-5 rounded-2xl flex flex-col gap-3 hover:border-brand/30 transition-all duration-300 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-24 h-24 bg-brand/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-extrabold text-lg text-[var(--text-primary)] leading-tight truncate">{medicine.name}</p>
          {medicine.dosage && (
            <span className="inline-block mt-1 px-2 py-0.5 bg-brand/10 text-brand text-xs font-bold rounded-md">{medicine.dosage}</span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={() => onEdit(medicine)} className="p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500 text-amber-600 hover:text-white transition-all duration-300" title="Edit">
            <Pencil className="w-4 h-4" />
          </button>
          <button onClick={() => setShowConfirm(true)} className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white transition-all duration-300" title="Delete">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <p className="text-sm text-[var(--text-secondary)] font-medium line-clamp-2">
        {medicine.simpleExplanation_en || medicine.usageInstructions || 'No description available.'}
      </p>

      <div className="border-t border-[var(--border-color)] pt-3 flex items-center justify-between">
        <p className="text-xs font-mono text-[var(--text-secondary)] flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
          {medicine.id}
        </p>
      </div>

      {/* Delete Confirm */}
      {showConfirm && (
        <div className="absolute inset-0 bg-[var(--bg-primary)]/95 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center gap-4 z-10 p-6">
          <AlertTriangle className="w-10 h-10 text-red-500" />
          <p className="font-bold text-center text-[var(--text-primary)]">Delete "{medicine.name}"?</p>
          <p className="text-sm text-[var(--text-secondary)] text-center">This cannot be undone.</p>
          <div className="flex gap-3 w-full">
            <button onClick={() => setShowConfirm(false)} className="flex-1 py-2.5 rounded-xl border border-[var(--border-color)] font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-colors">Cancel</button>
            <button onClick={confirmDelete} disabled={deleting} className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold transition-colors flex items-center justify-center gap-2">
              {deleting ? <Loader className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MAIN ADMIN DASHBOARD ─────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { currentUser } = useAuth();
  const [tab, setTab] = useState('add');
  const [medicines, setMedicines] = useState([]);
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState('');
  const [editingMedicine, setEditingMedicine] = useState(null);

  const tabs = [
    { id: 'add',      label: 'Add Medicine',    icon: Plus,      color: 'emerald' },
    { id: 'view',     label: 'View Medicines',   icon: Pill,      color: 'brand'   },
    { id: 'search',   label: 'Search',           icon: Search,    color: 'blue'    },
    { id: 'logs',     label: 'Activity Logs',    icon: Activity,  color: 'amber'   },
    { id: 'users',    label: 'Users',            icon: Users,     color: 'violet'  },
  ];

  const colorMap = {
    emerald: 'from-emerald-500 to-teal-500',
    brand:   'from-indigo-500 to-violet-500',
    blue:    'from-blue-500 to-cyan-500',
    amber:   'from-amber-500 to-orange-500',
    violet:  'from-violet-500 to-fuchsia-500',
  };

  async function loadData() {
    setLoading(true);
    try {
      const [m, l, u] = await Promise.all([getAllMedicines(), getAllActivityLogs(), getAllUsers()]);
      setMedicines(m);
      setLogs(l);
      setUsers(u);
    } catch {
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  async function handleAddMedicine(form, onSuccess) {
    setAdding(true);
    try {
      await addMedicineByBarcode(form.barcode, form);
      // Notify all users
      await createMedicineNotification(form.barcode, form.name);
      toast.success(`${form.name} added & users notified!`, { icon: '✅', duration: 5000 });
      onSuccess?.();
      // Refresh medicines list
      const m = await getAllMedicines();
      setMedicines(m);
    } catch (err) {
      toast.error('Failed to add medicine: ' + err.message);
    } finally {
      setAdding(false);
    }
  }

  async function handlePromote(user) {
    if (window.confirm(`Are you sure you want to promote ${user.name || user.email} to Admin?`)) {
      try {
        await promoteUserToAdmin(user.id);
        await logActivity(currentUser.uid, currentUser.email, 'promote_admin', `Promoted ${user.email} to admin`);
        toast.success(`Promoted to Admin`);
        loadData();
      } catch (err) {
        toast.error('Failed to promote user');
      }
    }
  }

  async function handleDemote(user) {
    if (window.confirm(`Are you sure you want to remove Admin access for ${user.name || user.email}?`)) {
      try {
        await demoteAdminToUser(user.id);
        await logActivity(currentUser.uid, currentUser.email, 'demote_admin', `Demoted ${user.email} to user`);
        toast.success(`Removed Admin Access`);
        loadData();
      } catch (err) {
        toast.error('Failed to remove admin access');
      }
    }
  }

  const filteredMedicines = medicines.filter(m => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (m.name || '').toLowerCase().includes(q) || (m.id || '').includes(q);
  });

  const filteredLogs = logs.filter(l => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (l.action || '').toLowerCase().includes(q) || (l.email || '').toLowerCase().includes(q);
  });

  const filteredUsers = users.filter(u => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q);
  });

  return (
    <div className="space-y-8 animate-fade-in pb-16 max-w-7xl mx-auto">
      {editingMedicine && (
        <EditModal
          medicine={editingMedicine}
          onClose={() => setEditingMedicine(null)}
          onSaved={loadData}
        />
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-violet-500/30 blur-xl rounded-full animate-pulse-slow" />
            <div className="relative p-3 bg-gradient-to-br from-violet-500 to-fuchsia-600 rounded-2xl shadow-lg shadow-violet-500/30">
              <Shield className="w-7 h-7 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">Admin Dashboard</h1>
            <p className="text-[var(--text-secondary)] text-sm mt-1 font-medium flex items-center gap-2">
              <Database className="w-4 h-4 text-fuchsia-500" />
              Medicine Management System
            </p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 premium-glass rounded-2xl">
            <Pill className="w-4 h-4 text-brand" />
            <span className="font-bold text-[var(--text-primary)]">{medicines.length}</span>
            <span className="text-xs text-[var(--text-secondary)] font-medium">medicines</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 premium-glass rounded-2xl">
            <Users className="w-4 h-4 text-violet-500" />
            <span className="font-bold text-[var(--text-primary)]">{users.length}</span>
            <span className="text-xs text-[var(--text-secondary)] font-medium">users</span>
          </div>
          <button onClick={loadData} className="p-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:bg-brand/10 hover:border-brand/30 transition-all" title="Refresh">
            <RefreshCw className="w-4 h-4 text-[var(--text-secondary)]" />
          </button>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
        {tabs.map(({ id, label, icon: Icon, color }) => (
          <button
            key={id}
            onClick={() => { setTab(id); setSearch(''); }}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm flex-shrink-0 transition-all duration-300 whitespace-nowrap ${
              tab === id
                ? `bg-gradient-to-r ${colorMap[color]} text-white shadow-lg`
                : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)] hover:border-brand/30'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-fuchsia-500/30 blur-xl rounded-full" />
            <Loader className="w-10 h-10 animate-spin text-fuchsia-500 relative z-10" />
          </div>
          <p className="text-[var(--text-secondary)] font-medium animate-pulse">Loading admin data…</p>
        </div>
      )}

      {!loading && (
        <>
          {/* ── ADD MEDICINE ── */}
          {tab === 'add' && (
            <div className="premium-glass rounded-3xl p-6 md:p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2 pointer-events-none" />
              <div className="relative z-10">
                <h2 className="text-2xl font-extrabold text-[var(--text-primary)] mb-6 flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl shadow-lg">
                    <Plus className="w-5 h-5 text-white" />
                  </div>
                  Add New Medicine
                </h2>
                <MedicineForm
                  onSubmit={handleAddMedicine}
                  loading={adding}
                />
              </div>
            </div>
          )}

          {/* ── VIEW MEDICINES ── */}
          {tab === 'view' && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-2xl font-extrabold text-[var(--text-primary)] flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-xl shadow-lg">
                    <Pill className="w-5 h-5 text-white" />
                  </div>
                  All Medicines
                  <span className="text-base font-bold text-[var(--text-secondary)] ml-1">({medicines.length})</span>
                </h2>
              </div>
              {medicines.length === 0 ? (
                <div className="premium-glass rounded-3xl p-16 text-center border-dashed border-2">
                  <Pill className="w-12 h-12 mx-auto text-[var(--text-secondary)] opacity-30 mb-4" />
                  <p className="font-bold text-[var(--text-primary)] text-lg mb-2">No medicines yet</p>
                  <p className="text-[var(--text-secondary)]">Add your first medicine using the "Add Medicine" tab.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {medicines.map(m => (
                    <MedicineCard
                      key={m.id}
                      medicine={m}
                      onEdit={setEditingMedicine}
                      onDelete={(id) => setMedicines(prev => prev.filter(x => x.id !== id))}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── SEARCH ── */}
          {tab === 'search' && (
            <div className="space-y-5 animate-fade-in">
              <div className="premium-glass rounded-3xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                <div className="relative z-10 flex gap-3">
                  <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)] group-focus-within:text-brand transition-colors" />
                    <input
                      type="text"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Search by medicine name or barcode…"
                      className="input-premium pl-12 py-4 text-base w-full"
                      autoFocus
                    />
                  </div>
                </div>
              </div>
              {search.trim() && (
                <div>
                  <p className="text-sm text-[var(--text-secondary)] font-semibold mb-4">{filteredMedicines.length} result{filteredMedicines.length !== 1 ? 's' : ''} for "{search}"</p>
                  {filteredMedicines.length === 0 ? (
                    <div className="premium-glass rounded-3xl p-12 text-center border-dashed border-2">
                      <Search className="w-10 h-10 mx-auto text-[var(--text-secondary)] opacity-30 mb-3" />
                      <p className="font-bold text-[var(--text-primary)]">No medicines found</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {filteredMedicines.map(m => (
                        <MedicineCard
                          key={m.id}
                          medicine={m}
                          onEdit={setEditingMedicine}
                          onDelete={(id) => setMedicines(prev => prev.filter(x => x.id !== id))}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── ACTIVITY LOGS ── */}
          {tab === 'logs' && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-extrabold text-[var(--text-primary)] flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl shadow-lg">
                    <Activity className="w-5 h-5 text-white" />
                  </div>
                  Activity Logs
                </h2>
                <div className="relative group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Filter logs…"
                    className="input-premium pl-9 py-2 text-sm w-56"
                  />
                </div>
              </div>
              <div className="grid gap-3">
                {filteredLogs.length === 0 ? (
                  <div className="premium-glass rounded-3xl p-12 text-center border-dashed border-2">
                    <Activity className="w-10 h-10 mx-auto text-[var(--text-secondary)] opacity-30 mb-3" />
                    <p className="text-[var(--text-secondary)] font-medium">No activity logs found.</p>
                  </div>
                ) : filteredLogs.map((log, idx) => (
                  <div key={log.id} className="premium-glass p-4 rounded-2xl flex flex-col md:flex-row md:items-center gap-4 hover:border-amber-500/20 transition-colors">
                    <span className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex-shrink-0 text-center md:w-32 ring-1 ${
                      log.action === 'registration' ? 'bg-emerald-500/10 text-emerald-600 ring-emerald-500/20'
                      : log.action === 'login' ? 'bg-blue-500/10 text-blue-600 ring-blue-500/20'
                      : log.action === 'logout' ? 'bg-gray-500/10 text-gray-600 ring-gray-500/20'
                      : 'bg-amber-500/10 text-amber-600 ring-amber-500/20'
                    }`}>{log.action}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[var(--text-primary)] font-semibold truncate">{log.email}</p>
                      {log.details && <p className="text-sm text-[var(--text-secondary)] truncate mt-0.5">{log.details}</p>}
                    </div>
                    <div className="flex items-center gap-2 text-xs font-medium text-[var(--text-secondary)] bg-[var(--bg-secondary)] px-3 py-1.5 rounded-lg border border-[var(--border-color)] whitespace-nowrap">
                      <Clock className="w-3.5 h-3.5" />
                      {log.timestamp?.seconds ? new Date(log.timestamp.seconds * 1000).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Unknown time'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── USERS ── */}
          {tab === 'users' && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-extrabold text-[var(--text-primary)] flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-xl shadow-lg">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  All Users
                </h2>
                <div className="relative group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Filter users…"
                    className="input-premium pl-9 py-2 text-sm w-56"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredUsers.length === 0 ? (
                  <div className="premium-glass rounded-3xl p-12 text-center border-dashed border-2 col-span-full">
                    <Users className="w-10 h-10 mx-auto text-[var(--text-secondary)] opacity-30 mb-3" />
                    <p className="text-[var(--text-secondary)] font-medium">No users found.</p>
                  </div>
                ) : filteredUsers.map(u => (
                  <div key={u.id} className="premium-glass p-5 rounded-2xl flex items-center gap-4 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 group">
                    <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-fuchsia-600 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-md ring-2 ring-white/10 group-hover:scale-110 transition-transform">
                      {u.name?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-[var(--text-primary)] truncate">{u.name || 'Anonymous'}</p>
                        {u.role === 'admin' && (
                          <span className="bg-emerald-500/10 text-emerald-600 text-[10px] uppercase font-bold px-2 py-0.5 rounded border border-emerald-500/20 flex-shrink-0">
                            Admin
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-[var(--text-secondary)] truncate">{u.email}</p>
                      {u.age && <p className="text-xs text-[var(--text-secondary)] mt-1">Age: {u.age}</p>}
                    </div>
                    {/* Role Actions */}
                    <div className="flex-shrink-0">
                      {u.role === 'admin' ? (
                        <button
                          onClick={() => handleDemote(u)}
                          className="px-3 py-1.5 text-xs font-bold bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 rounded-lg transition-colors border border-red-500/20"
                        >
                          Remove Admin
                        </button>
                      ) : (
                        <button
                          onClick={() => handlePromote(u)}
                          className="px-3 py-1.5 text-xs font-bold bg-brand/10 hover:bg-brand hover:text-white text-brand rounded-lg transition-colors border border-brand/20"
                        >
                          Make Admin
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
