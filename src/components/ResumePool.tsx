import { useState, useRef, useEffect } from 'react';
import {
  Trophy, ChevronRight, X, Copy, CheckCircle2,
  MessageSquare, Sparkles, Download, Upload,
  FileText, Loader2, AlertCircle, Users,
  Star, Calendar, ExternalLink, TrendingUp,
  Trash2,
} from 'lucide-react';
import { supabase } from '../supabase';

interface Candidate {
  id: string; name: string; role: string; score: number;
  skills: string[]; summary: string; questions: string[]; fileUrl?: string; deleting?: boolean;
}
type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

export default function ResumePool() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selected, setSelected] = useState<Candidate | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchCandidates() {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('candidates')
        .select('*')
        .order('uploadedAt', { ascending: false });
        
      if (!error && data) {
        setCandidates(data as Candidate[]);
      }
      setIsLoading(false);
    }
    fetchCandidates();
  }, []);

  const deleteCandidate = async (candidate: Candidate) => {
    if (!confirm(`Delete "${candidate.name}"'s resume? This cannot be undone.`)) return;

    setCandidates(prev => prev.map(c => c.id === candidate.id ? { ...c, deleting: true } : c));

    try {
      if (candidate.fileUrl) {
        const segments = candidate.fileUrl.split('/');
        const fileName = segments[segments.length - 1];
        if (fileName) {
          await supabase.storage.from('Resumes').remove([fileName]);
        }
      }

      const { error: dbError } = await supabase
        .from('candidates')
        .delete()
        .eq('id', candidate.id);

      if (dbError) throw dbError;

      setCandidates(prev => prev.filter(c => c.id !== candidate.id));
      if (selected?.id === candidate.id) setSelected(null);
    } catch (err: any) {
      console.error('Delete error:', err);
      alert('Failed to delete resume. Please try again.');
      setCandidates(prev => prev.map(c => c.id === candidate.id ? { ...c, deleting: false } : c));
    }
  };

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const uploadFile = async (file: File) => {
    const allowed = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowed.includes(file.type)) {
      setUploadError('Only PDF or Word (.docx) files are supported.');
      setStatus('error'); return;
    }
    setStatus('uploading'); setProgress(15); setUploadError('');

    try {
      const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      
      const { error: storageError } = await supabase.storage
        .from('Resumes')
        .upload(fileName, file, { cacheControl: '3600', upsert: false });
        
      if (storageError) throw storageError;
      setProgress(50);
      
      const { data: urlData } = supabase.storage
        .from('Resumes')
        .getPublicUrl(fileName);
        
      const url = urlData.publicUrl;
      setProgress(75);

      const name = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      const entry = { name, role: 'Pending Review', score: 0, skills: [], summary: 'Resume uploaded. AI analysis pending.', questions: [], fileUrl: url };
      
      const { data: dbData, error: dbError } = await supabase
        .from('candidates')
        .insert([{ ...entry, fileName: file.name, uploadedAt: new Date().toISOString() }])
        .select()
        .single();
        
      if (dbError) throw dbError;

      const candidateId = dbData.id;

      // Insert into anti_bluff_profiles for Anti-Bluff Engine
      const resumeClaims = [
        `Uploaded resume for ${name}`,
        `Applied for role: Pending Review`,
        `File: ${file.name}`,
      ];
      const githubStats = [
        { name: 'Pending', percentage: 100, color: '#94a3b8', darkColor: '#64748b' },
      ];

      await supabase.from('anti_bluff_profiles').insert([{
        name,
        role: 'Pending Review',
        status: 'verified',
        resumeClaims,
        githubStats,
        analysisText: 'Resume uploaded. AI cross-referencing with GitHub will begin shortly.',
      }]);

      // Insert into jd_analysis for JD Gap Analysis
      const baseSkills = ['Communication', 'Teamwork', 'Problem Solving'];
      const gaps = [
        { id: `${candidateId}-g1`, text: 'AI analysis pending — skills will be extracted from resume.', skill: 'Analysis', icon: '🔍', priority: 'High' as const },
        { id: `${candidateId}-g2`, text: 'Technical skill assessment awaiting processing.', skill: 'Technical Skills', icon: '💻', priority: 'Medium' as const },
      ];

      await supabase.from('jd_analysis').insert([{
        raw_jd: `Resume: ${file.name}\nCandidate: ${name}\n\nThis job description was auto-generated from an uploaded resume. AI will extract requirements and identify skill gaps.`,
        base_skills: baseSkills,
        gaps,
      }]);

      setProgress(100);
      setCandidates(p => [{ ...entry, id: candidateId }, ...p]);
      setStatus('success');
      setTimeout(() => setStatus('idle'), 3000);
      
    } catch (e: any) { 
      setUploadError(e.message || 'Something went wrong.'); 
      setStatus('error'); 
    }
  };

  const scoreColor = (s: number) =>
    s >= 90 ? 'from-emerald-400 to-emerald-500' : s >= 80 ? 'from-indigo-400 to-indigo-500' : 'from-amber-400 to-amber-500';

  const scoreBadge = (s: number) =>
    s >= 90
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
      : s >= 80
        ? 'bg-indigo-50 text-indigo-700 border-indigo-200/80 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20'
        : 'bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20';

  return (
    <div className="flex flex-col h-full gap-6">

      {/* Header */}
      <div className="flex items-center justify-between animate-slide-up">
        <div>
          <h2 className="heading-section text-2xl text-slate-900 dark:text-slate-100">
            Resume Pool <span className="gradient-text">& AI Ranker</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            Upload resumes to Supabase Storage — AI ranks candidates in real-time.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 px-3 py-1.5 rounded-xl">
            <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
            <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">{candidates.length} Candidates</span>
          </div>
          <button className="flex items-center gap-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 font-medium transition-all duration-200 text-sm">
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Upload Zone */}
      <div
        onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={e => { e.preventDefault(); setIsDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) uploadFile(f); }}
        onClick={() => status !== 'uploading' && fileRef.current?.click()}
        className={`animate-slide-up stagger-1 relative rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer border-2 border-dashed transition-all duration-350 overflow-hidden ${
          isDragOver
            ? 'border-indigo-400 bg-indigo-50/80 dark:bg-indigo-500/10 scale-[1.01]'
            : status === 'success'
              ? 'border-emerald-400 bg-emerald-50/60 dark:bg-emerald-500/8'
              : status === 'error'
                ? 'border-rose-400 bg-rose-50/60 dark:bg-rose-500/8'
                : 'border-slate-200 dark:border-white/10 bg-white/60 dark:bg-white/3 hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:bg-indigo-50/40 dark:hover:bg-indigo-500/5'
        }`}
      >
        <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) uploadFile(f); e.target.value = ''; }} />

        {isDragOver && <div className="absolute inset-0 shimmer opacity-20" />}

        {status === 'uploading' ? (
          <>
            <div className="p-4 bg-indigo-100 dark:bg-indigo-500/20 rounded-2xl">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
            <p className="font-semibold text-slate-700 dark:text-slate-300 text-sm">Uploading to Supabase…</p>
            <div className="w-56 bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{progress}%</p>
          </>
        ) : status === 'success' ? (
          <>
            <div className="p-4 bg-emerald-100 dark:bg-emerald-500/20 rounded-2xl">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
            <p className="font-semibold text-emerald-700 dark:text-emerald-400 text-sm">Uploaded successfully!</p>
            <p className="text-xs text-emerald-600/70 dark:text-emerald-500">Saved to Supabase Storage & Database.</p>
          </>
        ) : status === 'error' ? (
          <>
            <div className="p-4 bg-rose-100 dark:bg-rose-500/20 rounded-2xl">
              <AlertCircle className="w-8 h-8 text-rose-500" />
            </div>
            <p className="font-semibold text-rose-600 dark:text-rose-400 text-sm">Upload Failed</p>
            <p className="text-xs text-rose-500 text-center max-w-sm">{uploadError}</p>
          </>
        ) : (
          <>
            <div className={`p-4 rounded-2xl transition-all duration-300 ${isDragOver ? 'bg-indigo-100 dark:bg-indigo-500/30 scale-110' : 'bg-slate-100 dark:bg-white/5'}`}>
              <Upload className={`w-7 h-7 transition-colors ${isDragOver ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`} />
            </div>
            <div className="text-center">
              <p className="font-semibold text-slate-700 dark:text-slate-300 text-sm">
                Drop resume here, or{' '}
                <span className="text-indigo-600 dark:text-indigo-400 underline underline-offset-2">browse files</span>
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">PDF & Word (.docx) supported — Max 10MB</p>
            </div>
          </>
        )}
      </div>

      {/* Table */}
      <div className="animate-slide-up stagger-2 bg-white/80 dark:bg-white/3 backdrop-blur-xl rounded-2xl border border-slate-200/60 dark:border-white/8 shadow-sm overflow-hidden flex-1 transition-colors">
        {isLoading ? (
          <div className="flex items-center justify-center h-full py-24">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
        ) : candidates.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-24 gap-5">
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-500/10 rounded-3xl blur-xl" />
              <div className="relative bg-gradient-to-br from-slate-100 to-indigo-50 dark:from-white/5 dark:to-indigo-500/10 p-7 rounded-3xl border border-slate-200 dark:border-white/10">
                <Users className="w-10 h-10 text-slate-300 dark:text-slate-600" />
              </div>
            </div>
            <div className="text-center">
              <p className="font-semibold text-slate-600 dark:text-slate-400 text-sm">No candidates yet</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 max-w-xs mt-1.5 leading-relaxed">Upload a resume above — it'll appear here instantly with AI scoring.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-white/3 border-b border-slate-100 dark:border-white/6">
                  {['Candidate', 'Role', 'AI Match Score', 'Top Skills', 'Action'].map(h => (
                    <th key={h} className="px-6 py-4 font-semibold text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-[0.08em]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                {candidates.map((c, idx) => (
                  <tr
                    key={c.id}
                    onClick={() => setSelected(c)}
                    style={{ animationDelay: `${idx * 40}ms` }}
                    className="animate-slide-up hover:bg-indigo-50/30 dark:hover:bg-indigo-500/5 cursor-pointer group transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3.5">
                        <div className="relative flex-shrink-0">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-400 via-violet-500 to-cyan-500 text-white flex items-center justify-center font-bold text-sm shadow-md">
                            {c.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          {idx === 0 && candidates.length > 1 && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center">
                              <Trophy className="w-2.5 h-2.5 text-white" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-1.5">{c.name}</div>
                          <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Uploaded recently</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{c.role}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="flex-1 h-1.5 bg-slate-100 dark:bg-white/8 rounded-full overflow-hidden max-w-[100px]">
                          <div className={`h-full rounded-full bg-gradient-to-r ${scoreColor(c.score)}`} style={{ width: `${c.score || 3}%` }} />
                        </div>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg border ${scoreBadge(c.score)}`}>
                          {c.score ? `${c.score}%` : 'Pending'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-slate-500 rounded-lg text-xs border border-slate-200/80 dark:border-white/8">
                        {c.skills?.length > 0 ? c.skills.slice(0, 2).join(', ') : 'Awaiting AI'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={e => { e.stopPropagation(); setSelected(c); }}
                          className="inline-flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 text-xs font-semibold px-3 py-1.5 rounded-xl bg-indigo-50/0 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/15 transition-all"
                        >
                          Analyze <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                        <button
                          disabled={c.deleting}
                          onClick={e => { e.stopPropagation(); deleteCandidate(c); }}
                          className="inline-flex items-center gap-1.5 text-rose-500 dark:text-rose-400 text-xs font-semibold px-2.5 py-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all disabled:opacity-40"
                        >
                          {c.deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Slide-over */}
      {selected && (
        <>
          <div
            className="fixed inset-0 bg-slate-900/30 dark:bg-slate-950/70 backdrop-blur-sm z-40 animate-fade-in"
            onClick={() => setSelected(null)}
          />
          <div className="fixed top-0 right-0 h-full w-full max-w-[460px] bg-white dark:bg-slate-900 shadow-2xl shadow-slate-900/20 z-50 flex flex-col border-l border-slate-200/60 dark:border-white/8 animate-slide-right">

            {/* Panel header */}
            <div className="relative overflow-hidden px-6 py-5 border-b border-slate-100 dark:border-white/8">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/80 via-violet-50/50 to-transparent dark:from-indigo-950/40 dark:via-violet-950/20" />
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-500" />
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-400 via-violet-500 to-cyan-500 text-white flex items-center justify-center font-bold text-base shadow-lg shadow-indigo-500/25">
                    {selected.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="heading-section text-base text-slate-900 dark:text-slate-100">{selected.name}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{selected.role}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-white/8 rounded-xl transition-all"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">

              {/* AI Summary */}
              <div className="relative overflow-hidden bg-gradient-to-br from-indigo-50 to-violet-50/50 dark:from-indigo-900/20 dark:to-violet-900/10 border border-indigo-100 dark:border-indigo-800/30 rounded-2xl p-5">
                <div className="absolute top-0 right-0 w-28 h-28 bg-indigo-500/8 rounded-full blur-2xl" />
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 bg-indigo-100 dark:bg-indigo-500/20 rounded-lg">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <h4 className="font-semibold text-indigo-900 dark:text-indigo-200 text-sm">AI Summary</h4>
                </div>
                <p className="text-sm text-indigo-800/80 dark:text-indigo-300/70 leading-relaxed">{selected.summary}</p>
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Match Score', value: selected.score ? `${selected.score}%` : 'N/A', icon: Star, color: 'text-amber-500' },
                  { label: 'Skills', value: selected.skills?.length || '—', icon: Sparkles, color: 'text-indigo-500' },
                  { label: 'Status', value: 'Uploaded', icon: CheckCircle2, color: 'text-emerald-500' },
                ].map((stat, i) => {
                  const Icon = stat.icon;
                  return (
                    <div key={i} className="bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/8 rounded-xl p-3 text-center">
                      <Icon className={`w-4 h-4 ${stat.color} mx-auto mb-1.5`} />
                      <p className="text-[11px] text-slate-400 dark:text-slate-500">{stat.label}</p>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">{stat.value}</p>
                    </div>
                  );
                })}
              </div>

              {/* File link */}
              {selected.fileUrl && (
                <div className="flex items-center gap-3 bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/8 rounded-xl p-4">
                  <div className="p-2 bg-rose-50 dark:bg-rose-500/10 rounded-lg flex-shrink-0">
                    <FileText className="w-4 h-4 text-rose-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Resume File</p>
                    <p className="text-xs text-slate-400 truncate mt-0.5">{selected.fileUrl}</p>
                  </div>
                  <a href={selected.fileUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1.5 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors flex-shrink-0"
                    onClick={e => e.stopPropagation()}
                  >
                    Open <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {/* Questions */}
              {selected.questions?.length > 0 ? (
                <div>
                  <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-100 dark:border-white/8">
                    <MessageSquare className="w-4 h-4 text-slate-400" />
                    <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">AI Interview Questions</h4>
                    <span className="ml-auto text-[11px] font-semibold bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full">
                      {selected.questions.length}
                    </span>
                  </div>
                  <div className="space-y-2.5">
                    {selected.questions.map((q, i) => (
                      <div key={i} className="group p-4 bg-white dark:bg-white/5 border border-slate-100 dark:border-white/8 rounded-xl hover:border-indigo-200 dark:hover:border-indigo-500/30 hover:shadow-sm transition-all">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                            <span className="font-bold text-indigo-500 mr-1.5">Q{i + 1}.</span>{q}
                          </p>
                          <button onClick={() => handleCopy(q, i)}
                            className="p-1.5 text-slate-300 dark:text-slate-600 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg transition-colors flex-shrink-0">
                            {copiedIdx === i ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center py-10 gap-3">
                  <div className="p-3.5 bg-slate-100 dark:bg-white/5 rounded-2xl">
                    <Sparkles className="w-6 h-6 text-slate-300 dark:text-slate-600" />
                  </div>
                  <p className="text-sm text-slate-400 dark:text-slate-500 text-center leading-relaxed max-w-[220px]">
                    AI analysis will appear here once the resume is processed.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-slate-100 dark:border-white/8 flex gap-3">
              {selected.fileUrl ? (
                <a href={selected.fileUrl} target="_blank" rel="noopener noreferrer"
                  className="flex-1 py-2.5 text-center bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 rounded-xl font-semibold text-sm hover:bg-slate-100 dark:hover:bg-white/8 hover:shadow-sm transition-all flex items-center justify-center gap-2">
                  <FileText className="w-3.5 h-3.5" />
                  View Resume
                </a>
              ) : (
                <button disabled className="flex-1 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-400 rounded-xl font-semibold text-sm opacity-50 cursor-not-allowed">
                  No File
                </button>
              )}
              <button
                onClick={() => deleteCandidate(selected)}
                disabled={selected.deleting}
                className="py-2.5 px-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl font-semibold text-sm hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-40"
              >
                {selected.deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                Delete
              </button>
              <button className="flex-1 py-2.5 btn-primary text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2">
                <Calendar className="w-3.5 h-3.5" />
                Schedule Interview
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
