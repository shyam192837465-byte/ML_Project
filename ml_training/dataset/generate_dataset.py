#!/usr/bin/env python3
"""
TalentAI Studio - Synthetic Mock Dataset Generator for JD-Resume Matching Model Training.
Generates realistic pairs across tech domains with ground-truth match scores and labels.
Outputs both CSV and JSON formats ready for Sentence-Transformers / Hugging Face.
"""

import json
import csv
import os
import random

# Curated high-fidelity templates for multiple tech roles
ROLES = [
    {
        "role": "Machine Learning Engineer",
        "jd_template": """Job Title: Machine Learning Engineer
Department: Applied AI Research
Required Experience: 3-5 years

About The Role:
We are seeking a Machine Learning Engineer to design, build, and deploy production ML systems. You will work on natural language processing, semantic search, and recommendation systems using modern deep learning frameworks.

Responsibilities:
- Train and fine-tune transformer models using PyTorch and Hugging Face.
- Build vector search and embedding indexing pipelines with vector databases.
- Develop low-latency inference REST APIs using FastAPI and containerize services with Docker.
- Implement automated model evaluation, A/B testing, and MLOps monitoring.

Required Skills:
- Python, PyTorch, Scikit-learn, Hugging Face Transformers, NLP.
- Experience with Docker, FastAPI, and relational or NoSQL databases.
- Strong understanding of linear algebra, probability, and loss functions.""",
        "required_skills": ["Python", "PyTorch", "Hugging Face", "Transformers", "NLP", "FastAPI", "Docker", "Scikit-learn"],
        "candidates": [
            {
                "name": "Aarav Sharma",
                "score": 0.94,
                "label": "Strong Match",
                "skills": ["Python", "PyTorch", "Hugging Face", "Transformers", "NLP", "FastAPI", "Docker", "PostgreSQL", "LangChain"],
                "resume": """Aarav Sharma - Machine Learning Engineer
Email: aarav.sharma@example.com | GitHub: github.com/aarav-ml

Summary:
Applied Machine Learning Engineer with 4 years of experience building and deploying NLP models and transformer pipelines. Experienced in fine-tuning BERT and Llama models, building vector search engines with pgvector, and deploying scalable microservices with FastAPI and Docker.

Experience:
Senior ML Engineer at CogniTech (2022 - Present)
- Fine-tuned transformer models using PyTorch and Hugging Face for semantic document search, achieving 91% Top-3 retrieval accuracy.
- Built low-latency inference service handling 5M requests/day using FastAPI, Docker, and Kubernetes on AWS.
- Designed vector embedding pipelines using Scikit-learn and FAISS for candidate-job matching.

ML Engineer at DataFlow Labs (2020 - 2022)
- Implemented text classification and named-entity recognition (NER) pipelines with PyTorch and Spacy.
- Containerized training jobs and automated model tracking with MLflow.

Skills:
Languages & Frameworks: Python, PyTorch, Scikit-learn, Hugging Face, Transformers, FastAPI, Docker, PostgreSQL, NLP, LangChain."""
            },
            {
                "name": "Priya Nair",
                "score": 0.78,
                "label": "Good Match",
                "skills": ["Python", "TensorFlow", "Scikit-learn", "Docker", "FastAPI", "Pandas", "SQL"],
                "resume": """Priya Nair - Data Scientist & ML Practitioner
Email: priya.nair@example.com

Summary:
Data Scientist with 3.5 years of experience in predictive analytics and computer vision. Strong background in Python, TensorFlow, and classical ML algorithms. Looking to transition into core NLP and transformer systems.

Experience:
Data Scientist at InsightAI (2021 - Present)
- Built predictive models using Python, Scikit-learn, and TensorFlow with automated pipelines.
- Deployed prediction microservices using FastAPI and Docker.
- Collaborated with engineering to integrate models into relational databases (PostgreSQL).

Skills:
Python, TensorFlow, Scikit-learn, Docker, FastAPI, Pandas, NumPy, SQL, OpenCV."""
            },
            {
                "name": "Marcus Vance",
                "score": 0.52,
                "label": "Moderate Match",
                "skills": ["Python", "Django", "PostgreSQL", "JavaScript", "Docker"],
                "resume": """Marcus Vance - Python Backend Developer
Email: marcus.v@example.com

Summary:
Backend developer with 3 years of experience building web applications using Python and Django. Basic exposure to Scikit-learn for simple tabular regressions, but primarily focused on CRUD APIs and database optimization.

Experience:
Backend Engineer at WebForge (2021 - Present)
- Developed RESTful APIs with Python and Django.
- Managed PostgreSQL database migrations and Docker containerization.
- Experimented with basic Python NLP libraries (NLTK) for sentiment tagging.

Skills:
Python, Django, PostgreSQL, Docker, Git, REST APIs, Basic Scikit-learn."""
            },
            {
                "name": "Emily Watson",
                "score": 0.22,
                "label": "Low Match",
                "skills": ["HTML", "CSS", "WordPress", "PHP", "SEO"],
                "resume": """Emily Watson - Digital Marketer & Web Specialist
Email: emily.watson@example.com

Summary:
Digital marketing specialist with 4 years of experience optimizing WordPress blogs, landing page conversion rates, and on-page SEO.

Experience:
Web Content Coordinator at MarketReach (2020 - Present)
- Maintained client websites using WordPress, PHP, and basic CSS.
- Monitored Google Analytics and keyword rankings.

Skills:
WordPress, HTML5, CSS3, SEO, Copywriting, Google Analytics."""
            }
        ]
    },
    {
        "role": "Senior Full-Stack Engineer",
        "jd_template": """Job Title: Senior Full-Stack Engineer (React & Node.js)
Department: Core Engineering
Required Experience: 4+ years

About The Role:
We need a Senior Full-Stack Engineer to architect and build scalable web applications. You will be responsible for end-to-end development, from designing responsive React interfaces to building robust backend APIs with Node.js and PostgreSQL.

Key Responsibilities:
- Build modular, high-performance UI components with React, TypeScript, and Tailwind CSS.
- Architect RESTful and GraphQL APIs using Node.js, Express, or NestJS.
- Optimize database queries, schema design, and migrations with PostgreSQL.
- Write unit and integration tests, containerize applications with Docker, and configure CI/CD.

Required Skills:
- React, TypeScript, Node.js, Express, PostgreSQL, Tailwind CSS, REST API, Git, Docker.""",
        "required_skills": ["React", "TypeScript", "Node.js", "Express", "PostgreSQL", "Tailwind CSS", "REST API", "Docker"],
        "candidates": [
            {
                "name": "Vikram Patel",
                "score": 0.96,
                "label": "Strong Match",
                "skills": ["React", "TypeScript", "Node.js", "Express", "PostgreSQL", "Tailwind CSS", "Docker", "GraphQL", "Git"],
                "resume": """Vikram Patel - Senior Full-Stack Engineer
Email: vikram.patel@example.com | Portfolio: vikramdev.io

Summary:
Full-Stack Engineer with 5 years of experience delivering SaaS products with React, TypeScript, and Node.js. Passionate about responsive UI, clean architecture, and PostgreSQL database performance.

Experience:
Senior Software Engineer at CloudScale (2021 - Present)
- Led frontend redesign using React 18, TypeScript, and Tailwind CSS, increasing page load speed by 42%.
- Engineered high-throughput microservices using Node.js, Express, and PostgreSQL, handling over 10k concurrent users.
- Implemented Docker containerization and automated CI/CD deployments via GitHub Actions.

Full-Stack Developer at NextGen Apps (2019 - 2021)
- Built interactive dashboards with React and GraphQL.
- Designed relational schemas and indexing strategies in PostgreSQL.

Skills:
React, TypeScript, Node.js, Express, PostgreSQL, Tailwind CSS, Docker, GraphQL, REST API, Git, Vitest."""
            },
            {
                "name": "Chloe Bennett",
                "score": 0.74,
                "label": "Good Match",
                "skills": ["React", "JavaScript", "Node.js", "MongoDB", "Express", "CSS3"],
                "resume": """Chloe Bennett - Full Stack Developer (MERN)
Email: chloe.bennett@example.com

Summary:
Full stack developer with 3.5 years of experience in the MERN stack (MongoDB, Express, React, Node.js). Strong at creating interactive user interfaces and RESTful web services. Familiar with TypeScript basics.

Experience:
Software Engineer at AppWorks (2021 - Present)
- Developed dynamic single-page web applications with React and Redux.
- Built backend APIs with Node.js, Express, and MongoDB.
- Created styled interfaces using CSS3 and Bootstrap.

Skills:
React, JavaScript, Node.js, Express, MongoDB, REST APIs, Git, HTML5, CSS3."""
            },
            {
                "name": "Daniel Kim",
                "score": 0.50,
                "label": "Moderate Match",
                "skills": ["Java", "Spring Boot", "MySQL", "Angular", "Docker"],
                "resume": """Daniel Kim - Java / Enterprise Developer
Email: daniel.kim@example.com

Summary:
Enterprise software engineer with 4 years of experience building microservices with Java and Spring Boot. Secondary experience with Angular on internal portals.

Experience:
Java Developer at FinSys (2020 - Present)
- Developed core banking APIs using Java, Spring Boot, and MySQL.
- Maintained legacy frontend components built with Angular.

Skills:
Java, Spring Boot, MySQL, Angular, Docker, REST API, Git."""
            },
            {
                "name": "Samantha Reed",
                "score": 0.20,
                "label": "Low Match",
                "skills": ["Manual Testing", "Jira", "Selenium", "Postman"],
                "resume": """Samantha Reed - QA & Test Analyst
Email: samantha.reed@example.com

Summary:
Quality Assurance Analyst with 3 years of experience in manual test case execution, regression testing, and bug reporting in Jira.

Experience:
QA Tester at SoftVerify (2021 - Present)
- Wrote detailed bug reports and validated fix releases.
- Tested REST APIs using Postman.

Skills:
Manual Testing, Regression Testing, Jira, Postman, TestRail."""
            }
        ]
    },
    {
        "role": "Cloud DevOps & Platform Engineer",
        "jd_template": """Job Title: Cloud DevOps & Platform Engineer
Department: Infrastructure & Reliability
Required Experience: 4+ years

About The Role:
We are looking for a Cloud DevOps Engineer to scale cloud infrastructure, optimize Kubernetes deployments, and maintain automated CI/CD pipelines across AWS environments.

Key Responsibilities:
- Architect and manage multi-region Kubernetes (EKS) clusters.
- Write modular Infrastructure as Code using Terraform.
- Build automated, secure CI/CD pipelines with GitHub Actions or GitLab CI.
- Monitor system reliability, latency, and uptime using Prometheus and Grafana.

Required Skills:
- Kubernetes, Docker, AWS, Terraform, CI/CD, Linux, Prometheus, Grafana, Python/Bash.""",
        "required_skills": ["Kubernetes", "Docker", "AWS", "Terraform", "CI/CD", "Linux", "Prometheus", "Grafana"],
        "candidates": [
            {
                "name": "Rahul Verma",
                "score": 0.95,
                "label": "Strong Match",
                "skills": ["Kubernetes", "Docker", "AWS", "Terraform", "CI/CD", "Linux", "Prometheus", "Grafana", "Python", "Helm"],
                "resume": """Rahul Verma - Senior DevOps & Platform Engineer
Email: rahul.v@example.com | Certifications: CKA, AWS Solutions Architect

Summary:
DevOps Engineer with 5+ years of experience specializing in Kubernetes orchestration, Terraform automation, and AWS cloud architecture. Proven record of achieving 99.99% uptime.

Experience:
Lead DevOps Engineer at InfraCloud (2021 - Present)
- Provisioned and managed 12 production Kubernetes (EKS) clusters across AWS regions using Terraform.
- Built reusable GitHub Actions CI/CD pipelines reducing deployment cycle time from 45m to 8m.
- Configured Prometheus, Alertmanager, and Grafana dashboards for real-time observability.

Cloud Engineer at SystemsCo (2019 - 2021)
- Automated AWS EC2 and RDS deployments using Terraform and Ansible.
- Containerized legacy applications using Docker and migrated to Linux hosts.

Skills:
Kubernetes, Docker, AWS, Terraform, CI/CD, Linux, Prometheus, Grafana, Helm, Python, Bash, Git."""
            },
            {
                "name": "Lucas Meyer",
                "score": 0.72,
                "label": "Good Match",
                "skills": ["Docker", "Linux", "Azure", "CI/CD", "Bash", "Git"],
                "resume": """Lucas Meyer - Systems Administrator & Cloud Specialist
Email: lucas.meyer@example.com

Summary:
Systems administrator with 4 years of experience managing Linux servers and Azure cloud environments. Strong containerization skills with Docker; currently expanding Kubernetes knowledge.

Experience:
SysAdmin at GlobalNet (2020 - Present)
- Managed Linux (Ubuntu/RHEL) server fleets and internal Azure VMs.
- Created automated backup scripts and CI/CD pipelines using GitLab CI.
- Containerized internal services with Docker.

Skills:
Linux, Docker, Azure, CI/CD, Bash scripting, Git, Nginx."""
            },
            {
                "name": "Jessica Taylor",
                "score": 0.38,
                "label": "Low Match",
                "skills": ["React", "CSS3", "JavaScript", "Figma"],
                "resume": """Jessica Taylor - UI/UX Designer & Frontend Developer
Email: jessica.t@example.com

Summary:
Frontend designer with 3 years of experience turning Figma designs into responsive HTML, CSS, and basic React interfaces.

Skills:
Figma, UI/UX Design, HTML5, CSS3, JavaScript, React."""
            }
        ]
    },
    {
        "role": "Data Engineer / Analytics Specialist",
        "jd_template": """Job Title: Senior Data Engineer
Department: Data Platform
Required Experience: 3-5 years

About The Role:
We are seeking a Senior Data Engineer to design, build, and optimize scalable batch and streaming data pipelines. You will partner with data scientists and analytics teams to provide clean, reliable data warehouses.

Key Responsibilities:
- Build ETL/ELT data pipelines using Python, Apache Spark, and SQL.
- Orchestrate data workflows using Apache Airflow.
- Architect data models in Snowflake, BigQuery, or Redshift.
- Ensure data quality, schema enforcement, and lineage tracking.

Required Skills:
- Python, Apache Spark, SQL, Airflow, Snowflake, ETL, Data Warehousing, Docker.""",
        "required_skills": ["Python", "Spark", "SQL", "Airflow", "Snowflake", "ETL", "Data Warehousing"],
        "candidates": [
            {
                "name": "Ananya Gupta",
                "score": 0.93,
                "label": "Strong Match",
                "skills": ["Python", "Spark", "SQL", "Airflow", "Snowflake", "ETL", "Data Warehousing", "dbt", "Docker"],
                "resume": """Ananya Gupta - Senior Data Engineer
Email: ananya.gupta@example.com

Summary:
Data Engineer with 4.5 years of experience building production data pipelines and cloud data warehouses. Expert in Apache Spark (PySpark), Airflow orchestration, and Snowflake modeling.

Experience:
Senior Data Engineer at DataMesh (2022 - Present)
- Designed automated PySpark pipelines processing over 3TB of daily clickstream events into Snowflake.
- Managed 60+ Airflow DAGs with custom operators and SLA alerts.
- Implemented dbt models and schema tests reducing data anomalies by 75%.

Data Engineer at FinData (2020 - 2022)
- Built SQL ETL workflows on AWS Redshift and PostgreSQL.

Skills:
Python, PySpark, Apache Spark, SQL, Airflow, Snowflake, ETL, Data Warehousing, dbt, Docker, Git."""
            },
            {
                "name": "Rohan Deshmukh",
                "score": 0.68,
                "label": "Moderate Match",
                "skills": ["SQL", "Python", "Tableau", "PowerBI", "Pandas"],
                "resume": """Rohan Deshmukh - Senior BI & Data Analyst
Email: rohan.d@example.com

Summary:
Business Intelligence Analyst with 4 years of experience writing advanced SQL queries, building Tableau executive dashboards, and basic Python data processing with Pandas.

Experience:
BI Analyst at RetailPulse (2020 - Present)
- Created interactive dashboards in Tableau and PowerBI.
- Wrote complex SQL queries and stored procedures to aggregate business KPIs.

Skills:
SQL, Tableau, PowerBI, Python, Pandas, Excel, Data Analysis."""
            }
        ]
    },
    {
        "role": "Mobile iOS / Swift Engineer",
        "jd_template": """Job Title: Senior iOS Engineer
Department: Consumer Mobile Apps
Required Experience: 4+ years

About The Role:
We are seeking an experienced iOS Engineer to lead feature development on our flagship iOS app used by millions of daily users. You will write clean, testable Swift code and design smooth animations.

Key Responsibilities:
- Build performant native iOS interfaces using SwiftUI and UIKit.
- Architect offline-first storage and syncing with CoreData or Realm.
- Integrate RESTful APIs and real-time WebSockets.
- Optimize app memory, launch time, and battery consumption.

Required Skills:
- Swift, SwiftUI, UIKit, CoreData, Xcode, REST API, Git, Unit Testing.""",
        "required_skills": ["Swift", "SwiftUI", "UIKit", "CoreData", "Xcode", "REST API", "Unit Testing"],
        "candidates": [
            {
                "name": "Kavita Reddy",
                "score": 0.94,
                "label": "Strong Match",
                "skills": ["Swift", "SwiftUI", "UIKit", "CoreData", "Xcode", "REST API", "Unit Testing", "Combine", "Git"],
                "resume": """Kavita Reddy - Senior iOS Developer
Email: kavita.reddy@example.com

Summary:
iOS developer with 5 years of native app development experience. Deep expertise in Swift, SwiftUI, and declarative UI patterns with Combine.

Experience:
Senior iOS Engineer at AppVibe (2021 - Present)
- Architected new consumer features in SwiftUI and UIKit.
- Implemented persistent caching with CoreData and background sync.
- Maintained 99.8% crash-free rate across 2M active devices.

Skills:
Swift, SwiftUI, UIKit, CoreData, Xcode, Combine, REST API, Unit Testing, Git."""
            },
            {
                "name": "Devin Brooks",
                "score": 0.65,
                "label": "Moderate Match",
                "skills": ["React Native", "JavaScript", "TypeScript", "Redux", "REST API"],
                "resume": """Devin Brooks - Cross-Platform Mobile Engineer
Email: devin.b@example.com

Summary:
Mobile engineer with 3 years of experience building cross-platform apps with React Native. Understands mobile lifecycle; learning native Swift.

Experience:
Mobile Dev at FlexApps (2021 - Present)
- Built iOS and Android apps using React Native and Expo.
- Integrated REST APIs and push notifications.

Skills:
React Native, JavaScript, TypeScript, Redux, REST API, Git, Mobile UX."""
            },
            {
                "name": "Alex Vance",
                "score": 0.18,
                "label": "Low Match",
                "skills": ["Kubernetes", "Docker", "Terraform", "Linux"],
                "resume": """Alex Vance - Site Reliability Engineer
Email: alex.vance@example.com

Summary:
SRE engineer specializing in Linux kernel tuning, Terraform infrastructure, and Kubernetes cluster operations. No mobile app experience.

Skills:
Kubernetes, Docker, Terraform, Linux, Prometheus, AWS."""
            }
        ]
    },
    {
        "role": "Cybersecurity & Application Security Engineer",
        "jd_template": """Job Title: Application Security Engineer
Department: InfoSec & Governance
Required Experience: 3-5 years

About The Role:
We need an Application Security Engineer to secure our software development lifecycle (SDLC), conduct vulnerability assessments, and implement Zero-Trust access controls.

Key Responsibilities:
- Conduct static and dynamic application security testing (SAST/DAST).
- Triage OWASP Top 10 vulnerabilities and advise developers on remediation.
- Audit authentication and authorization flows (OAuth2, OIDC, JWT).
- Implement automated container and dependency scanning in CI/CD.

Required Skills:
- Cybersecurity, OWASP, Penetration Testing, SAST/DAST, OAuth, Python, Linux.""",
        "required_skills": ["Cybersecurity", "OWASP", "Penetration Testing", "SAST", "DAST", "OAuth", "Python", "Linux"],
        "candidates": [
            {
                "name": "Zackary Stone",
                "score": 0.95,
                "label": "Strong Match",
                "skills": ["Cybersecurity", "OWASP", "Penetration Testing", "SAST", "DAST", "OAuth", "Python", "Linux", "Burp Suite"],
                "resume": """Zackary Stone - Application Security Specialist
Email: zack.stone@example.com | OSCP, CISSP

Summary:
Security engineer with 4.5 years of experience in vulnerability assessments, penetration testing, and securing cloud-native CI/CD pipelines.

Experience:
AppSec Engineer at CyberDefend (2021 - Present)
- Performed SAST/DAST code reviews and penetration tests on microservices.
- Remediated OWASP Top 10 vulnerabilities across web applications.
- Built automated security gates into GitHub Actions with Python scripts.

Skills:
Cybersecurity, OWASP, Penetration Testing, SAST, DAST, OAuth, Burp Suite, Python, Linux, Docker."""
            },
            {
                "name": "Tariq Mansoor",
                "score": 0.58,
                "label": "Moderate Match",
                "skills": ["Linux", "Network Security", "Firewalls", "Python"],
                "resume": """Tariq Mansoor - Network Security Administrator
Email: tariq.m@example.com

Summary:
Network security admin with 3.5 years of experience configuring enterprise firewalls, VPNs, and monitoring Linux network traffic. Limited software code auditing experience.

Skills:
Linux, Network Security, Firewalls, Cisco, Python, Wireshark, TCP/IP."""
            }
        ]
    },
    {
        "role": "Backend Go / Microservices Engineer",
        "jd_template": """Job Title: Senior Backend Engineer (Go / Microservices)
Department: Platform & Core Services
Required Experience: 4+ years

About The Role:
Seeking an experienced Backend Engineer to build high-throughput distributed microservices in Go. You will architect gRPC communication, Kafka event streams, and PostgreSQL data stores.

Key Responsibilities:
- Design and maintain low-latency microservices in Go (Golang).
- Implement asynchronous event-driven streaming with Apache Kafka.
- Optimize database transactions and caching with PostgreSQL and Redis.
- Instrument services with OpenTelemetry and Prometheus.

Required Skills:
- Go, Golang, Microservices, gRPC, Kafka, PostgreSQL, Redis, Docker, Git.""",
        "required_skills": ["Go", "Golang", "Microservices", "gRPC", "Kafka", "PostgreSQL", "Redis", "Docker"],
        "candidates": [
            {
                "name": "Dmitri Volkov",
                "score": 0.96,
                "label": "Strong Match",
                "skills": ["Go", "Golang", "Microservices", "gRPC", "Kafka", "PostgreSQL", "Redis", "Docker", "Kubernetes"],
                "resume": """Dmitri Volkov - Senior Go Backend Engineer
Email: dmitri.volkov@example.com

Summary:
Distributed systems engineer with 5 years of experience writing high-performance Go microservices. Specialized in event-driven streaming with Kafka and gRPC.

Experience:
Senior Backend Engineer at StreamTech (2021 - Present)
- Built real-time payment processing service in Go handling 25k transactions/second.
- Designed gRPC interfaces and Kafka event streams with zero data loss.
- Optimized PostgreSQL indexing and Redis cache layers for sub-5ms latencies.

Skills:
Go, Golang, Microservices, gRPC, Kafka, PostgreSQL, Redis, Docker, Kubernetes, Linux, Git."""
            },
            {
                "name": "Amina Bello",
                "score": 0.70,
                "label": "Good Match",
                "skills": ["Java", "Spring Boot", "Kafka", "PostgreSQL", "Docker", "Microservices"],
                "resume": """Amina Bello - Backend Software Engineer
Email: amina.b@example.com

Summary:
Backend developer with 4 years of experience building microservices with Java, Spring Boot, and Kafka. Enthusiastic about transitioning full-time into Go.

Skills:
Java, Spring Boot, Kafka, PostgreSQL, Docker, Microservices, Git, Basic Go."""
            }
        ]
    }
]

