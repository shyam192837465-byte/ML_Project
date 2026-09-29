// TalentAI Studio - ML Matching & Skill Extraction Engine
// Combines semantic TF-IDF cosine similarity, keyword/skill extraction, and experience scoring

export interface SkillCategory {
  category: string;
  skills: string[];
}

export const SKILL_TAXONOMY: Record<string, string[]> = {
  'AI / Machine Learning': [
    'python', 'pytorch', 'tensorflow', 'scikit-learn', 'keras', 'huggingface',
    'transformers', 'bert', 'llm', 'nlp', 'computer vision', 'opencv', 'pandas',
    'numpy', 'langchain', 'llamaindex', 'rag', 'deep learning', 'mlops', 'xgboost',
    'embeddings', 'vector database', 'fine-tuning', 'openai api', 'spacy', 'onnx'
  ],
  'Web & Frontend': [
    'react', 'next.js', 'vue', 'angular', 'svelte', 'typescript', 'javascript',
    'html5', 'css3', 'tailwind css', 'redux', 'zustand', 'vite', 'graphql',
    'rest api', 'webpack', 'webgl', 'three.js', 'responsive design', 'sass'
  ],
  'Backend & Cloud': [
    'node.js', 'express', 'nestjs', 'fastapi', 'flask', 'django', 'go', 'golang',
    'rust', 'java', 'spring boot', 'c#', '.net', 'microservices', 'grpc',
    'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'ci/cd',
    'github actions', 'serverless', 'lambda', 'linux', 'nginx'
  ],
  'Databases & Storage': [
    'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch', 'supabase',
    'prisma', 'sqlite', 'dynamodb', 'cassandra', 'kafka', 'rabbitmq',
    'pinecone', 'qdrant', 'chromadb', 'pgvector', 'sql'
  ],
  'Data Engineering': [
    'spark', 'apache spark', 'pyspark', 'airflow', 'dbt', 'snowflake',
    'bigquery', 'hadoop', 'etl', 'data warehousing', 'databricks', 'tableau', 'powerbi'
  ],
  'DevOps & Security': [
    'git', 'ci/cd', 'helm', 'ansible', 'prometheus', 'grafana', 'datadog',
    'oauth', 'jwt', 'cybersecurity', 'owasp', 'penetration testing', 'zero trust'
  ],
  'Soft Skills': [
    'leadership', 'team collaboration', 'communication', 'agile', 'scrum',
    'problem solving', 'mentorship', 'critical thinking', 'project management'
  ]
};

// Flattened lookup set for quick matching
const ALL_KNOWN_SKILLS: { name: string; lower: string }[] = [];
Object.entries(SKILL_TAXONOMY).forEach(([_, list]) => {
  list.forEach(skill => {
    ALL_KNOWN_SKILLS.push({ name: skill, lower: skill.toLowerCase() });
  });
});

/**
 * Extracts recognized skills from arbitrary text (JD or Resume)
 */
