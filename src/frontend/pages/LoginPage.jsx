import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Pill, Mail, Lock, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
      toast.success('Welcome back!');
    } catch (err) {
      toast.error('Invalid email or password');
    } finally {
      setLoading(false);
    }
  }

  return (
   
<div
  className="min-h-screen flex items-center justify-center px-4 py-12 relative"
  style={{
    backgroundImage: "url('/medicine-bg.jpg')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
  }}
>

      <div className="absolute inset-0 z-0 bg-gradient-to-br from-brand/5 via-transparent to-accent/5 pointer-events-none"></div>
      
      

<div className="w-full max-w-md bg-violet-200/90 border border-violet-300/60 rounded-3xl p-8 md:p-10 z-10 animate-fade-in relative shadow-2xl">


        <div className="absolute top-0 right-0 w-32 h-32 bg-brand/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="relative">
          <div className="flex flex-col items-center mb-10">
            <div className="p-4 bg-gradient-to-br from-brand-light to-brand-dark rounded-2xl mb-6 shadow-xl shadow-brand/30 ring-1 ring-white/20">
              <Pill className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Welcome back</h1>
            <p className="text-slate-700 text-sm mt-3 font-medium">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-900">Email</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-3.5 w-5 h-5 text-[var(--text-secondary)] group-focus-within:text-brand transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="input-premium pl-12"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-semibold text-slate-900">Password</label>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-3.5 w-5 h-5 text-[var(--text-secondary)] group-focus-within:text-brand transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="input-premium pl-12 pr-12"
                  placeholder="••••••••"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)} 
                  className="absolute right-4 top-3.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] focus:outline-none transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            
                 <button
  type="submit"
  disabled={loading}
  className="w-full bg-violet-700 hover:bg-violet-800 text-white rounded-xl py-3.5 mt-8 shadow-lg shadow-violet-500/30 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed font-bold tracking-wide"
>

              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          
<p className="text-center text-sm text-slate-700 mt-8 font-medium">
  Don't have an account?{' '}
  <Link
    to="/signup"
    className="text-violet-800 font-extrabold hover:text-violet-950 hover:underline transition-colors"
  >
    Create an account
  </Link>
</p>

        </div>
      </div>
    </div>
  );
}
