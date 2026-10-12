import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Moon, Sun, Bell, Settings as SettingsIcon, Shield, Info, Smartphone, Type } from 'lucide-react';

function ToggleSetting({ icon: Icon, title, desc, checked, onChange, colorClass }) {
  return (
    <div className="flex items-center justify-between p-5 md:p-6 premium-glass rounded-2xl group cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg" onClick={onChange}>
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-xl flex-shrink-0 transition-colors duration-300 ${colorClass}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="font-bold text-[var(--text-primary)] text-lg group-hover:text-brand transition-colors">{title}</p>
          <p className="text-[var(--text-secondary)] font-medium mt-0.5">{desc}</p>
        </div>
      </div>
      <div className="flex-shrink-0 ml-4">
        <div className={`relative w-14 h-8 rounded-full transition-colors duration-300 ease-in-out shadow-inner ${checked ? 'bg-brand' : 'bg-[var(--glass-border)]'}`}>
          <span className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300 ease-in-out transform ${checked ? 'translate-x-7' : 'translate-x-1'}`} />
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { darkMode, toggleDarkMode, fontSize, changeFontSize } = useTheme();
  const [notifications, setNotifications] = React.useState(true);

  
return (
  <div
    className="relative min-h-screen text-[var(--text-primary)]"
    style={{
      backgroundImage: "url('/medicine-bg-settings.jpg')",
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
    }}
  >
    {/* Dark overlay for better readability */}
    <div className="fixed inset-0 z-0 bg-slate-950/75 pointer-events-none" />

    {/* Settings content */}
    <div className="relative z-10 space-y-8 animate-fade-in pb-10 max-w-3xl mx-auto">

      <div className="flex items-center gap-4">
        <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg shadow-indigo-500/20">
          <SettingsIcon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">Settings</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1 font-medium flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-purple-500" />
            Customize your MediAssist experience
          </p>
        </div>
      </div>

      <div className="space-y-4 relative">
        <div className="absolute top-1/2 left-0 w-64 h-64 bg-brand/10 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
        <div className="absolute top-1/2 right-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        
        <div className="relative z-10 space-y-4">
          <h2 className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-widest px-2 mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand"></span> Appearance
          </h2>
          <ToggleSetting
            icon={darkMode ? Moon : Sun}
            title="Dark Mode"
            desc="Switch between light and dark theme interfaces"
            checked={darkMode}
            onChange={toggleDarkMode}
            colorClass={darkMode ? "bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/20 group-hover:bg-indigo-500 group-hover:text-white" : "bg-yellow-500/10 text-yellow-500 ring-1 ring-yellow-500/20 group-hover:bg-yellow-500 group-hover:text-white"}
          />
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 md:p-6 premium-glass rounded-2xl gap-4 group transition-all duration-300 hover:shadow-lg">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 text-blue-500 ring-1 ring-blue-500/20 rounded-xl flex-shrink-0 transition-colors duration-300 group-hover:bg-blue-500 group-hover:text-white">
                <Type className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-[var(--text-primary)] text-lg group-hover:text-brand transition-colors">Text Size</p>
                <p className="text-[var(--text-secondary)] font-medium mt-0.5">Adjust the interface font size</p>
              </div>
            </div>
            <div className="flex items-center gap-1 bg-[var(--bg-secondary)] p-1.5 rounded-xl border border-[var(--border-color)] self-start sm:self-auto">
              {[
                { id: 'sm', label: 'Aa', sizeClass: 'text-sm' },
                { id: 'md', label: 'Aa', sizeClass: 'text-base' },
                { id: 'lg', label: 'Aa', sizeClass: 'text-lg' }
              ].map(sz => (
                <button
                  key={sz.id}
                  onClick={() => changeFontSize(sz.id)}
                  className={`px-4 py-2 rounded-lg font-bold transition-all duration-300 ${fontSize === sz.id ? 'bg-brand text-white shadow-md' : 'text-[var(--text-secondary)] hover:bg-[var(--glass-border)] hover:text-[var(--text-primary)]'}`}
                  title={`${sz.id === 'sm' ? 'Small' : sz.id === 'md' ? 'Medium' : 'Large'} text size`}
                >
                  <span className={sz.sizeClass}>{sz.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="relative z-10 space-y-4 mt-8">
          <h2 className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-widest px-2 mb-2 flex items-center gap-2 mt-8">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Notifications
          </h2>
          <ToggleSetting
            icon={Bell}
            title="Reminder Notifications"
            desc="Get active alerts for your medication schedule"
            checked={notifications}
            onChange={() => setNotifications(p => !p)}
            colorClass={notifications ? "bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-white" : "bg-gray-500/10 text-gray-500 ring-1 ring-gray-500/20 group-hover:bg-gray-500 group-hover:text-white"}
          />
        </div>
      </div>

      <div className="flex gap-4 p-6 premium-glass rounded-3xl relative overflow-hidden bg-brand/5 border-brand/20 mt-8">
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-brand to-accent"></div>
        <Info className="w-6 h-6 text-brand flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-[var(--text-primary)] mb-1 flex items-center gap-2">
            MediAssist Premium <span className="text-xs bg-brand text-white px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">v2.0</span>
          </h4>
          <p className="text-sm text-[var(--text-secondary)] font-medium leading-relaxed">
            Data is stored securely on encrypted cloud servers. All personalization settings apply exclusively to your configured profile context. Your privacy is paramount.
          </p>
        </div>
      </div>
    </div>
    </div>
  );
}
