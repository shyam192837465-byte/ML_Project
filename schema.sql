-- ==============================================================================
-- Supabase Schema & Setup Query for TalentAI Studio / Resume Matcher
-- Target Project: https://gyblwsouxbpqehhzmfkp.supabase.co
-- 
-- Instructions:
-- 1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/gyblwsouxbpqehhzmfkp
-- 2. Navigate to "SQL Editor" in the left sidebar.
-- 3. Click "New query", paste the entire contents of this file, and click "Run".
-- ==============================================================================

-- Enable extensions for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. TABLE: candidates
-- Used by ResumePool.tsx for listing, uploading, ranking, and deleting candidates.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    role TEXT DEFAULT 'Pending Review',
    score NUMERIC DEFAULT 0,
    skills JSONB DEFAULT '[]'::jsonb,
    summary TEXT DEFAULT '',
    questions JSONB DEFAULT '[]'::jsonb,
    "fileUrl" TEXT,
    "fileName" TEXT,
    "uploadedAt" TIMESTAMPTZ DEFAULT now()
);

-- Index for ordering candidates by upload date
CREATE INDEX IF NOT EXISTS idx_candidates_uploaded_at ON public.candidates ("uploadedAt" DESC);

-- ==============================================================================
-- 2. TABLE: anti_bluff_profiles
-- Used by AntiBluffEngine.tsx to verify candidate claims vs public GitHub data.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.anti_bluff_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    role TEXT DEFAULT 'Pending Review',
    status TEXT DEFAULT 'verified' CHECK (status IN ('verified', 'discrepancy')),
    "resumeClaims" JSONB DEFAULT '[]'::jsonb,
    "githubStats" JSONB DEFAULT '[]'::jsonb,
    "analysisText" TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ==============================================================================
-- 3. TABLE: jd_analysis
-- Used by JDGapAnalysis.tsx to display raw job description and AI skill gaps.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.jd_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    raw_jd TEXT NOT NULL,
    base_skills JSONB DEFAULT '[]'::jsonb,
    gaps JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ==============================================================================
-- 4. STORAGE BUCKET: Resumes
-- Used by ResumePool.tsx to store and serve uploaded resume files.
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'Resumes',
    'Resumes',
    true,
    10485760, -- 10MB limit
    ARRAY[
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY[
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

-- ==============================================================================
-- 5. ROW LEVEL SECURITY (RLS) & POLICIES
-- Ensures frontend app can read, insert, update, and delete without permission errors.
-- ==============================================================================
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anti_bluff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jd_analysis ENABLE ROW LEVEL SECURITY;

-- candidates policies
DROP POLICY IF EXISTS "Public access to candidates" ON public.candidates;
CREATE POLICY "Public access to candidates"
    ON public.candidates
    FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);

-- anti_bluff_profiles policies
DROP POLICY IF EXISTS "Public access to anti_bluff_profiles" ON public.anti_bluff_profiles;
CREATE POLICY "Public access to anti_bluff_profiles"
    ON public.anti_bluff_profiles
    FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);

-- jd_analysis policies
DROP POLICY IF EXISTS "Public access to jd_analysis" ON public.jd_analysis;
CREATE POLICY "Public access to jd_analysis"
    ON public.jd_analysis
    FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);

-- Storage bucket policies for 'Resumes'
DROP POLICY IF EXISTS "Public read access to Resumes bucket" ON storage.objects;
CREATE POLICY "Public read access to Resumes bucket"
    ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'Resumes');

DROP POLICY IF EXISTS "Public upload access to Resumes bucket" ON storage.objects;
CREATE POLICY "Public upload access to Resumes bucket"
    ON storage.objects
    FOR INSERT
    TO public
    WITH CHECK (bucket_id = 'Resumes');

DROP POLICY IF EXISTS "Public delete access to Resumes bucket" ON storage.objects;
CREATE POLICY "Public delete access to Resumes bucket"
    ON storage.objects
    FOR DELETE
    TO public
    USING (bucket_id = 'Resumes');

-- ==============================================================================
-- 6. SEED / DEMO DATA (OPTIONAL)
-- Populates default data so the app displays instantly on first launch.
-- ==============================================================================

-- Seed Candidates
INSERT INTO public.candidates (name, role, score, skills, summary, questions, "uploadedAt")
SELECT 'Sarah Chen', 'Senior Full Stack Engineer', 94, 
    '["TypeScript", "React", "Node.js", "GraphQL", "PostgreSQL", "AWS"]'::jsonb,
    '7+ years experience architecting distributed cloud systems. Strong open source contributor and tech lead.',
    '["How do you handle zero-downtime database migrations in PostgreSQL?", "Walk me through how you optimize React re-rendering in high-frequency dashboards."]'::jsonb,
    now() - INTERVAL '1 day'
