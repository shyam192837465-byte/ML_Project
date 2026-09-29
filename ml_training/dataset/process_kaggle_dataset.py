#!/usr/bin/env python3
"""
TalentAI Studio - Kaggle Resume Dataset Downloader & Pair Generator
Downloads 'snehaanbhawal/resume-dataset' via kagglehub, pairs real resumes with
corresponding Job Descriptions, generates ground-truth match scores, and saves
the final dataset to ml_training/dataset/kaggle_paired_dataset.csv.
"""

import os
import sys
import csv
import json
import random
import kagglehub

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Industry-standard Job Descriptions for each Kaggle resume category
CATEGORY_JDS = {
    "INFORMATION-TECHNOLOGY": {
        "title": "Senior Software / IT Systems Engineer",
        "jd": "We are seeking a Senior IT & Software Engineer to design, deploy, and maintain cloud infrastructure and backend software systems. Responsibilities include managing databases, writing clean APIs, configuring network protocols, and troubleshooting IT systems. Required skills: Python, Java, SQL, Cloud (AWS/Azure), Linux, Networking, and Systems Administration."
    },
    "ENGINEERING": {
        "title": "Systems / Mechanical / Technical Engineer",
        "jd": "Seeking an experienced Engineer to lead technical analysis, project planning, quality testing, and cross-functional engineering deliverables. Responsibilities include system modeling, technical documentation, compliance monitoring, and troubleshooting. Qualifications: Engineering degree, CAD / technical software, project management, and analytical problem solving."
    },
    "FINANCE": {
        "title": "Financial Analyst / Controller",
        "jd": "Looking for a Financial Analyst to perform corporate budgeting, financial forecasting, quarterly auditing, and ledger reconciliations. Requirements: Proficiency in Excel, financial modeling, GAAP principles, risk analysis, accounting ERP software, and presenting quarterly reports to executives."
    },
    "HR": {
        "title": "Human Resources & Talent Acquisition Specialist",
        "jd": "Seeking a Human Resources Specialist to drive end-to-end recruitment, employee onboarding, performance management, and HR policy compliance. Qualifications: Strong knowledge of labor laws, talent screening, ATS platforms, conflict resolution, and employee engagement."
    },
    "SALES": {
        "title": "Enterprise Sales & Business Development Manager",
        "jd": "Seeking a high-performing Sales Manager to generate inbound/outbound enterprise leads, negotiate contract agreements, and exceed quarterly revenue quotas. Requirements: CRM proficiency (Salesforce), B2B sales track record, client relationship management, and presentation skills."
    },
    "DESIGNER": {
        "title": "Senior UI/UX & Graphic Designer",
        "jd": "We are hiring a Senior Designer to create wireframes, interactive prototypes, design systems, and brand assets. Requirements: Mastery of Figma, Adobe Creative Suite (Illustrator, Photoshop), user research, typography, and responsive mobile/web layout design."
    },
    "HEALTHCARE": {
        "title": "Clinical Healthcare Specialist / Practitioner",
        "jd": "Looking for a Healthcare Specialist to deliver patient care, maintain electronic medical records (EMR), administer clinical protocols, and collaborate with medical staff. Requirements: Medical certification, patient diagnosis, HIPAA compliance, and clinical documentation."
    }
}

def clean_text(text):
    if not text:
        return ""
    # Strip HTML tags and excessive whitespace
    import re
    cleaned = re.sub(r'<[^>]+>', ' ', text)
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    return cleaned[:3000] # Trim to first 3000 chars for clean embeddings

