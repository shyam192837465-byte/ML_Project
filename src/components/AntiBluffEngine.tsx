import { useState, useEffect } from 'react';
import {
  ShieldAlert, ShieldCheck, Terminal, FileText,
  AlertTriangle, Code2, CheckCircle, Activity,
  Search, Loader2, Users,
} from 'lucide-react';
import { supabase } from '../supabase';

interface LanguageStat { name: string; percentage: number; color: string; darkColor: string; }
interface AntiBluffProfile {
  id: string; name: string; role: string;
  status: 'verified' | 'discrepancy';
  resumeClaims: string[];
  githubStats: LanguageStat[];
  analysisText: string;
}

export default function AntiBluffEngine() {
  const [profiles, setProfiles] = useState<AntiBluffProfile[]>([]);
  const [selected, setSelected] = useState<AntiBluffProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchProfiles() {
      setIsLoading(true);
      // Fetching from a dedicated anti_bluff_profiles table
      const { data, error } = await supabase
        .from('anti_bluff_profiles')
        .select('*');
        
      if (!error && data) {
        setProfiles(data as AntiBluffProfile[]);
        if (data.length > 0) setSelected(data[0] as AntiBluffProfile);
      }
      setIsLoading(false);
    }
    fetchProfiles();
  }, []);

  const filteredProfiles = profiles.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const verifiedCount = profiles.filter(p => p.status === 'verified').length;
  const flaggedCount = profiles.filter(p => p.status === 'discrepancy').length;

  return (
    <div className="flex flex-col h-full gap-6">

      {/* Header */}
      <div className="flex items-start justify-between animate-slide-up">
        <div>
          <h2 className="heading-section text-2xl text-slate-900 dark:text-slate-100">
            Anti-Bluff <span className="gradient-text">Portfolio Engine</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            AI cross-references resume claims with public GitHub repositories in real-time.
          </p>
        </div>
        {/* Summary chips */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-3 py-1.5 rounded-xl">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">{verifiedCount} Verified</span>
          </div>
          <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-1.5 rounded-xl">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">{flaggedCount} Flagged</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 flex-1 min-h-0">

        {/* Left: Profile Cards */}
        <div className="xl:col-span-1 space-y-2.5 overflow-y-auto pb-2 flex flex-col">
          {/* Search box */}
          <div className="relative mb-3 flex-shrink-0">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search profiles…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white/80 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 rounded-xl text-sm placeholder:text-slate-400 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 transition-all input-premium"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
              </div>
            ) : filteredProfiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
                <div className="p-3 bg-slate-100 dark:bg-white/5 rounded-xl">
                  <Users className="w-5 h-5 text-slate-400" />
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">No profiles found.</p>
              </div>
            ) : (
              filteredProfiles.map((p, idx) => {
                const isActive = selected?.id === p.id;
                const isVerified = p.status === 'verified';
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelected(p)}
                    style={{ animationDelay: `${idx * 60}ms` }}
                    className={`animate-slide-up p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${
                      isActive
                        ? 'border-indigo-400 dark:border-indigo-500 bg-gradient-to-br from-indigo-50 to-violet-50/60 dark:from-indigo-900/20 dark:to-violet-900/10 shadow-lg shadow-indigo-100 dark:shadow-indigo-900/20'
                        : 'border-slate-100 dark:border-white/8 bg-white/80 dark:bg-white/3 hover:border-indigo-200 dark:hover:border-indigo-800 hover:-translate-y-0.5'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs text-white flex-shrink-0 shadow-sm ${
                          isActive
                            ? 'bg-gradient-to-br from-indigo-500 to-violet-600'
                            : 'bg-gradient-to-br from-slate-300 to-slate-400 dark:from-slate-600 dark:to-slate-700'
                        }`}>
                          {p.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <h3 className={`font-semibold text-sm leading-tight ${isActive ? 'text-indigo-900 dark:text-indigo-100' : 'text-slate-800 dark:text-slate-200'}`}>
                            {p.name}
                          </h3>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{p.role}</p>
                        </div>
                      </div>
                      {isVerified ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-500/20 px-2 py-1 rounded-full border border-emerald-200 dark:border-emerald-500/30 flex-shrink-0 ml-2">
                          <ShieldCheck className="w-2.5 h-2.5" /> OK
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-500/20 px-2 py-1 rounded-full border border-amber-200 dark:border-amber-500/30 flex-shrink-0 ml-2">
                          <AlertTriangle className="w-2.5 h-2.5" /> FLAG
                        </span>
                      )}
                    </div>

                    {/* Mini language bar */}
                    <div className="flex h-1.5 rounded-full overflow-hidden gap-0.5">
                      {p.githubStats?.map((s, i) => (
                        <div
                          key={i}
                          className="rounded-full h-full transition-all"
                          style={{ width: `${s.percentage}%`, backgroundColor: s.color }}
                          title={`${s.name}: ${s.percentage}%`}
                        />
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Detail panel */}
        <div className="xl:col-span-2 bg-white/80 dark:bg-white/3 backdrop-blur-xl rounded-2xl border border-slate-200/60 dark:border-white/8 shadow-sm flex flex-col overflow-hidden animate-slide-up stagger-2">
          {!selected ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500">
              <ShieldAlert className="w-12 h-12 mb-4 opacity-50" />
              <p>Select a profile to view analysis</p>
            </div>
          ) : (
            <>
              {/* Panel header */}
              <div className="relative overflow-hidden px-6 py-5 border-b border-slate-100 dark:border-white/8 flex items-center justify-between">
                <div className={`absolute inset-0 ${
                  selected.status === 'verified'
                    ? 'bg-gradient-to-r from-emerald-50/80 to-transparent dark:from-emerald-950/20'
                    : 'bg-gradient-to-r from-amber-50/80 to-transparent dark:from-amber-950/20'
                }`} />
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-500" />

                <div className="relative">
                  <h3 className="heading-section text-base text-slate-900 dark:text-slate-100">{selected.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{selected.role}</p>
                </div>

                <div className={`relative flex items-center gap-2 px-4 py-2 rounded-xl border font-semibold text-xs ${
                  selected.status === 'discrepancy'
                    ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30'
                    : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30'
                }`}>
                  {selected.status === 'discrepancy'
                    ? <><ShieldAlert className="w-3.5 h-3.5" /> Discrepancy Detected</>
                    : <><ShieldCheck className="w-3.5 h-3.5" /> Claims Verified</>}
                </div>
              </div>

              {/* Body */}
              <div className="flex-1 grid grid-cols-2 divide-x divide-slate-100 dark:divide-white/6 overflow-y-auto">

                {/* Claims */}
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-5">
                    <div className="p-1.5 bg-slate-100 dark:bg-white/5 rounded-lg">
                      <FileText className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                    </div>
                    <h4 className="font-semibold text-slate-700 dark:text-slate-300 text-sm">Resume Claims</h4>
                  </div>
                  <ul className="space-y-2.5">
                    {selected.resumeClaims?.map((c, i) => (
                      <li
                        key={i}
                        className="flex gap-3 items-start p-3.5 bg-slate-50 dark:bg-white/3 rounded-xl border border-slate-100 dark:border-white/6 animate-slide-up"
                        style={{ animationDelay: `${i * 60}ms` }}
                      >
                        <div className="mt-0.5 p-1 bg-indigo-100 dark:bg-indigo-500/20 rounded-md flex-shrink-0">
                          <CheckCircle className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <span className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* GitHub reality */}
                <div className="p-6 bg-slate-50/50 dark:bg-white/2">
                  <div className="flex items-center gap-2 mb-5">
                    <div className="p-1.5 bg-slate-100 dark:bg-white/5 rounded-lg">
                      <Terminal className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                    </div>
                    <h4 className="font-semibold text-slate-700 dark:text-slate-300 text-sm">GitHub Reality</h4>
                  </div>

                  {/* Chart panel */}
                  <div className="bg-white dark:bg-white/5 rounded-2xl border border-slate-200/60 dark:border-white/8 shadow-sm p-5 mb-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Activity className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Public Code Distribution</span>
                    </div>

                    {/* Stacked bar */}
                    <div className="flex h-2.5 rounded-full overflow-hidden gap-0.5 mb-4">
                      {selected.githubStats?.map((s, i) => (
                        <div
                          key={i}
                          className="h-full rounded-full bar-grow"
                          style={{ width: `${s.percentage}%`, backgroundColor: s.color, '--bar-width': `${s.percentage}%` } as React.CSSProperties}
                          title={`${s.name}: ${s.percentage}%`}
                        />
                      ))}
                    </div>

                    {/* Legend */}
                    <div className="grid grid-cols-2 gap-2">
                      {selected.githubStats?.map((s, i) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                            <span className="text-slate-600 dark:text-slate-400">{s.name}</span>
                          </div>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{s.percentage}%</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* AI analysis summary */}
                  <div className={`p-4 rounded-xl border text-sm leading-relaxed ${
                    selected.status === 'discrepancy'
                      ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-900 dark:text-amber-200'
                      : 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-900 dark:text-emerald-200'
                  }`}>
                    <div className="flex items-center gap-1.5 mb-2">
                      <Code2 className="w-3.5 h-3.5 opacity-70" />
                      <p className="font-bold text-[11px] uppercase tracking-wider opacity-70">AI Analysis</p>
                    </div>
                    {selected.analysisText}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
