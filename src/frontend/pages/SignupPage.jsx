import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Pill, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    if (password.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }
    setLoading(true);
    try {
      await signup(email, password, name);
      navigate('/dashboard');
      toast.success('Account created successfully!');
    } catch (err) {
      toast.error(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-glow-effect px-4 py-12">
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-brand/5 via-transparent to-accent/5 pointer-events-none"></div>
      
      <div className="w-full max-w-md premium-glass rounded-3xl p-8 md:p-10 z-10 animate-fade-in relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="relative">
          <div className="flex flex-col items-center mb-10">
            <div className="p-4 bg-gradient-to-br from-brand-light to-brand-dark rounded-2xl mb-6 shadow-xl shadow-brand/30 ring-1 ring-white/20">
              <Pill className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">Create Account</h1>
            <p className="text-[var(--text-secondary)] text-sm mt-3 font-medium">Join MediAssist today</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-[var(--text-primary)]">Full Name</label>
              <div className="relative group">
                <User className="absolute left-4 top-3.5 w-5 h-5 text-[var(--text-secondary)] group-focus-within:text-brand transition-colors" />
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
                  className="input-premium pl-12"
                  placeholder="John Doe" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-[var(--text-primary)]">Email</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-3.5 w-5 h-5 text-[var(--text-secondary)] group-focus-within:text-brand transition-colors" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                  className="input-premium pl-12"
                  placeholder="you@example.com" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-[var(--text-primary)]">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-3.5 w-5 h-5 text-[var(--text-secondary)] group-focus-within:text-brand transition-colors" />
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required
                  className="input-premium pl-12 pr-12"
                  placeholder="Min. 6 characters" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-3.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] focus:outline-none transition-colors">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full btn-premium py-3.5 mt-8 disabled:opacity-70 disabled:cursor-not-allowed font-bold tracking-wide">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-[var(--text-secondary)] mt-8 font-medium">
            Already have an account?{' '}
            <Link to="/login" className="text-brand font-bold hover:text-brand-dark hover:underline transition-colors">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
