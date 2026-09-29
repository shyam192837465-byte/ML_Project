import { useState } from 'react';
import {
  Sparkles, Lock, Mail, ArrowRight, Sun, Moon,
  Eye, EyeOff, AlertCircle, Zap, CheckCircle2,
  Users, ShieldCheck, Briefcase,
} from 'lucide-react';
import { supabase } from '../supabase';

interface Props { isDarkMode: boolean; onToggleDarkMode: () => void; }

const getErrorMessage = (error: any) => {
  if (error?.message === 'Email not confirmed') {
    return 'Please check your inbox and confirm your email address before signing in.';
  }
  if (error?.message === 'Invalid login credentials') {
    return 'Invalid email or password.';
  }
  return error?.message || 'Something went wrong. Please try again.';
};

const FEATURES = [
  { icon: Users,       label: 'Resume Pool',        desc: 'Upload and AI-rank every candidate in seconds.' },
  { icon: ShieldCheck, label: 'Anti-Bluff Engine',   desc: 'Cross-verify resumes with public GitHub data.' },
  { icon: Briefcase,   label: 'JD Gap Analysis',     desc: 'Surface missing critical skills in job descriptions.' },
];

export default function LoginPage({ isDarkMode, onToggleDarkMode }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsLoading(true);
    
    try {
      if (mode === 'login') {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw authError;
      } else {
        const { data, error: authError } = await supabase.auth.signUp({ email, password });
        if (authError) throw authError;
        
        // Supabase requires email verification by default. If session is null, verification is needed.
        if (data.user && !data.session) {
          setSuccessMessage('Registration successful! Please check your email to verify your account.');
          setMode('login');
        }
      }
    } catch (e: any) { 
      setError(getErrorMessage(e)); 
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setSuccessMessage('');
    setGoogleLoading(true);
    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({ 
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (authError) throw authError;
    } catch (e: any) {
      setError(getErrorMessage(e));
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-animated-gradient flex overflow-hidden transition-colors duration-700">

      {/* Theme toggle */}
      <button
        onClick={onToggleDarkMode}
        className="fixed top-5 right-5 z-50 p-2.5 rounded-xl glass shadow-lg border border-white/50 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-300 hover:-translate-y-0.5"
      >
        {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>

      {/* ── Left Panel (Feature showcase) ── */}
      <div className="hidden lg:flex lg:w-[52%] xl:w-[55%] relative flex-col justify-between p-12 overflow-hidden">

        {/* Dot grid background */}
        <div className="absolute inset-0 dot-grid opacity-60" />

        {/* Orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-400/20 dark:bg-indigo-600/15 rounded-full blur-[100px] animate-float" />
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-violet-400/15 dark:bg-violet-600/10 rounded-full blur-[120px] animate-float" style={{ animationDelay: '2.5s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-cyan-400/10 dark:bg-cyan-600/8 rounded-full blur-[100px] animate-float" style={{ animationDelay: '4s' }} />
        </div>

        {/* Logo */}
        <div className="relative animate-fade-in">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-500/40 rounded-2xl blur-lg animate-glow-pulse" />
              <div className="relative bg-gradient-to-br from-indigo-500 via-violet-500 to-cyan-500 p-3 rounded-2xl shadow-2xl shadow-indigo-500/30">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
            </div>
            <div>
              <h1 className="heading-section text-xl text-slate-900 dark:text-white">
                TalentAI <span className="gradient-text">Studio</span>
              </h1>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">AI-Powered Recruiting Platform</p>
            </div>
          </div>
        </div>

        {/* Main hero text */}
        <div className="relative space-y-8">
          <div className="animate-slide-up">
            <div className="inline-flex items-center gap-2 bg-indigo-100/80 dark:bg-indigo-500/15 border border-indigo-200/80 dark:border-indigo-500/25 text-indigo-700 dark:text-indigo-300 text-xs font-semibold px-3 py-1.5 rounded-full mb-5 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
              Next-Gen AI Recruitment
            </div>
            <h2 className="heading-display text-4xl xl:text-5xl text-slate-900 dark:text-white leading-tight">
              Hire smarter.<br />
              <span className="gradient-text">Verify faster.</span><br />
              Build better teams.
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mt-5 text-base leading-relaxed max-w-md">
              The intelligent recruiting dashboard that analyzes candidates, detects resume bluffing, and surfaces skill gaps — all in real-time.
            </p>
          </div>

          {/* Feature cards */}
          <div className="space-y-3 animate-slide-up stagger-2">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={i}
                  className="flex items-center gap-4 glass-card rounded-2xl px-5 py-4 card-hover"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className="p-2.5 bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-500/20 dark:to-violet-500/20 rounded-xl flex-shrink-0">
                    <Icon className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{f.label}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{f.desc}</p>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer quote */}
        <div className="relative animate-fade-in">
          <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-2">
            <span className="w-8 h-px bg-slate-300 dark:bg-slate-600" />
            Trusted by recruiting teams worldwide
          </p>
        </div>
      </div>

      {/* ── Right Panel (Auth form) ── */}
      <div className="flex-1 flex items-center justify-center p-6 relative">

        {/* Card glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-400/10 dark:bg-indigo-500/8 rounded-full blur-[80px]" />
        </div>

        <div className="w-full max-w-[400px] relative z-10 animate-pop-in">

          {/* Card outer glow */}
          <div className="absolute -inset-1.5 bg-gradient-to-br from-indigo-400/20 via-violet-400/15 to-cyan-400/10 rounded-[28px] blur-xl" />

          <div className="relative bg-white/90 dark:bg-navy-900/90 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-slate-900/12 dark:shadow-slate-950/70 overflow-hidden border border-white/60 dark:border-white/6">

            {/* Top gradient bar */}
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-500" />

            <div className="p-8">
              {/* Mobile logo */}
              <div className="flex lg:hidden items-center gap-2.5 mb-7">
                <div className="bg-gradient-to-br from-indigo-500 to-violet-600 p-2 rounded-xl">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="heading-section text-base text-slate-900 dark:text-white">TalentAI Studio</span>
              </div>

              {/* Heading */}
              <div className="mb-7">
                <h2 className="heading-section text-2xl text-slate-900 dark:text-white">
                  {mode === 'login' ? 'Welcome back' : 'Get started'}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
                  {mode === 'login'
                    ? 'Sign in to your recruiter dashboard'
                    : 'Create your free recruiter account'}
                </p>
              </div>

              {/* Mode toggle */}
              <div className="flex bg-slate-100/90 dark:bg-white/5 rounded-2xl p-1 mb-6 gap-1">
                {(['login', 'register'] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => { setMode(m); setError(''); setSuccessMessage(''); }}
                    className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 ${
                      mode === m
                        ? 'bg-white dark:bg-white/10 text-indigo-600 dark:text-indigo-300 shadow-md'
                        : 'text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    {m === 'login' ? 'Sign In' : 'Sign Up'}
                  </button>
                ))}
              </div>

              {/* Google button */}
              <button
                onClick={handleGoogle}
                disabled={isLoading || googleLoading}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white dark:bg-white/8 border border-slate-200 dark:border-white/10 rounded-2xl font-semibold text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/12 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all duration-250 disabled:opacity-50 disabled:cursor-not-allowed mb-5"
              >
                {googleLoading ? (
                  <div className="w-5 h-5 border-2 border-slate-300 border-t-indigo-500 rounded-full animate-spin" />
                ) : (
                  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                )}
                <span>Continue with Google</span>
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent to-slate-200 dark:to-white/10" />
                <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium px-1">or continue with email</span>
                <div className="flex-1 h-px bg-gradient-to-l from-transparent to-slate-200 dark:to-white/10" />
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email */}
                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-xs font-semibold text-slate-600 dark:text-slate-400 tracking-wide">
                    Email address
                  </label>
                  <div className="relative group">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                      id="email" type="email" value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@company.com" required
                      className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-xl py-3 pl-10 pr-4 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-400 dark:focus:border-indigo-600 transition-all input-premium"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label htmlFor="password" className="text-xs font-semibold text-slate-600 dark:text-slate-400 tracking-wide">
                    Password
                  </label>
                  <div className="relative group">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                      id="password" type={showPassword ? 'text' : 'password'}
                      value={password} onChange={e => setPassword(e.target.value)}
                      placeholder={mode === 'register' ? 'Min. 6 characters' : '••••••••'} required
                      className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-xl py-3 pl-10 pr-11 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-400 dark:focus:border-indigo-600 transition-all input-premium"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Success Message */}
                {successMessage && (
                  <div className="flex items-start gap-2.5 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl p-3 text-sm text-emerald-600 dark:text-emerald-400 animate-slide-up">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{successMessage}</span>
                  </div>
                )}

                {/* Error */}
                {error && (
                  <div className="flex items-start gap-2.5 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl p-3 text-sm text-rose-600 dark:text-rose-400 animate-slide-up">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit" disabled={isLoading || googleLoading}
                  className="w-full relative overflow-hidden btn-primary text-white font-semibold py-3.5 rounded-2xl disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 group mt-1 text-sm"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/8 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 pointer-events-none" />
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      {mode === 'login' ? 'Sign In to Dashboard' : 'Create Account'}
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>

              {/* Footer */}
              <p className="mt-6 text-center text-[11px] text-slate-400 dark:text-slate-600">
                Secured with Supabase Auth
                {' · '}
                <span className="text-indigo-500 hover:underline cursor-pointer">Privacy Policy</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