def download_and_process(output_dir="ml_training/dataset", max_samples_per_cat=10):
    print("[INFO] Loading 'snehaanbhawal/resume-dataset' via kagglehub...")
    dataset_path = kagglehub.dataset_download("snehaanbhawal/resume-dataset")
    print(f"[SUCCESS] Kaggle dataset path: {dataset_path}")

    # Locate the CSV file inside the downloaded directory
    csv_file = None
    for root, _, files in os.walk(dataset_path):
        for f in files:
            if f.lower().endswith(".csv"):
                csv_file = os.path.join(root, f)
                break
        if csv_file:
            break

    if not csv_file:
        raise FileNotFoundError(f"Could not find a CSV file inside {dataset_path}")

    print(f"[FOUND] Resume CSV file: {csv_file}")

    # Read and group resumes by Category
    resumes_by_cat = {}
    with open(csv_file, mode="r", encoding="utf-8", errors="ignore") as f:
        reader = csv.DictReader(f)
        for row in reader:
            cat = row.get("Category", "").strip().upper()
            resume_text = row.get("Resume_str") or row.get("Resume_html") or row.get("Resume", "")
            cleaned = clean_text(resume_text)
            if cat and len(cleaned) > 100:
                if cat not in resumes_by_cat:
                    resumes_by_cat[cat] = []
                resumes_by_cat[cat].append({
                    "id": row.get("ID", f"RES-{len(resumes_by_cat[cat])}"),
                    "resume_text": cleaned
                })

    print(f"[STATS] Extracted resumes across {len(resumes_by_cat)} categories:")
    for cat, list_items in resumes_by_cat.items():
        if cat in CATEGORY_JDS:
            print(f"  - {cat}: {len(list_items)} resumes")

    # Generate paired dataset (positive, partial, and negative pairs)
    paired_data = []
    pair_id = 1

    for cat_name, jd_info in CATEGORY_JDS.items():
        cat_resumes = resumes_by_cat.get(cat_name, [])
        sampled_positives = cat_resumes[:max_samples_per_cat]

        # 1. Positive Matches (Match score: 0.82 - 0.98)
        for r in sampled_positives:
            score = round(random.uniform(0.82, 0.97), 2)
            paired_data.append({
                "id": f"KAGGLE-PAIR-{pair_id:04d}",
                "category": cat_name,
                "job_title": jd_info["title"],
                "job_description": jd_info["jd"],
                "resume_text": r["resume_text"],
                "match_score": score,
                "label": "Strong Match" if score >= 0.88 else "Good Match"
            })
            pair_id += 1

        # 2. Hard Negative Matches (Pick resumes from completely different category, score: 0.12 - 0.35)
        other_cats = [c for c in resumes_by_cat.keys() if c != cat_name and c in CATEGORY_JDS]
        if other_cats:
            neg_cat = random.choice(other_cats)
            neg_resumes = resumes_by_cat[neg_cat][:3] # 3 negatives per JD
            for nr in neg_resumes:
                neg_score = round(random.uniform(0.12, 0.35), 2)
                paired_data.append({
                    "id": f"KAGGLE-PAIR-{pair_id:04d}",
                    "category": cat_name,
                    "job_title": jd_info["title"],
                    "job_description": jd_info["jd"],
                    "resume_text": nr["resume_text"],
                    "match_score": neg_score,
                    "label": "Low Match"
                })
                pair_id += 1

    # Save to output directory
    os.makedirs(output_dir, exist_ok=True)
    out_csv = os.path.join(output_dir, "kaggle_paired_dataset.csv")
    out_json = os.path.join(output_dir, "kaggle_paired_dataset.json")

    # Write CSV
    with open(out_csv, mode="w", newline="", encoding="utf-8") as f:
        fieldnames = ["id", "category", "job_title", "job_description", "resume_text", "match_score", "label"]
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(paired_data)

    # Write JSON
    with open(out_json, mode="w", encoding="utf-8") as f:
        json.dump(paired_data, f, indent=2, ensure_ascii=False)

    print(f"\n[DONE] Successfully created paired Kaggle dataset with {len(paired_data)} samples!")
    print(f"CSV saved to:  {out_csv}")
    print(f"JSON saved to: {out_json}")
    return paired_data

if __name__ == "__main__":
    current_dir = os.path.dirname(os.path.abspath(__file__))
    download_and_process(current_dir)
