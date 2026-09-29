import { useState, useEffect } from 'react';
import {
  Sparkles, BrainCircuit, Award, Sliders, FileText, ArrowRight,
  Database, RefreshCw, Zap, X, Check, Cpu, HelpCircle, Loader2
} from 'lucide-react';
import { supabase } from '../supabase';
import {
  extractSkills,
  matchJDAndResume,
  SAMPLE_JOB_DESCRIPTIONS,
  type MatchBreakdown,
} from '../utils/matchingEngine';

interface Candidate {
  id: string;
  name: string;
  role: string;
  score: number;
  skills: string[];
  summary: string;
  questions: string[];
  fileUrl?: string;
}

interface RankedCandidate extends Candidate {
  matchBreakdown: MatchBreakdown;
  rank: number;
}

// Fallback demo candidates if database has no entries yet
const MOCK_FALLBACK_CANDIDATES: Candidate[] = [
  {
    id: 'mock-1',
    name: 'Aarav Sharma',
    role: 'Senior ML Engineer',
    score: 0,
    skills: ['Python', 'PyTorch', 'HuggingFace', 'Transformers', 'FastAPI', 'Docker', 'PostgreSQL', 'NLP'],
    summary: '4+ years fine-tuning transformers (BERT, Llama) with PyTorch, building vector search with pgvector, and deploying low-latency FastAPI inference services on Docker.',
    questions: []
  },
  {
    id: 'mock-2',
    name: 'Vikram Patel',
    role: 'Senior Full-Stack Engineer',
    score: 0,
    skills: ['React', 'TypeScript', 'Node.js', 'Express', 'PostgreSQL', 'Tailwind CSS', 'Docker', 'GraphQL'],
    summary: '5 years building web applications with React 18, TypeScript, and Node.js. Designed PostgreSQL databases and containerized services with Docker.',
    questions: []
  },
  {
    id: 'mock-3',
    name: 'Priya Nair',
    role: 'Data Scientist & ML Practitioner',
    score: 0,
    skills: ['Python', 'TensorFlow', 'Scikit-learn', 'Docker', 'FastAPI', 'Pandas', 'SQL'],
    summary: '3.5 years predictive analytics using Python, TensorFlow, and Scikit-learn. Deployed prediction microservices with FastAPI and Docker.',
    questions: []
  },
  {
    id: 'mock-4',
    name: 'Rahul Verma',
    role: 'Senior DevOps & SRE Engineer',
    score: 0,
    skills: ['Kubernetes', 'Docker', 'AWS', 'Terraform', 'CI/CD', 'Linux', 'Prometheus', 'Grafana', 'Python'],
    summary: '5+ years managing multi-region Kubernetes clusters on AWS with Terraform. Built automated GitHub Actions CI/CD and configured Prometheus/Grafana.',
    questions: []
  },
  {
    id: 'mock-5',
    name: 'Marcus Vance',
    role: 'Python Backend Developer',
    score: 0,
    skills: ['Python', 'Django', 'PostgreSQL', 'Docker', 'REST API'],
    summary: '3 years experience building CRUD backend services using Python and Django. Managed PostgreSQL databases and Docker containers.',
    questions: []
  },
  {
    id: 'mock-6',
    name: 'Emily Watson',
    role: 'Digital Marketing & Content Lead',
    score: 0,
    skills: ['WordPress', 'HTML5', 'CSS3', 'SEO', 'Google Analytics'],
    summary: '4 years managing WordPress client sites, conversion rate optimization, content writing, and search engine optimization.',
    questions: []
  }
];

