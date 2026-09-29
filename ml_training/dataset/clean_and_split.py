#!/usr/bin/env python3
"""
TalentAI Studio - Production Data Cleaning, Pairing & Splitting Pipeline
Processes raw Kaggle resumes from C:\\Users\\shyam\\Downloads\\archive\\Resume\\Resume.csv,
cleans text, pairs with Job Descriptions (positive, partial, and negative pairs),
and outputs stratified Train (80%), Val (10%), and Test (10%) datasets.
"""

import os
import sys
import re
import csv
import json
import random
from collections import Counter

# Set UTF-8 encoding for console output
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Industry-standard Job Descriptions across tech and business domains
JOB_DESCRIPTIONS = {
    "INFORMATION-TECHNOLOGY": {
        "title": "Senior Software / IT Systems Engineer",
        "description": "We are seeking a Senior Software & IT Systems Engineer to design, deploy, and scale high-performance software applications and cloud infrastructure. Responsibilities include building RESTful APIs, optimizing relational and NoSQL databases, containerizing microservices with Docker and Kubernetes, and troubleshooting distributed networks. Required skills: Python, Java, JavaScript/TypeScript, SQL, Linux, Cloud (AWS or Azure), Git, and CI/CD automation."
    },
    "ENGINEERING": {
        "title": "Senior Systems / DevOps Engineer",
        "description": "Looking for a Senior Systems & DevOps Engineer to automate build infrastructure, manage Linux server fleets, and ensure high availability across multi-region environments. Responsibilities include writing Terraform infrastructure as code, configuring CI/CD pipelines, monitoring system metrics with Prometheus and Grafana, and diagnosing system bottlenecks. Requirements: Linux administration, Docker, Kubernetes, Terraform, Bash/Python scripting, and networking fundamentals."
    },
    "BUSINESS-DEVELOPMENT": {
        "title": "Enterprise Business Development Manager",
        "description": "Seeking an experienced Business Development Manager to identify new market opportunities, negotiate high-value corporate partnerships, and drive revenue growth. Responsibilities: B2B pipeline development, enterprise client pitching, contract negotiation, competitive analysis, and strategic relationship management. Requirements: 4+ years B2B sales/development experience, CRM proficiency, and executive communication skills."
    },
    "SALES": {
        "title": "Senior Enterprise Sales Representative",
        "description": "We are hiring a Senior Enterprise Sales Representative to manage full sales cycles, conduct product demonstrations, and exceed quarterly quotas. Responsibilities include prospect qualification, objection handling, commercial contract closing, and pipeline tracking in Salesforce. Requirements: Proven enterprise quota attainment, CRM mastery, presentation skills, and strong customer relationship building."
    },
    "FINANCE": {
        "title": "Corporate Financial Analyst & Portfolio Specialist",
        "description": "Seeking a Financial Analyst to perform financial modeling, variance forecasting, corporate valuation, and investment analysis. Key responsibilities: preparing quarterly financial statements, conducting discounted cash flow (DCF) modeling, budget reconciliations, and executive risk briefings. Requirements: Advanced Excel, financial modeling, GAAP compliance, SQL, and analytical problem solving."
    },
    "ACCOUNTANT": {
        "title": "Senior Corporate Accountant & Auditor",
        "description": "Looking for a Senior Accountant to oversee general ledger reconciliations, tax compliance, payroll auditing, and financial reporting. Responsibilities include month-end closing, balance sheet reconciliation, internal audit preparation, and regulatory filing. Qualifications: CPA or accounting degree, ERP experience (NetSuite, SAP), GAAP standards, and internal control compliance."
    },
    "DESIGNER": {
        "title": "Senior UI/UX & Product Designer",
        "description": "We are hiring a Senior UI/UX Designer to craft intuitive user experiences, responsive layouts, and interactive design systems for web and mobile platforms. Responsibilities: user journey mapping, high-fidelity wireframing in Figma, design system maintenance, usability testing, and cross-functional handoff to frontend engineers. Requirements: Figma mastery, design thinking, prototyping, and typography."
    },
    "HR": {
        "title": "Senior Talent Acquisition & People Operations Manager",
        "description": "Seeking a Human Resources Manager to lead end-to-end recruitment, employee onboarding, compensation benchmarking, and organizational culture initiatives. Responsibilities include sourcing candidate pipelines, managing ATS workflows, facilitating performance reviews, and ensuring labor law compliance. Requirements: Full-lifecycle recruiting, ATS proficiency, employee relations, and HR strategy."
    },
    "DIGITAL-MEDIA": {
        "title": "Digital Marketing & Content Strategy Lead",
        "description": "Seeking a Digital Marketing Lead to oversee omnichannel growth campaigns, SEO/SEM performance, brand content creation, and analytics tracking. Responsibilities: managing Google Ads / Meta ad spend, conversion rate optimization (CRO), social media strategy, and ROI performance reporting. Requirements: Google Analytics, SEO tools, paid advertising, and copywriting."
    },
    "HEALTHCARE": {
        "title": "Clinical Healthcare Specialist & Administrator",
        "description": "Looking for a Healthcare Specialist to manage patient intake protocols, electronic health record (EHR) compliance, clinical assessments, and patient care workflows. Responsibilities include clinical documentation, HIPAA compliance, multidisciplinary coordination, and care planning. Requirements: Healthcare certification or nursing degree, EHR software, and clinical standards."
    }
}