WHERE NOT EXISTS (SELECT 1 FROM public.candidates WHERE name = 'Sarah Chen');

INSERT INTO public.candidates (name, role, score, skills, summary, questions, "uploadedAt")
SELECT 'Alex Rivera', 'Machine Learning Engineer', 88, 
    '["Python", "PyTorch", "Transformers", "FastAPI", "Docker", "Kubernetes"]'::jsonb,
    'Specializes in fine-tuning LLMs and low-latency inference pipelines. Published researcher in NLP.',
    '["What quantization techniques do you apply to optimize large language model throughput?", "Describe your experience debugging model drift in production."]'::jsonb,
    now() - INTERVAL '2 days'
WHERE NOT EXISTS (SELECT 1 FROM public.candidates WHERE name = 'Alex Rivera');

-- Seed Anti-Bluff Profiles
INSERT INTO public.anti_bluff_profiles (name, role, status, "resumeClaims", "githubStats", "analysisText")
SELECT 
    'Marcus Vance',
    'Senior Distributed Systems Engineer',
    'verified',
    '["7+ years Go & Rust concurrency experience", "Core author of high-throughput messaging broker", "Architected Raft consensus engine with 99.999% uptime"]'::jsonb,
    '[
        {"name": "Go", "percentage": 58, "color": "#00ADD8", "darkColor": "#007D9C"},
        {"name": "Rust", "percentage": 28, "color": "#DEA584", "darkColor": "#B7410E"},
        {"name": "C++", "percentage": 14, "color": "#F34B7D", "darkColor": "#A81E48"}
    ]'::jsonb,
    'GitHub commits align exceptionally well with resume claims. Public commit history confirms deep implementation of distributed consensus protocols and active maintenance of open-source Go libraries.'
WHERE NOT EXISTS (SELECT 1 FROM public.anti_bluff_profiles WHERE name = 'Marcus Vance');

INSERT INTO public.anti_bluff_profiles (name, role, status, "resumeClaims", "githubStats", "analysisText")
SELECT 
    'David Miller',
    'Senior AI / ML Research Lead',
    'discrepancy',
    '["Lead developer of production PyTorch neural search pipelines", "Extensive work with CUDA custom kernels and GPU memory optimization", "5+ years enterprise Python architecture"]'::jsonb,
    '[
        {"name": "JavaScript / HTML", "percentage": 65, "color": "#F7DF1E", "darkColor": "#D4B830"},
        {"name": "CSS", "percentage": 25, "color": "#264DE4", "darkColor": "#1B3A9B"},
        {"name": "Python", "percentage": 10, "color": "#3572A5", "darkColor": "#224A6E"}
    ]'::jsonb,
    'Significant discrepancy detected. Resume highlights deep PyTorch and CUDA specialization, but public GitHub repository footprint consists primarily of frontend UI templates and static sites. Python code constitutes less than 10% of total activity.'
WHERE NOT EXISTS (SELECT 1 FROM public.anti_bluff_profiles WHERE name = 'David Miller');

-- Seed JD Analysis
INSERT INTO public.jd_analysis (raw_jd, base_skills, gaps)
SELECT 
    'Role: Senior Full Stack Engineer (FinTech Platform)
Location: Remote / Hybrid
Experience: 5+ Years

About the Role:
We are looking for an experienced Senior Full Stack Engineer to lead architecture across our core transactional banking platform. You will build high-reliability APIs, scalable React web applications, and collaborate with product and compliance teams.

Key Requirements:
- Expert proficiency in TypeScript, React, and Node.js
- Production experience with PostgreSQL, schema migration, and transaction isolation
- Solid understanding of distributed systems, caching strategies (Redis), and event streaming
- Prior experience in secure authentication protocols and PCI-DSS compliance is a strong plus.',
    '["TypeScript", "React", "Node.js", "PostgreSQL", "API Design", "System Architecture"]'::jsonb,
    '[
        {
            "id": "gap-1",
            "text": "FinTech Compliance & PCI-DSS security audits not explicitly listed in standard engineer profiles.",
            "skill": "PCI-DSS Compliance",
            "icon": "🔒",
            "priority": "High"
        },
        {
            "id": "gap-2",
            "text": "Distributed event streaming (Kafka/RabbitMQ) for real-time ledger consistency under high concurrency.",
            "skill": "Event-Driven Architecture",
            "icon": "⚡",
            "priority": "High"
        },
        {
            "id": "gap-3",
            "text": "Redis caching and idempotency handling for financial transaction safety.",
            "skill": "Redis & Idempotency",
            "icon": "💾",
            "priority": "Medium"
        }
    ]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.jd_analysis LIMIT 1);
