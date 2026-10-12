
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Activity,
  Scan,
  Heart,
  Languages,
  Bell,
  Volume2,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen relative bg-glow-effect text-[var(--text-primary)]"
      style={{
        backgroundImage: "url('/medicine-bg-landingpage.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Dark overlay */}
      <div className="fixed inset-0 bg-slate-950/65 pointer-events-none" />

      {/* Page content */}
      <div className="relative z-10">
        {/* Navigation */}
        <nav className="fixed top-0 left-0 right-0 z-50 premium-glass rounded-none border-x-0 border-t-0 px-6 py-4 flex justify-between items-center backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-brand to-accent rounded-xl text-white shadow-lg shadow-brand/20">
              <Activity className="w-6 h-6" />
            </div>
            <span className="font-extrabold text-xl tracking-tight hidden sm:block">
              MedAssist V2
            </span>
          </div>

          <div>
            {currentUser ? (
              <Link
                to="/dashboard"
                className="btn-premium flex items-center gap-2 px-6"
              >
                Go to Dashboard <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <div className="flex items-center gap-4">
                <Link
                  to="/login"
                  className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-bold transition-colors"
                >
                  Log in
                </Link>
                <Link to="/signup" className="btn-premium">
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </nav>

        {/* Hero Section */}
        <section className="pt-32 pb-20 px-6 sm:px-12 max-w-7xl mx-auto flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full premium-glass text-sm font-semibold text-brand mb-8 animate-fade-in custom-pulse">
            <ShieldCheck className="w-4 h-4" />
            Trusted Medical Companion
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight leading-tight">
            Smarter Care with <br />
            <span className="text-gradient">
              Intelligent Medication
            </span>
          </h1>

          <p className="text-lg md:text-xl text-[var(--text-secondary)] max-w-3xl mb-12 animate-fade-in animation-delay-2000 leading-relaxed font-medium">
            Upload or scan barcodes to instantly access medication facts
            in your native language. An inclusive platform designed for
            everyone, complete with voice playback and automated reminders.
          </p>

          {/* Call to action */}
          {currentUser ? (
            <button
              onClick={() => navigate('/dashboard')}
              className="group btn-premium text-lg py-4 px-10 shadow-xl shadow-brand/30 hover:scale-105 flex items-center gap-3 font-bold"
            >
              Access Your MedAssist
              <ArrowRight className="group-hover:translate-x-1 transition-transform w-5 h-5" />
            </button>
          ) : (
            <div className="flex gap-4">
              <Link
                to="/signup"
                className="group btn-premium text-lg py-4 px-10 shadow-xl shadow-brand/30 hover:scale-105 flex items-center gap-3 font-bold"
              >
                Get Started
                <ArrowRight className="group-hover:translate-x-1 transition-transform w-5 h-5" />
              </Link>
            </div>
          )}
        </section>

        {/* Features Grid */}
        <section className="py-24 px-6 md:px-12 bg-slate-950/30 border-y border-[var(--glass-border)]">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-extrabold mb-4">
                Empowering Features
              </h2>
              <p className="text-[var(--text-secondary)] font-medium max-w-2xl mx-auto">
                Discover the powerful toolkit built into MedAssist to
                ensure safety and convenience.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <FeatureCard
                icon={<Scan />}
                title="Barcode Upload & Scan"
                description="Simply snap a photo or scan the medication barcode to retrieve instant, detailed drug information from our securely managed database."
              />

              <FeatureCard
                icon={<Languages />}
                title="Multi-Language Support"
                description="Break the language barrier. View detailed medicine instructions and interactions in English, Hindi, and Marathi instantly."
              />

              <FeatureCard
                icon={<Volume2 />}
                title="Voice Assistant"
                description="A lifesaver for the elderly and visually impaired. Tap to hear medication details read aloud in your preferred language."
              />

              <FeatureCard
                icon={<Bell />}
                title="Smart Reminders"
                description="Never miss a dose again. Set customized medication schedules and receive timely push notifications with voice alerts."
              />

              <FeatureCard
                icon={<Heart />}
                title="Health History Tracking"
                description="Automatically log scanned medicines. Review your past medication scans to discuss thoroughly with your healthcare provider."
              />

              <FeatureCard
                icon={<ShieldCheck />}
                title="Admin Verified Database"
                description="All medication data is reviewed and entered by authorized administrators to ensure complete safety and accuracy."
              />
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 border-t border-[var(--glass-border)] text-center text-sm text-[var(--text-secondary)] font-medium">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-brand" />
            <span className="font-bold text-[var(--text-primary)]">
              MedAssist
            </span>
          </div>
          <p>© 2026 MedAssist Platform. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="premium-glass p-8 group hover:-translate-y-2 transition-all duration-300">
      <div className="w-14 h-14 bg-gradient-to-br from-brand/20 to-accent/20 rounded-2xl flex items-center justify-center text-brand mb-6 group-hover:scale-110 transition-transform">
        {React.cloneElement(icon, { className: 'w-7 h-7' })}
      </div>

      <h3 className="text-xl font-bold mb-3 tracking-tight">
        {title}
      </h3>

      <p className="text-[var(--text-secondary)] leading-relaxed font-medium text-sm">
        {description}
      </p>
    </div>
  );
}
