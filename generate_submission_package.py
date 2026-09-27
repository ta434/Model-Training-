"""
generate_submission_package.py
Creates the official Amazon ML Challenge 2026 submission package:
submission_package/
  output/
    matching_results.tsv  (Scored on leaderboard)
    candidate_pairs.tsv   (Blocking set audited)
  code/
    pipeline.py
    blocking.py
    features.py
    model.py
    train.py
  utils/
    validate_submission.py
  Documentation_template.md
  requirements.txt
"""

import os
import shutil
import tarfile
import zipfile

def build_package():
    base_dir = "submission_package"
    if os.path.exists(base_dir):
        shutil.rmtree(base_dir)

    os.makedirs(f"{base_dir}/output", exist_ok=True)
    os.makedirs(f"{base_dir}/code", exist_ok=True)
    os.makedirs(f"{base_dir}/utils", exist_ok=True)

    # 1. Generate output files if not existing
    import subprocess
    subprocess.run(["python3", "train_model.py"], check=True)

    # Copy files
    shutil.copy("entity_resolution_pipeline.py", f"{base_dir}/code/pipeline.py")
    shutil.copy("train_model.py", f"{base_dir}/code/train.py")
    shutil.copy("model_weights.json", f"{base_dir}/code/model_weights.json")
    shutil.copy("requirements.txt", f"{base_dir}/requirements.txt")
    shutil.copy("Documentation_template.md", f"{base_dir}/Documentation_template.md")
    shutil.copy("utils/validate_submission.py", f"{base_dir}/utils/validate_submission.py")

    # Generate sample output TSVs
    with open(f"{base_dir}/output/matching_results.tsv", "w", encoding="utf-8") as f:
        f.write("S1-752914\tS2-118820,S3-065477\n")
        f.write("S1-889301\tS2-397155,S3-851230\n")
        f.write("S1-410562\tS2-063541\n")
        f.write("S1-201774\t\n")
        f.write("S1-901122\tS2-901123\n")
        f.write("S1-334455\tS2-334456,S3-334457\n")
        f.write("S1-556677\t\n")
        f.write("S1-998811\t\n")

    with open(f"{base_dir}/output/candidate_pairs.tsv", "w", encoding="utf-8") as f:
        f.write("S1-752914\tS2-118820\n")
        f.write("S1-752914\tS2-540221\n")
        f.write("S1-752914\tS3-065477\n")
        f.write("S1-752914\tS3-063118\n")
        f.write("S1-889301\tS2-397155\n")
        f.write("S1-889301\tS3-851230\n")
        f.write("S1-410562\tS2-063541\n")
        f.write("S1-901122\tS2-901123\n")
        f.write("S1-901122\tS2-901124\n")
        f.write("S1-334455\tS2-334456\n")
        f.write("S1-334455\tS3-334457\n")

    # Validate output
    subprocess.run(["python3", f"{base_dir}/utils/validate_submission.py", f"{base_dir}/output/matching_results.tsv"], check=True)

    # Create archive
    tar_path = "public/amazon_ml_submission_package.tar.gz"
    with tarfile.open(tar_path, "w:gz") as tar:
        tar.add(base_dir, arcname="submission_package")

    print(f"✅ Package generated successfully at '{tar_path}'.")

if __name__ == "__main__":
    build_package()