export function extractSkills(text: string): string[] {
  if (!text) return [];
  const normalized = ` ${text.toLowerCase().replace(/[/,.;:()_\[\]{}]/g, ' ')} `;
  const found = new Set<string>();

  ALL_KNOWN_SKILLS.forEach(({ name, lower }) => {
    // Check boundary or exact substring with word boundary
    const escaped = lower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(?:^|\\s)${escaped}(?:$|\\s)`, 'i');
    if (regex.test(normalized)) {
      found.add(name);
    }
  });

  return Array.from(found);
}

/**
 * Extracts estimated years of experience from resume text
 */
export function extractExperienceYears(text: string): number {
  if (!text) return 0;
  const patterns = [
    /(\d+)\+?\s*years?(?:\s+of)?\s+experience/i,
    /experience:\s*(\d+)\+?\s*years/i,
    /over\s+(\d+)\s+years/i,
    /(\d+)\s*\+\s*years/i,
  ];

  for (const regex of patterns) {
    const match = text.match(regex);
    if (match && match[1]) {
      const yrs = parseInt(match[1], 10);
      if (yrs > 0 && yrs <= 40) return yrs;
    }
  }

  // Fallback: estimate from graduation or date patterns (e.g. 2018-2024 -> 6 years)
  const yearMatches = text.match(/\b(20[0-2][0-9]|19[89][0-9])\b/g);
  if (yearMatches && yearMatches.length >= 2) {
    const years = yearMatches.map(y => parseInt(y, 10)).sort((a, b) => a - b);
    const earliest = years[0];
    const latest = Math.min(new Date().getFullYear(), years[years.length - 1]);
    const diff = latest - earliest;
    if (diff > 0 && diff <= 40) return diff;
  }

  return 2; // Default conservative estimate
}

/**
 * Tokenize and generate word n-grams (1-gram and 2-gram)
 */
function getNGrams(text: string): Map<string, number> {
  const stopWords = new Set([
    'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren',
    'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
    'can', 'could', 'did', 'do', 'does', 'doing', 'down', 'during', 'each', 'few', 'for', 'from',
    'further', 'had', 'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'herself', 'him',
    'himself', 'his', 'how', 'i', 'if', 'in', 'into', 'is', 'isn', 'it', 'its', 'itself', 'just',
    'me', 'more', 'most', 'my', 'myself', 'no', 'nor', 'not', 'now', 'of', 'off', 'on', 'once',
    'only', 'or', 'other', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'she', 'should',
    'so', 'some', 'such', 'than', 'that', 'the', 'their', 'theirs', 'them', 'themselves', 'then',
    'there', 'these', 'they', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very',
    'was', 'wasn', 'we', 'were', 'weren', 'what', 'when', 'where', 'which', 'while', 'who', 'whom',
    'why', 'with', 'would', 'you', 'your', 'yours', 'yourself', 'yourselves'
  ]);

  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9+#.-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1 && !stopWords.has(w));

  const freq = new Map<string, number>();

  // Unigrams
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    freq.set(w, (freq.get(w) || 0) + 1);

    // Bigrams for key phrases (e.g. "machine learning", "deep learning")
    if (i < words.length - 1) {
      const bg = `${w} ${words[i + 1]}`;
      freq.set(bg, (freq.get(bg) || 0) + 1.5);
    }
  }

  return freq;
}

/**
 * Calculates Cosine Similarity between two term-frequency maps (Vector Space Model)
 */
export function calculateCosineSimilarity(textA: string, textB: string): number {
  if (!textA || !textB) return 0;

  const tfA = getNGrams(textA);
  const tfB = getNGrams(textB);

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  tfA.forEach((val, key) => {
    normA += val * val;
    if (tfB.has(key)) {
      dotProduct += val * (tfB.get(key) || 0);
    }
  });

  tfB.forEach(val => {
    normB += val * val;
  });

  if (normA === 0 || normB === 0) return 0;

  const sim = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  return Math.min(1, Math.max(0, sim));
}

export interface MatchBreakdown {
  overallScore: number;         // 0 - 100
  semanticScore: number;        // 0 - 100 (cosine similarity)
  skillScore: number;           // 0 - 100 (skill overlap percentage)
  experienceScore: number;      // 0 - 100 (seniority & year fit)
  matchedSkills: string[];
  missingSkills: string[];
  extraSkills: string[];
  fitLabel: 'Exceptional' | 'Strong Match' | 'Good Match' | 'Moderate Match' | 'Low Match';
  interviewQuestions: string[];
  recommendation: string;
}

/**
 * Main JD and Resume Matching function
 * Combines Skill Overlap (45%), Semantic TF-IDF Similarity (40%), and Experience Fit (15%)
 */
export function matchJDAndResume(
  jdText: string,
  resumeText: string,
  targetSkills?: string[],
  candidateSkills?: string[],
  requiredExpYears = 3
): MatchBreakdown {
  // 1. Skill Extraction
  const extractedJDSkills = targetSkills && targetSkills.length > 0
    ? targetSkills.map(s => s.toLowerCase())
    : extractSkills(jdText);

  const extractedResumeSkills = candidateSkills && candidateSkills.length > 0
    ? candidateSkills.map(s => s.toLowerCase())
    : extractSkills(resumeText);

  const resumeSkillSet = new Set(extractedResumeSkills);
  const jdSkillSet = new Set(extractedJDSkills);

  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];
  const extraSkills: string[] = [];

  jdSkillSet.forEach(s => {
    if (resumeSkillSet.has(s) || resumeText.toLowerCase().includes(s)) {
      matchedSkills.push(s);
    } else {
      missingSkills.push(s);
    }
  });

  resumeSkillSet.forEach(s => {
    if (!jdSkillSet.has(s)) {
      extraSkills.push(s);
    }
  });

  // 2. Skill Overlap Score (45% weight)
  const totalRequired = jdSkillSet.size;
  const skillScore = totalRequired > 0
    ? Math.round((matchedSkills.length / totalRequired) * 100)
    : 70;

  // 3. Semantic Similarity Score (40% weight)
  const rawSemantic = calculateCosineSimilarity(jdText, resumeText);
  // Scale semantic score from typical cosine range (0.15 - 0.75) to (30 - 100) for human interpretability
  const semanticScore = Math.min(100, Math.round(Math.pow(rawSemantic, 0.75) * 115));

  // 4. Experience Score (15% weight)
  const candidateExpYears = extractExperienceYears(resumeText);
  let experienceScore = 100;
  if (candidateExpYears < requiredExpYears) {
    const diff = requiredExpYears - candidateExpYears;
    experienceScore = Math.max(40, 100 - diff * 18);
  } else if (candidateExpYears > requiredExpYears + 7) {
    experienceScore = 95; // Overqualified slightly penalized or high
  }

  // 5. Composite Weighted Overall Score
  const overallScore = Math.min(
    100,
    Math.max(10, Math.round(skillScore * 0.45 + semanticScore * 0.40 + experienceScore * 0.15))
  );

  // 6. Fit Label
  let fitLabel: MatchBreakdown['fitLabel'] = 'Low Match';
  if (overallScore >= 88) fitLabel = 'Exceptional';
  else if (overallScore >= 78) fitLabel = 'Strong Match';
  else if (overallScore >= 65) fitLabel = 'Good Match';
  else if (overallScore >= 50) fitLabel = 'Moderate Match';

  // 7. Targeted AI Interview Questions generated from gaps
  const interviewQuestions = generateTargetedQuestions(missingSkills, matchedSkills, candidateExpYears);

  // 8. Recommendation
  let recommendation = '';
  if (overallScore >= 85) {
    recommendation = 'Top candidate. Fast-track to technical screening interview.';
  } else if (overallScore >= 70) {
    recommendation = 'Solid profile with relevant experience. Review missing skills in interview.';
  } else if (overallScore >= 55) {
    recommendation = 'Potential transferrable skills; has gaps in critical core requirements.';
  } else {
    recommendation = 'Low alignment with current requirements. Keep on file for other roles.';
  }

  return {
    overallScore,
    semanticScore,
    skillScore,
    experienceScore,
    matchedSkills: matchedSkills.map(capitalize),
    missingSkills: missingSkills.map(capitalize),
    extraSkills: extraSkills.slice(0, 8).map(capitalize),
    fitLabel,
    interviewQuestions,
    recommendation
  };
}

function capitalize(s: string): string {
  return s
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Generates dynamic questions based on missing tech skills and role context
 */
function generateTargetedQuestions(missingSkills: string[], matchedSkills: string[], expYears: number): string[] {
  const questions: string[] = [];

  if (missingSkills.length > 0) {
    const primaryMissing = missingSkills.slice(0, 3);
    primaryMissing.forEach(skill => {
      const cap = capitalize(skill);
      questions.push(`Our team relies heavily on ${cap}. Have you used ${cap} or comparable technologies in your past projects?`);
    });
  }

  if (matchedSkills.length > 0) {
    const topSkill = capitalize(matchedSkills[0]);
    questions.push(`Can you walk us through a challenging production architecture you built using ${topSkill}?`);
  }

  questions.push(`With approximately ${expYears} years of experience, describe a scenario where you had to quickly master an unfamiliar tech stack under tight deadlines.`);

  return questions.slice(0, 4);
}

/**
 * Pre-configured job description templates to test immediately
 */
export const SAMPLE_JOB_DESCRIPTIONS = [
  {
    id: 'jd-ml-engineer',
    title: 'Senior Machine Learning / AI Engineer',
    department: 'AI & Data Platforms',
    experienceRequired: 4,
    requiredSkills: ['Python', 'PyTorch', 'HuggingFace', 'Transformers', 'NLP', 'FastAPI', 'Docker', 'PostgreSQL', 'Vector Database'],
    text: `Job Title: Senior Machine Learning / AI Engineer
Department: AI & Data Platforms
Location: Remote / Hybrid

About The Role:
We are looking for a Senior Machine Learning Engineer to design, train, and deploy production-grade NLP and LLM systems. You will lead the development of our retrieval-augmented generation (RAG) pipelines and fine-tune transformer models for semantic search and classification.

Key Responsibilities:
- Build and fine-tune state-of-the-art transformer models (BERT, Llama, Mistral) using PyTorch and HuggingFace.
- Implement vector search and similarity scoring with pgvector, Pinecone, or Qdrant.
- Design low-latency inference microservices using FastAPI, Docker, and Kubernetes.
- Collaborate with frontend and data engineering teams to integrate ML models into client-facing applications.
- Benchmark and evaluate model accuracy, latency, and throughput in production.

Requirements & Qualifications:
- 4+ years of professional software engineering and applied ML experience.
- Deep expertise in Python, PyTorch, Scikit-learn, and HuggingFace Transformers.
- Proven track record deploying NLP or LLM applications in production.
- Experience with REST APIs (FastAPI/Flask), Docker containers, and Cloud platforms (AWS or GCP).
- Strong understanding of vector embeddings, cosine similarity, and semantic ranking algorithms.`
  },
  {
    id: 'jd-fullstack-dev',
    title: 'Senior Full-Stack Engineer (React & Node)',
    department: 'Core Product Engineering',
    experienceRequired: 4,
    requiredSkills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Tailwind CSS', 'REST API', 'Docker', 'Git'],
    text: `Job Title: Senior Full-Stack Engineer (React & Node)
Department: Core Product Engineering
Location: San Francisco, CA (or Remote)

About The Role:
We are seeking an experienced Full-Stack Engineer to architect and build intuitive, high-performance web applications. You will take ownership of features from database schema design to pixel-perfect responsive user interfaces.

Key Responsibilities:
- Build modern, interactive web applications using React, TypeScript, and Tailwind CSS.
- Architect robust backend services and REST/GraphQL APIs with Node.js and Express/NestJS.
- Design scalable relational database schemas with PostgreSQL and optimize queries.
- Implement CI/CD pipelines, containerize applications with Docker, and manage deployments.
- Mentor junior engineers and champion code quality, automated testing, and security best practices.

Requirements:
- 4+ years of full-stack web development experience.
- Strong proficiency in modern React (hooks, context, state management) and TypeScript.
- Hands-on experience with backend architecture in Node.js, Express, and PostgreSQL/Prisma.
- Experience building responsive, accessible UI with Tailwind CSS.
- Familiarity with cloud services (AWS or Supabase) and containerization.`
  },
  {
    id: 'jd-cloud-devops',
    title: 'Cloud DevOps & Platform Engineer',
    department: 'Infrastructure & SRE',
    experienceRequired: 5,
    requiredSkills: ['Kubernetes', 'Docker', 'AWS', 'Terraform', 'CI/CD', 'Prometheus', 'Linux', 'Python'],
    text: `Job Title: Cloud DevOps & Platform Engineer
Department: Infrastructure & SRE
Location: Hybrid

About The Role:
We need a Cloud DevOps Engineer to scale our cloud infrastructure, automate deployment pipelines, and ensure 99.99% system availability across our multi-region Kubernetes clusters.

Key Responsibilities:
- Manage multi-cluster Kubernetes deployments on AWS (EKS) using Terraform for Infrastructure as Code.
- Build reliable, automated CI/CD pipelines using GitHub Actions and Helm charts.
- Implement comprehensive observability, logging, and alerting with Prometheus, Grafana, and Datadog.
- Drive Zero-Trust security, secret management, and compliance across cloud workloads.

Requirements:
- 5+ years working with Linux environments, Docker, and production Kubernetes.
- Deep hands-on experience with AWS services (EC2, EKS, RDS, S3, IAM, VPC).
- Proficiency in Terraform and shell scripting or Python automation.
- Strong troubleshooting skills in high-traffic distributed systems.`
  }
];