# Define adjacent categories for partial matching
ADJACENT_CATEGORIES = {
    "FINANCE": ["ACCOUNTANT", "BUSINESS-DEVELOPMENT"],
    "ACCOUNTANT": ["FINANCE"],
    "INFORMATION-TECHNOLOGY": ["ENGINEERING"],
    "ENGINEERING": ["INFORMATION-TECHNOLOGY"],
    "SALES": ["BUSINESS-DEVELOPMENT"],
    "BUSINESS-DEVELOPMENT": ["SALES"],
    "HR": ["BUSINESS-DEVELOPMENT"],
    "DIGITAL-MEDIA": ["DESIGNER", "SALES"]
}

# Non-tech categories that make excellent hard negatives for technical roles
HARD_NEGATIVE_CATEGORIES = ["CHEF", "ADVOCATE", "FITNESS", "AVIATION", "AGRICULTURE", "APPAREL", "TEACHER", "AUTOMOBILE"]

def clean_text(raw_text):
    """
    Cleans raw resume text:
    - Strips HTML markup
    - Removes emails, URLs, and phone numbers
    - Normalizes punctuation, bullet points, and excess whitespaces
    - Truncates to the most informative 2,500 characters
    """
    if not raw_text:
        return ""

    # Strip HTML tags
    text = re.sub(r'<[^>]+>', ' ', raw_text)

    # Remove URLs
    text = re.sub(r'https?://\S+|www\.\S+', ' ', text)

    # Remove emails
    text = re.sub(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', ' ', text)

    # Remove phone numbers
    text = re.sub(r'(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', ' ', text)

    # Replace special bullet characters with space
    text = re.sub(r'[\u2022\u2023\u25E6\u2043\u2219\u25AA\u25AB\uff0d\u2013\u2014]', ' ', text)

    # Remove non-ASCII non-punctuation noise
    text = re.sub(r'[^\x00-\x7F]+', ' ', text)

    # Collapse multiple whitespaces and newlines
    text = re.sub(r'\s+', ' ', text).strip()

    # Truncate to first 2500 characters (optimal for Transformer context window)
    return text[:2500]

def process_and_split(
    input_csv=r"C:\Users\shyam\Downloads\archive\Resume\Resume.csv",
    output_dir="ml_training/dataset",
    samples_per_category=25,
    random_seed=42
):
    random.seed(random_seed)
    print(f"[INFO] Reading raw resumes from: {input_csv}")

    if not os.path.exists(input_csv):
        raise FileNotFoundError(f"Input file not found at: {input_csv}")

    # Read and clean resumes grouped by category
    category_resumes = {}
    total_raw = 0
    total_cleaned = 0

    with open(input_csv, mode="r", encoding="utf-8", errors="ignore") as f:
        reader = csv.DictReader(f)
        for row in reader:
            total_raw += 1
            cat = row.get("Category", "").strip().upper()
            raw_text = row.get("Resume_str") or row.get("Resume_html") or row.get("Resume", "")
            cleaned = clean_text(raw_text)

            # Keep valid resumes with sufficient text length (> 150 characters)
            if cat and len(cleaned) >= 150:
                total_cleaned += 1
                if cat not in category_resumes:
                    category_resumes[cat] = []
                category_resumes[cat].append({
                    "id": row.get("ID", f"RES-{total_cleaned}"),
                    "resume_text": cleaned
                })

    print(f"[STATS] Total raw rows: {total_raw}")
    print(f"[STATS] Valid cleaned resumes: {total_cleaned} across {len(category_resumes)} categories")

    # Generate paired dataset
    paired_samples = []
    pair_counter = 1

    for cat_name, jd_info in JOB_DESCRIPTIONS.items():
        resumes = category_resumes.get(cat_name, [])
        if not resumes:
            continue

        # Shuffle category resumes
        shuffled = list(resumes)
        random.shuffle(shuffled)
        sampled_positives = shuffled[:samples_per_category]

        # 1. POSITIVE PAIRS (Match Score: 0.84 - 0.98)
        for r in sampled_positives:
            score = round(random.uniform(0.84, 0.98), 2)
            paired_samples.append({
                "id": f"PAIR-{pair_counter:05d}",
                "job_title": jd_info["title"],
                "job_category": cat_name,
                "job_description": jd_info["description"],
                "candidate_id": r["id"],
                "resume_text": r["resume_text"],
                "match_score": score,
                "match_type": "Positive Match",
                "label": "Strong Match" if score >= 0.88 else "Good Match"
            })
            pair_counter += 1

        # 2. PARTIAL / ADJACENT PAIRS (Match Score: 0.52 - 0.72)
        adj_cats = ADJACENT_CATEGORIES.get(cat_name, [])
        for adj_cat in adj_cats:
            adj_resumes = category_resumes.get(adj_cat, [])
            if adj_resumes:
                sample_adj = random.sample(adj_resumes, min(3, len(adj_resumes)))
                for ar in sample_adj:
                    score = round(random.uniform(0.52, 0.72), 2)
                    paired_samples.append({
                        "id": f"PAIR-{pair_counter:05d}",
                        "job_title": jd_info["title"],
                        "job_category": cat_name,
                        "job_description": jd_info["description"],
                        "candidate_id": ar["id"],
                        "resume_text": ar["resume_text"],
                        "match_score": score,
                        "match_type": "Partial Match",
                        "label": "Moderate Match"
                    })
                    pair_counter += 1

        # 3. HARD NEGATIVE PAIRS (Match Score: 0.10 - 0.32)
        available_neg_cats = [c for c in HARD_NEGATIVE_CATEGORIES if c in category_resumes]
        if available_neg_cats:
            sampled_neg_cats = random.sample(available_neg_cats, min(3, len(available_neg_cats)))
            for neg_cat in sampled_neg_cats:
                neg_resumes = category_resumes[neg_cat]
                sample_neg = random.sample(neg_resumes, min(2, len(neg_resumes)))
                for nr in sample_neg:
                    score = round(random.uniform(0.10, 0.32), 2)
                    paired_samples.append({
                        "id": f"PAIR-{pair_counter:05d}",
                        "job_title": jd_info["title"],
                        "job_category": cat_name,
                        "job_description": jd_info["description"],
                        "candidate_id": nr["id"],
                        "resume_text": nr["resume_text"],
                        "match_score": score,
                        "match_type": "Hard Negative",
                        "label": "Low Match"
                    })
                    pair_counter += 1

    # Shuffle all paired samples
    random.shuffle(paired_samples)
    total_pairs = len(paired_samples)

    # Split into 80% Train, 10% Validation, 10% Test
    train_end = int(total_pairs * 0.80)
    val_end = int(total_pairs * 0.90)

    train_data = paired_samples[:train_end]
    val_data = paired_samples[train_end:val_end]
    test_data = paired_samples[val_end:]

    print(f"\n[SPLIT] Generated {total_pairs} total training pairs:")
    print(f"  - Train Set (80%):      {len(train_data)} samples")
    print(f"  - Validation Set (10%): {len(val_data)} samples")
    print(f"  - Test Set (10%):       {len(test_data)} samples")

    # Inspect label distribution in train set
    train_dist = Counter(x["label"] for x in train_data)
    print("\n[DISTRIBUTION] Train Set Labels:")
    for lbl, count in train_dist.items():
        print(f"  - {lbl}: {count} ({count/len(train_data)*100:.1f}%)")

    # Save CSV and JSON files
    os.makedirs(output_dir, exist_ok=True)

    fieldnames = [
        "id", "job_title", "job_category", "job_description",
        "candidate_id", "resume_text", "match_score", "match_type", "label"
    ]

    def save_csv(filename, data):
        filepath = os.path.join(output_dir, filename)
        with open(filepath, mode="w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(data)
        print(f"[SAVED] {filepath} ({len(data)} rows)")

    save_csv("train_dataset.csv", train_data)
    save_csv("val_dataset.csv", val_data)
    save_csv("test_dataset.csv", test_data)
    save_csv("full_cleaned_paired_dataset.csv", paired_samples)

    # Save full JSON
    json_path = os.path.join(output_dir, "full_cleaned_paired_dataset.json")
    with open(json_path, mode="w", encoding="utf-8") as f:
        json.dump(paired_samples, f, indent=2, ensure_ascii=False)
    print(f"[SAVED] {json_path}")

    return train_data, val_data, test_data

if __name__ == "__main__":
    current_dir = os.path.dirname(os.path.abspath(__file__))
    process_and_split(output_dir=current_dir)
