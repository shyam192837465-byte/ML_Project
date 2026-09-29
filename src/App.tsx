import { useState, useEffect } from 'react';
import {
  Briefcase, Users, ShieldCheck, Sparkles,
  Search, Moon, Sun, LogOut, ChevronRight,
  LayoutDashboard, Bell, Target,
} from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import JDGapAnalysis from './components/JDGapAnalysis';
import ResumePool from './components/ResumePool';
import AntiBluffEngine from './components/AntiBluffEngine';
import LoginPage from './components/LoginPage';
import JDResumeMatcher from './components/JDResumeMatcher';

type Tab = 'matcher' | 'resume' | 'antibluff' | 'jd';

const NAV_ITEMS = [
  { id: 'matcher',   label: 'JD Match & Rank',    icon: Target,      desc: 'ML matching & ranking',    color: 'from-emerald-500 to-teal-600' },
  { id: 'resume',    label: 'Resume Pool',        icon: Users,       desc: 'Upload & rank candidates', color: 'from-blue-500 to-indigo-600' },
  { id: 'antibluff', label: 'Anti-Bluff Engine',  icon: ShieldCheck, desc: 'Verify resume claims',     color: 'from-violet-500 to-purple-600' },
  { id: 'jd',        label: 'JD Gap Analysis',    icon: Briefcase,   desc: 'Analyze job descriptions', color: 'from-cyan-500 to-blue-600' },
] as const;

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('resume');
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-animated-gradient dark:bg-animated-gradient">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-cyan-500 flex items-center justify-center shadow-2xl shadow-indigo-500/40 animate-glow-pulse">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <div className="absolute -inset-3 border-2 border-dashed border-indigo-400/30 rounded-3xl animate-spin-slow" />
            <div className="absolute -inset-1 bg-indigo-500/20 rounded-3xl blur-xl" />
          </div>
          <div className="text-center">
            <p className="heading-section text-xl text-slate-800 dark:text-white">TalentAI Studio</p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1.5 tracking-wide">Authenticating your session…</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage isDarkMode={isDarkMode} onToggleDarkMode={() => setIsDarkMode(!isDarkMode)} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'matcher':   return <JDResumeMatcher />;
      case 'resume':    return <ResumePool />;
      case 'antibluff': return <AntiBluffEngine />;
      case 'jd':        return <JDGapAnalysis />;
      default:          return <JDResumeMatcher />;
    }
  };

  // Extract display info from Supabase user
  const displayName = user.user_metadata?.full_name
    ?? user.user_metadata?.name
    ?? user.email?.split('@')[0]
    ?? 'Recruiter';

  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const activeItem = NAV_ITEMS.find(i => i.id === activeTab);

  return (
    <div className="flex h-screen bg-animated-gradient transition-colors duration-700 overflow-hidden">

      {/* ── Sidebar ── */}
      <aside className="w-[268px] flex-shrink-0 sidebar-glass flex flex-col z-20 relative overflow-hidden">

        <div className="absolute inset-0 dot-grid opacity-50 pointer-events-none" />
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/6 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Logo */}
        <div className="px-5 py-5 relative">
          <div className="flex items-center gap-3.5">
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 bg-indigo-500/35 rounded-2xl blur-lg animate-glow-pulse" />
              <div className="relative bg-gradient-to-br from-indigo-500 via-violet-500 to-cyan-500 p-2.5 rounded-2xl shadow-xl shadow-indigo-500/30">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
            </div>
            <div>
              <h1 className="heading-section text-[15px] text-slate-900 dark:text-white leading-tight">
                TalentAI <span className="gradient-text">Studio</span>
              </h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse shadow-sm shadow-emerald-400/50" />
                <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium tracking-wide">Live Dashboard</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-5 section-line" />

        <div className="px-5 pt-5 pb-2">
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-[0.15em]">
            Main Menu
          </p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto pb-3">
          {NAV_ITEMS.map((item, idx) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{ animationDelay: `${idx * 70}ms` }}
                className={`animate-slide-up w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-left transition-all duration-300 group relative overflow-hidden ${
                  isActive
                    ? `bg-gradient-to-r ${item.color} text-white nav-active-glow`
                    : 'text-slate-600 dark:text-slate-400 hover:bg-white/70 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {isActive && <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 pointer-events-none rounded-2xl" />}
                <div className={`p-2 rounded-xl flex-shrink-0 transition-all duration-300 ${
                  isActive
                    ? 'bg-white/20 shadow-sm'
                    : 'bg-slate-100 dark:bg-white/5 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/10'
                }`}>
                  <Icon className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-semibold tracking-tight ${isActive ? 'text-white' : ''}`}>{item.label}</div>
                  <div className={`text-[11px] truncate mt-0.5 ${isActive ? 'text-white/70' : 'text-slate-400 dark:text-slate-500'}`}>{item.desc}</div>
                </div>
                <ChevronRight className={`w-3.5 h-3.5 flex-shrink-0 transition-all duration-200 ${
                  isActive ? 'text-white/60' : 'text-slate-300 dark:text-slate-600 group-hover:text-slate-400 group-hover:translate-x-0.5'
                }`} />
              </button>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="px-3 pb-4 space-y-2">
          <div className="mx-2 section-line mb-3" />
          <div className="bg-gradient-to-r from-slate-50 to-indigo-50/50 dark:from-white/5 dark:to-indigo-500/5 border border-slate-200/70 dark:border-white/8 rounded-2xl p-3 flex items-center gap-3">
            <div className="relative flex-shrink-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-400 via-violet-500 to-cyan-500 flex items-center justify-center font-bold text-sm text-white shadow-lg shadow-indigo-500/25">
                {initials}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-white dark:border-navy-900 rounded-full" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate capitalize leading-tight">{displayName}</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{user.email}</p>
            </div>
            <button
              onClick={handleSignOut}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all duration-200 flex-shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 flex flex-col overflow-hidden relative min-w-0">

        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute -top-56 -right-56 w-[500px] h-[500px] bg-indigo-400/6 dark:bg-indigo-500/5 rounded-full blur-[120px]" />
          <div className="absolute top-1/3 -right-32 w-80 h-80 bg-violet-400/5 dark:bg-violet-500/4 rounded-full blur-[100px]" />
          <div className="absolute -bottom-56 -left-32 w-[500px] h-[500px] bg-cyan-400/5 dark:bg-cyan-500/4 rounded-full blur-[120px]" />
        </div>

        {/* Header */}
        <header className="relative z-10 flex-shrink-0 h-[62px] glass border-b border-slate-200/50 dark:border-white/5 flex items-center justify-between px-7 transition-all duration-300">
          <div className="flex items-center gap-2.5 text-sm">
            <LayoutDashboard className="w-4 h-4 text-slate-400 dark:text-slate-500" />
            <span className="text-slate-400 dark:text-slate-600">/</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">{activeItem?.label}</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative group">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search…"
                className="pl-9 pr-4 py-2 bg-white/70 dark:bg-white/5 border border-slate-200/80 dark:border-white/8 text-slate-800 dark:text-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-300 dark:focus:border-indigo-700 transition-all w-44 input-premium"
              />
            </div>

            <button className="relative p-2 rounded-xl bg-white/70 dark:bg-white/5 border border-slate-200/60 dark:border-white/8 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all duration-200">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-indigo-500 rounded-full" />
            </button>

            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-xl bg-white/70 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200/60 dark:border-white/8 transition-all duration-200"
              aria-label="Toggle theme"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <div className="flex items-center gap-2 pl-2 border-l border-slate-200/60 dark:border-white/8">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-400 via-violet-500 to-cyan-500 flex items-center justify-center font-bold text-xs text-white shadow-md cursor-default select-none">
                {initials}
              </div>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300 hidden sm:block capitalize">
                {displayName.split(' ')[0]}
              </span>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto z-10 relative">
          <div key={activeTab} className="min-h-full p-7 animate-slide-up">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
