import { useState, useEffect } from 'react';
import {
  FileText, BrainCircuit, CheckCircle2, Target, Lightbulb, Sparkles,
  Plus, XCircle, Loader2, Database,
} from 'lucide-react';
import { supabase } from '../supabase';

interface JDGap {
  id: string;
  text: string;
  skill: string;
  icon: string;
  priority: 'High' | 'Medium' | 'Low';
}

interface JDAnalysis {
  id: string;
  raw_jd: string;
  base_skills: string[];
  gaps: JDGap[];
}

const priorityStyle: Record<string, string> = {
  High:   'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/20',
  Medium: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/20',
  Low:    'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-400 dark:border-indigo-500/20',
};

export default function JDGapAnalysis() {
  const [analysis, setAnalysis] = useState<JDAnalysis | null>(null);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchJdAnalysis() {
      setIsLoading(true);
      // Fetching the most recent JD analysis from Supabase
      const { data, error } = await supabase
        .from('jd_analysis')
        .select('*')
        .limit(1)
        .single();
        
      if (!error && data) {
        setAnalysis(data as JDAnalysis);
      }
      setIsLoading(false);
    }
    fetchJdAnalysis();
  }, []);

  const toggle = (id: string) =>
    setChecked(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const addedSkills = analysis?.gaps?.filter(g => checked.has(g.id)).map(g => g.skill) || [];
  const acceptedCount = checked.size;
  const totalGaps = analysis?.gaps?.length || 0;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-4 text-center">
        <div className="p-4 bg-slate-100 dark:bg-white/5 rounded-2xl">
          <Database className="w-8 h-8 text-slate-400" />
        </div>
        <div>
          <p className="font-semibold text-slate-700 dark:text-slate-300">No JD Analysis Found</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mt-1">
            Add a row to your "jd_analysis" table in Supabase to see real data here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-6">

      {/* Header */}
      <div className="flex items-start justify-between animate-slide-up">
        <div>
          <h2 className="heading-section text-2xl text-slate-900 dark:text-slate-100">
            JD Gap <span className="gradient-text">Analysis</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            AI analyzes your job description and surfaces missing critical skills.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className={`flex items-center gap-1.5 border px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-300 ${
            acceptedCount > 0
              ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-500/10 dark:border-indigo-500/20 dark:text-indigo-300'
              : 'bg-slate-50 border-slate-200 text-slate-500 dark:bg-white/5 dark:border-white/10 dark:text-slate-400'
          }`}>
            <CheckCircle2 className="w-3.5 h-3.5" />
            {acceptedCount} of {totalGaps} Accepted
          </div>
          <div className="flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 px-3 py-1.5 rounded-xl">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">AI Powered</span>
          </div>
        </div>
      </div>

      {/* Target Skills Banner */}
      <div className="animate-slide-up stagger-1 relative overflow-hidden bg-gradient-to-r from-indigo-50 via-violet-50/60 to-cyan-50/40 dark:from-indigo-900/20 dark:via-violet-900/15 dark:to-cyan-900/10 border border-indigo-100 dark:border-indigo-800/30 rounded-2xl p-5">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-500" />
        <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-start gap-4 relative">
          <div className="bg-white dark:bg-indigo-900/40 p-2.5 rounded-xl shadow-sm border border-indigo-100 dark:border-indigo-700/30 flex-shrink-0">
            <Target className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-indigo-900 dark:text-indigo-100 text-sm">Target Skills Profile</h3>
              <span className="text-[11px] text-indigo-500 dark:text-indigo-400 font-medium">
                {(analysis.base_skills?.length || 0) + addedSkills.length} total skills
              </span>
            </div>
            <p className="text-xs text-indigo-600/70 dark:text-indigo-400/70 mb-3">
              Skills added to screening criteria based on accepted AI gaps.
            </p>
            <div className="flex flex-wrap gap-2">
              {analysis.base_skills?.map(s => (
                <span key={s} className="px-3 py-1 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-700/40 text-indigo-700 dark:text-indigo-400 text-xs font-semibold rounded-full shadow-sm">
                  {s}
                </span>
              ))}
              {addedSkills.map(s => (
                <span key={s} className="px-3 py-1 bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-xs font-bold rounded-full shadow-md shadow-indigo-500/25 animate-pop-in flex items-center gap-1">
                  <Plus className="w-2.5 h-2.5" /> {s}
                </span>
              ))}
              {addedSkills.length === 0 && (
                <span className="px-3 py-1 bg-indigo-100/50 dark:bg-indigo-500/10 text-indigo-400 dark:text-indigo-600 text-xs font-medium rounded-full border border-dashed border-indigo-300 dark:border-indigo-700">
                  Accept gaps below to add skills…
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main two-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 flex-1 min-h-0 animate-slide-up stagger-2">

        {/* Raw JD */}
        <div className="bg-white/80 dark:bg-white/3 backdrop-blur-xl rounded-2xl border border-slate-200/60 dark:border-white/8 shadow-sm flex flex-col overflow-hidden transition-colors">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-white/8 flex items-center gap-2.5 bg-slate-50/80 dark:bg-white/3">
            <div className="p-1.5 bg-slate-200 dark:bg-white/8 rounded-lg">
              <FileText className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            </div>
            <span className="font-semibold text-slate-700 dark:text-slate-300 text-sm">Raw Job Description</span>
            <div className="ml-auto text-[10px] font-semibold bg-slate-200 dark:bg-white/8 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full">
              Live from DB
            </div>
          </div>
          <div className="flex-1 overflow-auto p-6">
            <pre className="font-sans whitespace-pre-wrap text-slate-600 dark:text-slate-400 leading-relaxed text-sm">
              {analysis.raw_jd}
            </pre>
          </div>
        </div>

        {/* AI Gap Detection */}
        <div className="bg-white/80 dark:bg-white/3 backdrop-blur-xl rounded-2xl border border-slate-200/60 dark:border-white/8 shadow-sm flex flex-col overflow-hidden relative transition-colors">
          <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 dark:bg-indigo-500/8 rounded-full blur-3xl pointer-events-none" />

          <div className="px-5 py-4 border-b border-slate-100 dark:border-white/8 flex items-center gap-2.5 bg-slate-50/80 dark:bg-white/3 relative">
            <div className="p-1.5 bg-indigo-100 dark:bg-indigo-500/20 rounded-lg">
              <BrainCircuit className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <span className="font-semibold text-slate-700 dark:text-slate-300 text-sm">AI Gap Detection</span>
            <div className="ml-auto flex items-center gap-1.5 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[11px] font-bold px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
              {totalGaps} Gaps Found
            </div>
          </div>

          <div className="flex-1 overflow-auto p-5 space-y-3 relative z-10">
            {/* Tip */}
            <div className="flex items-start gap-2.5 p-3.5 bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-xl">
              <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                <strong>Tip:</strong> Click any gap to accept it — it'll be instantly added to your Target Skills Profile.
              </p>
            </div>

            {analysis.gaps?.map((gap, idx) => {
              const isChecked = checked.has(gap.id);
              return (
                <div
                  key={gap.id}
                  onClick={() => toggle(gap.id)}
                  style={{ animationDelay: `${idx * 65}ms` }}
                  className={`animate-slide-up group p-4 rounded-2xl border-2 cursor-pointer flex items-start gap-3.5 transition-all duration-300 ${
                    isChecked
                      ? 'border-indigo-400 dark:border-indigo-500 bg-gradient-to-br from-indigo-50 to-violet-50/60 dark:from-indigo-900/20 dark:to-violet-900/10 shadow-md shadow-indigo-100/80 dark:shadow-indigo-900/20'
                      : 'border-slate-100 dark:border-white/8 bg-white dark:bg-white/3 hover:border-indigo-200 dark:hover:border-indigo-700/50 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 hover:-translate-y-0.5'
                  }`}
                >
                  <div className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-base transition-all duration-300 ${
                    isChecked
                      ? 'bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30'
                      : 'bg-slate-100 dark:bg-white/8 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30'
                  }`}>
                    {isChecked ? <CheckCircle2 className="w-4 h-4 text-white" /> : <span>{gap.icon}</span>}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 mb-1.5">
                      <p className={`text-sm font-semibold leading-snug flex-1 transition-colors ${
                        isChecked ? 'text-indigo-900 dark:text-indigo-100' : 'text-slate-700 dark:text-slate-300'
                      }`}>
                        {gap.text}
                      </p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${priorityStyle[gap.priority] || priorityStyle.Low}`}>
                        {gap.priority}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-slate-400 dark:text-slate-500">Adds skill:</span>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full transition-all ${
                        isChecked
                          ? 'bg-indigo-200 dark:bg-indigo-500/30 text-indigo-700 dark:text-indigo-300'
                          : 'bg-slate-100 dark:bg-white/8 text-slate-500 dark:text-slate-400'
                      }`}>
                        {gap.skill}
                      </span>
                    </div>
                  </div>

                  {isChecked && (
                    <button
                      onClick={e => { e.stopPropagation(); toggle(gap.id); }}
                      className="text-indigo-400 dark:text-indigo-500 hover:text-rose-500 transition-colors flex-shrink-0 mt-0.5"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
