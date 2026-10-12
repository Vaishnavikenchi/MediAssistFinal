import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home, Search, Camera, Bell, Clock, User, Settings, LogOut, Pill, Shield, MapPin } from 'lucide-react';
import NotificationBell from '../components/NotificationBell';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/dashboard', icon: Home,     label: 'Dashboard'    },
  { to: '/search',    icon: Search,   label: 'Search'       },
  { to: '/pharmacies',icon: MapPin,   label: 'Nearby Shops' },
  { to: '/scanner',   icon: Camera,   label: 'Scan'         },
  { to: '/reminders', icon: Bell,     label: 'Reminders'    },
  { to: '/history',   icon: Clock,    label: 'History'      },
  { to: '/profile',   icon: User,     label: 'Profile'      },
  { to: '/settings',  icon: Settings, label: 'Settings'     },
];

export default function MainLayout() {
  const { logout, currentUser, isAdmin } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await logout();
      navigate('/login');
      toast.success('Logged out successfully');
    } catch {
      toast.error('Failed to log out');
    }
  }

  return (
    <div className="flex h-screen w-full bg-transparent overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 flex flex-col m-4 mr-0 rounded-2xl premium-glass z-10 transition-all duration-300">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-[var(--border-color)]">
          <div className="p-2.5 bg-gradient-to-br from-brand-light to-brand-dark rounded-xl shadow-lg shadow-brand/30">
            <Pill className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-gradient">MediAssist</span>
        </div>

        {/* User Info + Notification Bell */}
        <div className="px-5 py-4 border-b border-[var(--border-color)] flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-bold truncate text-[var(--text-primary)]">
              {currentUser?.displayName || 'User'}
              {isAdmin && <span className="ml-2 text-[10px] px-1.5 py-0.5 bg-fuchsia-500/20 text-fuchsia-500 font-extrabold rounded-full uppercase tracking-wider">Admin</span>}
            </p>
            <p className="text-xs text-[var(--text-secondary)] truncate mt-0.5">{currentUser?.email}</p>
          </div>
          {/* Notification Bell (for users only) */}
          {!isAdmin && <NotificationBell />}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto custom-scrollbar">
          {/* Admin link */}
          {isAdmin && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 text-sm font-bold mb-2 ${
                  isActive
                    ? 'bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white shadow-lg translate-x-1'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--glass-border)] hover:text-violet-500 hover:translate-x-1'
                }`
              }
            >
              <Shield className="w-5 h-5" />
              Admin Dashboard
            </NavLink>
          )}

          {/* Standard User Links - Available to everyone including admins */}
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 text-sm font-medium ${
                  isActive
                    ? 'bg-gradient-to-r from-brand to-brand-dark text-white shadow-lg shadow-brand/20 translate-x-1'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--glass-border)] hover:text-[var(--text-primary)] hover:translate-x-1'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--border-color)] space-y-1 flex-shrink-0">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-500/10 transition-all duration-300"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 z-0">
        <div className="max-w-7xl mx-auto w-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
