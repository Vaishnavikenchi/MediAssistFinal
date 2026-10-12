import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showOnlineMsg, setShowOnlineMsg] = useState(false);

  useEffect(() => {
    const handleOffline = () => {
      setIsOffline(true);
      setShowOnlineMsg(false);
    };

    const handleOnline = () => {
      setIsOffline(false);
      setShowOnlineMsg(true);
      // Auto-hide the "back online" message after 3 seconds
      const timer = setTimeout(() => setShowOnlineMsg(false), 3000);
      return () => clearTimeout(timer);
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  if (!isOffline && !showOnlineMsg) return null;

  return (
    <div 
      className={`w-full text-center py-2 px-4 shadow-md z-50 flex items-center justify-center gap-2 text-sm font-bold transition-all duration-300 ${
        isOffline ? 'bg-amber-500/90 text-white backdrop-blur-sm' : 'bg-emerald-500/90 text-white backdrop-blur-sm'
      }`}
    >
      {isOffline ? (
        <>
          <WifiOff className="w-4 h-4 animate-pulse" />
          <span>You are offline. Data will be saved locally.</span>
        </>
      ) : (
        <>
          <Wifi className="w-4 h-4" />
          <span>You are back online</span>
        </>
      )}
    </div>
  );
}
