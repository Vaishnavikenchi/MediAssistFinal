import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';

// Layouts
import MainLayout from './layouts/MainLayout';

// Pages
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import Dashboard from './pages/Dashboard';
import SearchMedicine from './pages/SearchMedicine';
import ScannerPage from './pages/ScannerPage';
import MedicineDetail from './pages/MedicineDetail';
import RemindersPage from './pages/RemindersPage';
import AddReminder from './pages/AddReminder';
import HistoryPage from './pages/HistoryPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import AdminDashboard from './pages/AdminDashboard';
import LandingPage from './pages/LandingPage';
import NearbyPharmacies from './pages/NearbyPharmacies';
import UploadPrescription from './pages/UploadPrescription';

// Components
import ProtectedRoute from './components/ProtectedRoute';
import NotificationManager from './components/NotificationManager';
import FontSizeAdjuster from './components/FontSizeAdjuster';

import { FontSizeProvider } from './context/FontSizeContext';
import OfflineBanner from './components/OfflineBanner';

// Admin route guard — redirects non-admins back to dashboard
function AdminRoute({ children }) {
  const { isAdmin } = useAuth();
  return isAdmin ? children : <Navigate to="/dashboard" replace />;
}

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <FontSizeProvider>
            <Router>
              <div className="min-h-screen bg-glow-effect flex flex-col relative w-full overflow-hidden">
                <OfflineBanner />
                <Toaster
                  position="top-right"
                  toastOptions={{
                    duration: 4000,
                    style: {
                      background: 'var(--glass-bg)',
                      color: 'var(--text-primary)',
                      backdropFilter: 'blur(12px)',
                      border: '1px solid var(--glass-border)',
                    },
                  }}
                />

                <NotificationManager />
                <FontSizeAdjuster />

                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/signup" element={<SignupPage />} />

                  {/* Protected Routes */}
                  <Route element={<ProtectedRoute />}>
                    <Route element={<MainLayout />}>
                      {/* User routes */}
                      <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/search" element={<SearchMedicine />} />
                    <Route path="/pharmacies" element={<NearbyPharmacies />} />
                    <Route path="/scanner" element={<ScannerPage />} />
                    <Route path="/prescription" element={<UploadPrescription />} />
                    <Route path="/medicine/:id" element={<MedicineDetail />} />
                    <Route path="/reminders" element={<RemindersPage />} />
                    <Route path="/reminders/add" element={<AddReminder />} />
                    <Route path="/history" element={<HistoryPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/settings" element={<SettingsPage />} />

                    {/* Admin-only route */}
                    <Route path="/admin" element={
                      <AdminRoute><AdminDashboard /></AdminRoute>
                    } />
                  </Route>
                </Route>
              </Routes>
            </div>
          </Router>
          </FontSizeProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;