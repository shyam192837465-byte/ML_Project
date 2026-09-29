#!/usr/bin/env python3
"""
TalentAI Studio - JD & Resume Matching Model Trainer
Trains a Sentence-Transformers Bi-Encoder on JD-Resume pairs with CosineSimilarityLoss.
Ready to run directly in Google Colab via Git!
"""

import os
import math
import torch
import pandas as pd
from sentence_transformers import SentenceTransformer, InputExample, losses, evaluation, util
from sklearn.model_selection import train_test_split
from torch.utils.data import DataLoader

def main():
    print("=" * 70)
    print("🚀 TalentAI Studio - Training JD & Resume Matching Model")
    print("=" * 70)

    # 1. Check Hardware
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"🔧 Device: {device.upper()}")
    if device == "cuda":
        print(f"⚡ GPU: {torch.cuda.get_device_name(0)}")
        print(f"💾 GPU Memory: {torch.cuda.get_device_properties(0).total_memory / 1e9:.2f} GB")
    else:
        print("⚠️ Warning: Running on CPU. For faster training, enable GPU in Colab (Runtime > Change runtime type > T4 GPU).")

    # 2. Locate or Generate Dataset
    dataset_path = os.path.join(os.path.dirname(__file__), "dataset", "jd_resume_dataset.csv")
    if not os.path.exists(dataset_path):
        # Try local folder if run from dataset directory
        dataset_path = "dataset/jd_resume_dataset.csv"

    if not os.path.exists(dataset_path):
        print("Dataset not found. Generating dataset using generate_dataset.py...")
        from dataset.generate_dataset import generate_dataset
        generate_dataset(os.path.join(os.path.dirname(__file__), "dataset"))
        dataset_path = os.path.join(os.path.dirname(__file__), "dataset", "jd_resume_dataset.csv")

    df = pd.read_csv(dataset_path)
    print(f"📂 Loaded dataset with {len(df)} JD-Resume pairs from {dataset_path}")

    # 3. Train / Validation Split (80% train, 20% validation)
    train_df, val_df = train_test_split(df, test_size=0.2, random_state=42)

    train_examples = [
        InputExample(texts=[row['job_description'], row['resume_text']], label=float(row['match_score']))
        for _, row in train_df.iterrows()
    ]

    val_examples = [
        InputExample(texts=[row['job_description'], row['resume_text']], label=float(row['match_score']))
        for _, row in val_df.iterrows()
    ]

    train_dataloader = DataLoader(train_examples, shuffle=True, batch_size=4)
    print(f"📊 Training samples: {len(train_examples)} | Validation samples: {len(val_examples)}")

    # 4. Initialize Base Model (all-MiniLM-L6-v2)
    model_name = "sentence-transformers/all-MiniLM-L6-v2"
    print(f"\n🧠 Loading pre-trained base model: {model_name}...")
    model = SentenceTransformer(model_name, device=device)

    # 5. Define Loss Function & Evaluator
    train_loss = losses.CosineSimilarityLoss(model)
    evaluator = evaluation.EmbeddingSimilarityEvaluator.from_input_examples(
        val_examples,
        name="jd-resume-eval",
        show_progress_bar=False
    )

    # 6. Fine-Tuning
    epochs = 4
    warmup_steps = math.ceil(len(train_dataloader) * epochs * 0.1)
    output_dir = "./talentai_jd_matcher_model"

    print(f"\n🏋️ Starting fine-tuning for {epochs} epochs (warmup={warmup_steps} steps)...")
    model.fit(
        train_objectives=[(train_dataloader, train_loss)],
        evaluator=evaluator,
        epochs=epochs,
        evaluation_steps=20,
        warmup_steps=warmup_steps,
        output_path=output_dir,
        show_progress_bar=True
    )
    print(f"\n🎉 Model fine-tuning complete! Saved checkpoint to: {output_dir}")

    # 7. Evaluate Predictions
    print("\n" + "=" * 70)
    print("📈 Evaluation on Validation Pairs:")
    print("=" * 70)
    best_model = SentenceTransformer(output_dir, device=device)

    print(f"{'Candidate':<22} | {'Expected':<10} | {'Predicted':<10} | {'Diff':<8}")
    print("-" * 60)
    for _, row in val_df.head(6).iterrows():
        jd_emb = best_model.encode(row['job_description'], convert_to_tensor=True)
        res_emb = best_model.encode(row['resume_text'], convert_to_tensor=True)
        pred = util.cos_sim(jd_emb, res_emb).item()
        exp = float(row['match_score'])
        print(f"{row['candidate_name']:<22} | {exp:<10.2f} | {pred:<10.2f} | {abs(pred-exp):<8.2f}")

    # 8. Live Candidate Ranking Demonstration
    print("\n" + "=" * 70)
    print("🎯 Live Ranking Demonstration for New Job Description:")
    print("=" * 70)
    test_jd = "Senior Machine Learning Engineer: 4+ years PyTorch, LLMs, vector search with pgvector, Docker microservices"
    test_candidates = [
        {"name": "Aarav Sharma", "text": "4 years ML engineer. Fine-tuned BERT and LLMs with PyTorch, pgvector, and FastAPI on Docker."},
        {"name": "Priya Nair", "text": "Data scientist with 3 years Python, TensorFlow, and Scikit-learn predictive modeling."},
        {"name": "Marcus Vance", "text": "Backend developer with 3 years building Django REST APIs and PostgreSQL databases."},
        {"name": "Emily Watson", "text": "4 years digital marketer and WordPress SEO specialist with Google Analytics."}
    ]

    jd_vec = best_model.encode(test_jd, convert_to_tensor=True)
    rankings = []
    for cand in test_candidates:
        c_vec = best_model.encode(cand["text"], convert_to_tensor=True)
        sim = util.cos_sim(jd_vec, c_vec).item()
        rankings.append((cand["name"], sim))

    rankings.sort(key=lambda x: x[1], reverse=True)
    medals = ["🥇 #1", "🥈 #2", "🥉 #3", "   #4"]
    for i, (name, sim) in enumerate(rankings):
        print(f"{medals[i]} {name:<18} -> Match Score: {round(sim * 100, 1)}%")

    print("\n✅ Training and validation finished successfully!")

if __name__ == "__main__":
    main()