export default function JDResumeMatcher() {
  // Job Description State
  const [selectedJdId, setSelectedJdId] = useState<string>(SAMPLE_JOB_DESCRIPTIONS[0].id);
  const [jdText, setJdText] = useState<string>(SAMPLE_JOB_DESCRIPTIONS[0].text);
  const [jdTitle, setJdTitle] = useState<string>(SAMPLE_JOB_DESCRIPTIONS[0].title);
  const [extractedJdSkills, setExtractedJdSkills] = useState<string[]>([]);

  // Candidates & Matching State
  const [rawCandidates, setRawCandidates] = useState<Candidate[]>([]);
  const [rankedList, setRankedList] = useState<RankedCandidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<RankedCandidate | null>(null);
  const [isMatching, setIsMatching] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Colab Modal State
  const [showColabModal, setShowColabModal] = useState(false);

  // 1. Fetch Candidates from Supabase (or fallback to high-fidelity mocks)
  useEffect(() => {
    async function loadCandidates() {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('candidates')
          .select('*')
          .order('uploadedAt', { ascending: false });

        if (!error && data && data.length > 0) {
          // Merge with any missing summary text for rich matching
          const candidatesWithText = data.map(c => ({
            ...c,
            summary: c.summary && c.summary !== 'Resume uploaded. AI analysis pending.'
              ? c.summary
              : `${c.name} - ${c.role}. Skills: ${(c.skills || []).join(', ')}. Candidate profile from resume upload.`
          }));
          setRawCandidates(candidatesWithText);
        } else {
          setRawCandidates(MOCK_FALLBACK_CANDIDATES);
        }
      } catch {
        setRawCandidates(MOCK_FALLBACK_CANDIDATES);
      } finally {
        setIsLoading(false);
      }
    }
    loadCandidates();
  }, []);

  // 2. Extract Skills whenever JD text changes
  useEffect(() => {
    const skills = extractSkills(jdText);
    setExtractedJdSkills(skills);
  }, [jdText]);

  // 3. Switch Pre-configured JD template
  const handleSelectTemplate = (templateId: string) => {
    const tpl = SAMPLE_JOB_DESCRIPTIONS.find(j => j.id === templateId);
    if (tpl) {
      setSelectedJdId(tpl.id);
      setJdTitle(tpl.title);
      setJdText(tpl.text);
      setRankedList([]);
      setSelectedCandidate(null);
    }
  };

  // 4. Run Matching & Ranking Engine
  const runMatchingAndRanking = () => {
    setIsMatching(true);
    setTimeout(() => {
      const results: RankedCandidate[] = rawCandidates.map(candidate => {
        const resumeCorpus = `${candidate.name} ${candidate.role} ${candidate.summary} ${(candidate.skills || []).join(' ')}`;
        const breakdown = matchJDAndResume(
          jdText,
          resumeCorpus,
          extractedJdSkills,
          candidate.skills
        );
        return {
          ...candidate,
          score: breakdown.overallScore,
          matchBreakdown: breakdown,
          rank: 0,
        };
      });

      // Sort descending by overall match score
      results.sort((a, b) => b.score - a.score);

      // Assign ranks (1st, 2nd, 3rd, ...)
      const ranked = results.map((c, index) => ({
        ...c,
        rank: index + 1
      }));

      setRankedList(ranked);
      if (ranked.length > 0) {
        setSelectedCandidate(ranked[0]);
      }
      setIsMatching(false);
    }, 450);
  };

  // 5. Auto-run matching once candidates are loaded
  useEffect(() => {
    if (rawCandidates.length > 0 && rankedList.length === 0) {
      runMatchingAndRanking();
    }
  }, [rawCandidates]);

  // 6. Sync candidate's calculated score to Supabase
  const syncCandidateToSupabase = async (candidate: RankedCandidate) => {
    setSyncStatus('saving');
    try {
      await supabase
        .from('candidates')
        .update({
          score: candidate.score,
          skills: candidate.matchBreakdown.matchedSkills,
          questions: candidate.matchBreakdown.interviewQuestions
        })
        .eq('id', candidate.id);

      setSyncStatus('saved');
      setTimeout(() => setSyncStatus('idle'), 2500);
    } catch (err) {
      console.error('Failed to sync to Supabase:', err);
      setSyncStatus('idle');
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return { badge: '🥇 #1 Best Fit', color: 'from-amber-400 to-amber-500 text-amber-950 font-bold shadow-amber-500/20' };
    if (rank === 2) return { badge: '🥈 #2 Top Match', color: 'from-slate-200 to-slate-300 text-slate-800 font-bold shadow-slate-400/20' };
    if (rank === 3) return { badge: '🥉 #3 Strong Fit', color: 'from-amber-600 to-amber-700 text-white font-bold shadow-amber-700/20' };
    return { badge: `#${rank}`, color: 'from-slate-100 to-slate-200 dark:from-white/10 dark:to-white/5 text-slate-600 dark:text-slate-300 font-medium' };
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'from-emerald-400 to-teal-500 text-emerald-500 border-emerald-500/30';
    if (score >= 70) return 'from-indigo-400 to-violet-500 text-indigo-500 border-indigo-500/30';
    if (score >= 50) return 'from-amber-400 to-orange-500 text-amber-500 border-amber-500/30';
    return 'from-rose-400 to-rose-500 text-rose-500 border-rose-500/30';
  };

  return (
    <div className="flex flex-col h-full gap-6">

      {/* ── Top Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 animate-slide-up">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-indigo-500" />
              Machine Learning Engine
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500">•</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Bi-Encoder Semantic Cosine Scoring</span>
          </div>
          <h2 className="heading-section text-2xl text-slate-900 dark:text-slate-100 mt-1">
            JD & Resume <span className="gradient-text">Matching & Ranking</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Extract requirements, compute semantic vector similarity, and rank candidate pools in real-time.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowColabModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-md shadow-indigo-500/25 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
          >
            <Cpu className="w-3.5 h-3.5" />
            Train Model in Colab
          </button>

          <button
            onClick={runMatchingAndRanking}
            disabled={isMatching}
            className="flex items-center gap-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-indigo-400 dark:hover:border-indigo-500/50 text-slate-800 dark:text-slate-200 px-4 py-2 rounded-xl text-xs font-semibold shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-indigo-500 ${isMatching ? 'animate-spin' : ''}`} />
            {isMatching ? 'Matching...' : 'Re-Rank Candidates'}
          </button>
        </div>
      </div>

      {/* ── Main Two-Column Layout (JD Selector & Ranked Candidates) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">

        {/* ── Left Column: Job Description & Extracted Skills (5 Cols) ── */}
        <div className="lg:col-span-5 flex flex-col gap-4 min-h-0">

          {/* Job Template Pills */}
          <div className="bg-white/80 dark:bg-white/3 backdrop-blur-xl p-3.5 rounded-2xl border border-slate-200/60 dark:border-white/8 shadow-sm flex flex-col gap-2.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-3 h-3 text-indigo-500" />
              Select Job Description Template
            </span>
            <div className="flex flex-wrap gap-1.5">
              {SAMPLE_JOB_DESCRIPTIONS.map(tpl => {
                const isActive = selectedJdId === tpl.id;
                return (
                  <button
                    key={tpl.id}
                    onClick={() => handleSelectTemplate(tpl.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-sm shadow-indigo-500/30'
                        : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'
                    }`}
                  >
                    {tpl.title.split(' ')[1] || tpl.title.split(' ')[0]}
                    {isActive && <Check className="w-3 h-3" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* JD Editor / Viewer */}
          <div className="bg-white/80 dark:bg-white/3 backdrop-blur-xl rounded-2xl border border-slate-200/60 dark:border-white/8 shadow-sm flex-1 flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-white/8 flex items-center justify-between bg-slate-50/50 dark:bg-white/2">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-500" />
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[240px]">
                  {jdTitle}
                </span>
              </div>
              <span className="text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-500/20 px-2 py-0.5 rounded-full">
                Active Job Spec
              </span>
            </div>

            <div className="flex-1 p-3 overflow-hidden flex flex-col">
              <textarea
                value={jdText}
                onChange={e => {
                  setJdText(e.target.value);
                  setSelectedJdId('custom');
                }}
                rows={9}
                placeholder="Paste or edit job description text here..."
                className="w-full flex-1 p-3 text-xs text-slate-700 dark:text-slate-300 bg-slate-50/50 dark:bg-black/20 border border-slate-200/60 dark:border-white/6 rounded-xl resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500 leading-relaxed font-mono"
              />
            </div>

            {/* Extracted Skills Bar */}
            <div className="p-3 border-t border-slate-100 dark:border-white/8 bg-slate-50/30 dark:bg-white/1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <BrainCircuit className="w-3.5 h-3.5 text-indigo-500" />
                  Auto-Extracted Target Skills ({extractedJdSkills.length})
                </span>
                <span className="text-[10px] text-slate-400">Live NLP Detection</span>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                {extractedJdSkills.map(skill => (
                  <span
                    key={skill}
                    className="px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-500/20 shadow-xs"
                  >
                    {skill}
                  </span>
                ))}
                {extractedJdSkills.length === 0 && (
                  <span className="text-xs text-slate-400 italic">No recognized skills detected. Add tech terms above.</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Right Column: Ranked Candidates & Detail Breakdown (7 Cols) ── */}
        <div className="lg:col-span-7 flex flex-col gap-4 min-h-0">

          {/* Ranking Stats Bar */}
          <div className="bg-gradient-to-r from-indigo-50/80 via-violet-50/50 to-cyan-50/40 dark:from-indigo-900/15 dark:via-violet-900/10 dark:to-cyan-900/5 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-800/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-500 rounded-xl text-white shadow-md shadow-indigo-500/30">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                  {rankedList.length} Candidates Ranked by ML Match Score
                </p>
                <p className="text-[11px] text-indigo-600/80 dark:text-indigo-400">
                  Calculated using 45% Skill Overlap + 40% Semantic TF-IDF + 15% Experience Alignment
                </p>
              </div>
            </div>

            {rankedList.length > 0 && (
              <div className="text-right">
                <span className="text-xs text-indigo-500 font-semibold">Top Score</span>
                <p className="text-lg font-extrabold text-indigo-700 dark:text-indigo-300 leading-tight">
                  {rankedList[0].score}%
                </p>
              </div>
            )}
          </div>

          {/* Candidate Cards Grid */}
          <div className="bg-white/80 dark:bg-white/3 backdrop-blur-xl rounded-2xl border border-slate-200/60 dark:border-white/8 shadow-sm flex-1 flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-white/8 flex items-center justify-between bg-slate-50/50 dark:bg-white/2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Leaderboard • Click candidate to open deep dive
              </span>
              <span className="text-[11px] text-slate-400">
                Sorted by Match %
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-48 gap-3 text-slate-400">
                  <Loader2 className="w-7 h-7 text-indigo-500 animate-spin" />
                  <p className="text-xs">Loading candidate pool...</p>
                </div>
              ) : rankedList.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 gap-2 text-slate-400">
                  <p className="text-xs font-semibold">No candidates found</p>
                  <p className="text-[11px]">Upload resumes in the Resume Pool to match against this JD.</p>
                </div>
              ) : rankedList.map(cand => {
                const isSelected = selectedCandidate?.id === cand.id;
                const rankInfo = getRankBadge(cand.rank);
                const scoreColorClass = getScoreColor(cand.score);

                return (
                  <div
                    key={cand.id}
                    onClick={() => setSelectedCandidate(cand)}
                    className={`p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col gap-2.5 ${
                      isSelected
                        ? 'border-indigo-400 dark:border-indigo-500 bg-indigo-50/40 dark:bg-indigo-500/10 shadow-md shadow-indigo-500/10'
                        : 'border-slate-200/70 dark:border-white/6 hover:border-indigo-200 dark:hover:border-indigo-700/50 bg-white/40 dark:bg-white/2 hover:bg-slate-50 dark:hover:bg-white/4'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      {/* Name & Rank */}
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                          {cand.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                              {cand.name}
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full bg-gradient-to-r ${rankInfo.color}`}>
                              {rankInfo.badge}
                            </span>
                          </div>
                          <span className="text-xs text-slate-400">{cand.role}</span>
                        </div>
                      </div>

                      {/* Score Ring / Pill */}
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block font-medium">Fit Rating</span>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                            {cand.matchBreakdown.fitLabel}
                          </span>
                        </div>
                        <div className={`px-3 py-1.5 rounded-xl border text-sm font-black bg-gradient-to-br ${scoreColorClass}`}>
                          {cand.score}%
                        </div>
                      </div>
                    </div>

                    {/* Progress Bars for Multi-factor Match */}
                    <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100 dark:border-white/6">
                      <div>
                        <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                          <span>Skills</span>
                          <span className="font-semibold text-slate-600 dark:text-slate-300">{cand.matchBreakdown.skillScore}%</span>
                        </div>
                        <div className="h-1 bg-slate-100 dark:bg-white/8 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${cand.matchBreakdown.skillScore}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                          <span>Semantic</span>
                          <span className="font-semibold text-slate-600 dark:text-slate-300">{cand.matchBreakdown.semanticScore}%</span>
                        </div>
                        <div className="h-1 bg-slate-100 dark:bg-white/8 rounded-full overflow-hidden">
                          <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${cand.matchBreakdown.semanticScore}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                          <span>Experience</span>
                          <span className="font-semibold text-slate-600 dark:text-slate-300">{cand.matchBreakdown.experienceScore}%</span>
                        </div>
                        <div className="h-1 bg-slate-100 dark:bg-white/8 rounded-full overflow-hidden">
                          <div className="h-full bg-violet-500 rounded-full" style={{ width: `${cand.matchBreakdown.experienceScore}%` }} />
                        </div>
                      </div>
                    </div>

                    {/* Quick Matched Skills Preview */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      <span className="text-[10px] text-slate-400 font-medium">Matched:</span>
                      {cand.matchBreakdown.matchedSkills.slice(0, 4).map(s => (
                        <span key={s} className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px] font-semibold rounded-md border border-emerald-200/70 dark:border-emerald-500/20">
                          {s}
                        </span>
                      ))}
                      {cand.matchBreakdown.missingSkills.length > 0 && (
                        <span className="text-[10px] text-rose-500 font-semibold ml-auto">
                          Missing {cand.matchBreakdown.missingSkills.length} skills
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Deep Dive Modal / Drawer for Selected Candidate ── */}
      {selectedCandidate && (
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-2xl border border-indigo-200/80 dark:border-indigo-500/20 shadow-xl p-5 flex flex-col gap-4 animate-slide-up">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/8 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white font-bold flex items-center justify-center shadow-md">
                {selectedCandidate.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                    {selectedCandidate.name}
                  </h3>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-200/60 dark:border-indigo-500/30">
                    Rank #{selectedCandidate.rank}
                  </span>
                </div>
                <p className="text-xs text-slate-400">{selectedCandidate.role}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => syncCandidateToSupabase(selectedCandidate)}
                disabled={syncStatus === 'saving'}
                className="flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer"
              >
                <Database className="w-3.5 h-3.5" />
                {syncStatus === 'saving' ? 'Syncing...' : syncStatus === 'saved' ? 'Saved to DB!' : 'Save Score to Supabase'}
              </button>

              <button
                onClick={() => setSelectedCandidate(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* AI Recommendation */}
            <div className="p-3.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-800/30 flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5 mb-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  AI Hiring Recommendation
                </span>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {selectedCandidate.matchBreakdown.recommendation}
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-indigo-100 dark:border-indigo-800/30 flex items-center justify-between text-xs">
                <span className="text-slate-400">Overall Match</span>
                <span className="font-extrabold text-indigo-600 dark:text-indigo-400 text-sm">
                  {selectedCandidate.score}%
                </span>
              </div>
            </div>

            {/* Skill Matrix */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/2 border border-slate-100 dark:border-white/6 flex flex-col gap-2">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Skill Overlap Matrix
              </span>
              <div>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mb-1">
                  ✓ Matched Skills ({selectedCandidate.matchBreakdown.matchedSkills.length})
                </p>
                <div className="flex flex-wrap gap-1">
                  {selectedCandidate.matchBreakdown.matchedSkills.map(s => (
                    <span key={s} className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 rounded">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {selectedCandidate.matchBreakdown.missingSkills.length > 0 && (
                <div className="mt-1">
                  <p className="text-[10px] text-rose-500 font-semibold mb-1">
                    ⚠ Missing Required Skills ({selectedCandidate.matchBreakdown.missingSkills.length})
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {selectedCandidate.matchBreakdown.missingSkills.map(s => (
                      <span key={s} className="px-2 py-0.5 text-[10px] font-semibold bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300 rounded">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Targeted Interview Questions */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/2 border border-slate-100 dark:border-white/6 flex flex-col gap-2">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5 text-violet-500" />
                Gap-Targeted Interview Questions
              </span>
              <ul className="space-y-1.5 overflow-y-auto max-h-36 pr-1 text-xs text-slate-600 dark:text-slate-300">
                {selectedCandidate.matchBreakdown.interviewQuestions.map((q, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-violet-500 font-bold">•</span>
                    <span>{q}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ── Colab Training Hub Modal ── */}
      {showColabModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl max-w-2xl w-full p-6 shadow-2xl flex flex-col gap-5 max-h-[90vh] overflow-y-auto animate-scale-up">

            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/8 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-500/30">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">
                    Google Colab Model Training Guide
                  </h3>
                  <p className="text-xs text-slate-400">
                    Fine-tune a Sentence-Transformers Bi-Encoder on free GPU
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowColabModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Architecture Explainer */}
            <div className="bg-slate-50 dark:bg-white/2 p-4 rounded-2xl border border-slate-100 dark:border-white/6 space-y-2">
              <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                How It Works
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                The model converts Job Descriptions and Resumes into 384-dimensional dense vectors using <code>all-MiniLM-L6-v2</code>.
                When fine-tuned with <code>CosineSimilarityLoss</code>, the vector distance mirrors the exact match quality.
              </p>
              <div className="flex items-center gap-4 text-xs font-medium text-slate-500 pt-1">
                <span>⏱️ Training time: ~60 seconds</span>
                <span>•</span>
                <span>⚡ Hardware: Free Colab T4 GPU</span>
                <span>•</span>
                <span>📦 Size: ~90 MB</span>
              </div>
            </div>

            {/* Step-by-Step Instructions */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Quick Setup Steps
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-white dark:bg-white/3 border border-slate-200 dark:border-white/8 rounded-xl">
                  <span className="font-bold text-indigo-600 block mb-1">Step 1: Open Google Colab</span>
                  <p className="text-slate-500">Go to <a href="https://colab.research.google.com" target="_blank" rel="noreferrer" className="text-indigo-500 underline">colab.research.google.com</a> and upload <code>JD_Resume_Matching_Model_Training.ipynb</code>.</p>
                </div>
                <div className="p-3 bg-white dark:bg-white/3 border border-slate-200 dark:border-white/8 rounded-xl">
                  <span className="font-bold text-indigo-600 block mb-1">Step 2: Select T4 GPU</span>
                  <p className="text-slate-500">Click <strong>Runtime</strong> &gt; <strong>Change runtime type</strong> &gt; select <strong>T4 GPU</strong> &gt; Save.</p>
                </div>
                <div className="p-3 bg-white dark:bg-white/3 border border-slate-200 dark:border-white/8 rounded-xl">
                  <span className="font-bold text-indigo-600 block mb-1">Step 3: Run Training</span>
                  <p className="text-slate-500">Run all cells. The dataset is automatically loaded or synthesized and fine-tunes in ~1 minute.</p>
                </div>
                <div className="p-3 bg-white dark:bg-white/3 border border-slate-200 dark:border-white/8 rounded-xl">
                  <span className="font-bold text-indigo-600 block mb-1">Step 4: Export & Serve</span>
                  <p className="text-slate-500">Download the saved model zip or launch the included FastAPI microservice to plug into this app.</p>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="pt-2 border-t border-slate-100 dark:border-white/8 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-slate-400">
                Files generated in: <code>ml_training/</code>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href="https://colab.research.google.com"
                  target="_blank"
                  rel="noreferrer"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-md transition-all inline-flex items-center gap-1.5"
                >
                  Open Colab <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