def generate_dataset(output_dir="."):
    os.makedirs(output_dir, exist_ok=True)
    dataset = []
    sample_id = 1

    for role_item in ROLES:
        role_name = role_item["role"]
        jd_text = role_item["jd_template"].strip()
        req_skills = role_item["required_skills"]

        for cand in role_item["candidates"]:
            cand_name = cand["name"]
            score = cand["score"]
            label = cand["label"]
            cand_skills = cand["skills"]
            resume_text = cand["resume"].strip()

            matched = [s for s in req_skills if s.lower() in [cs.lower() for cs in cand_skills] or s.lower() in resume_text.lower()]
            missing = [s for s in req_skills if s not in matched]

            entry = {
                "id": f"PAIR-{sample_id:04d}",
                "job_title": role_name,
                "job_description": jd_text,
                "required_skills": req_skills,
                "candidate_name": cand_name,
                "resume_text": resume_text,
                "candidate_skills": cand_skills,
                "matched_skills": matched,
                "missing_skills": missing,
                "match_score": round(score, 2),
                "label": label
            }
            dataset.append(entry)
            sample_id += 1

    # Also generate cross-role negative pairs (essential for contrastive learning)
    all_candidates = []
    for r in ROLES:
        for c in r["candidates"]:
            all_candidates.append((r["role"], c))

    for role_item in ROLES:
        role_name = role_item["role"]
        jd_text = role_item["jd_template"].strip()
        req_skills = role_item["required_skills"]

        # Select candidates from other roles to serve as true negatives
        other_candidates = [c for r_name, c in all_candidates if r_name != role_name]
        # Pick 2-3 distinct negative candidates
        sampled_negatives = random.sample(other_candidates, min(3, len(other_candidates)))

        for neg_cand in sampled_negatives:
            matched = [s for s in req_skills if s.lower() in [cs.lower() for cs in neg_cand["skills"]]]
            missing = [s for s in req_skills if s not in matched]
            overlap_ratio = len(matched) / max(1, len(req_skills))
            neg_score = round(max(0.10, min(0.38, overlap_ratio * 0.4 + random.uniform(0.08, 0.22))), 2)

            entry = {
                "id": f"PAIR-{sample_id:04d}",
                "job_title": role_name,
                "job_description": jd_text,
                "required_skills": req_skills,
                "candidate_name": f"{neg_cand['name']} (Cross-Domain)",
                "resume_text": neg_cand["resume"].strip(),
                "candidate_skills": neg_cand["skills"],
                "matched_skills": matched,
                "missing_skills": missing,
                "match_score": neg_score,
                "label": "Low Match"
            }
            dataset.append(entry)
            sample_id += 1

    # Write JSON
    json_path = os.path.join(output_dir, "jd_resume_dataset.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(dataset, f, indent=2, ensure_ascii=False)

    # Write CSV
    csv_path = os.path.join(output_dir, "jd_resume_dataset.csv")
    fieldnames = [
        "id", "job_title", "job_description", "required_skills",
        "candidate_name", "resume_text", "candidate_skills",
        "matched_skills", "missing_skills", "match_score", "label"
    ]

    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for item in dataset:
            row = item.copy()
            row["required_skills"] = "; ".join(row["required_skills"])
            row["candidate_skills"] = "; ".join(row["candidate_skills"])
            row["matched_skills"] = "; ".join(row["matched_skills"])
            row["missing_skills"] = "; ".join(row["missing_skills"])
            writer.writerow(row)

    print(f"Successfully generated {len(dataset)} mock JD-Resume pairs.")
    print(f"JSON saved to: {json_path}")
    print(f"CSV saved to:  {csv_path}")
    return dataset

if __name__ == "__main__":
    current_dir = os.path.dirname(os.path.abspath(__file__))
    generate_dataset(current_dir)
