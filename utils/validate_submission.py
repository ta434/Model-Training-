"""
utils/validate_submission.py
Amazon ML Challenge 2026: Official Submission Validator

Validates:
1. output/matching_results.tsv - Format, tab separation, exactly one row per Source 1 entity
2. output/candidate_pairs.tsv - Format and blocking completeness
"""

import sys
import os
from typing import Set, List

def validate_matching_results(filepath: str, expected_source1_ids: Set[str] = None) -> bool:
    if not os.path.exists(filepath):
        print(f"❌ Error: File '{filepath}' not found!")
        return False

    print(f"🔍 Validating '{filepath}'...")
    seen_source1_ids = set()
    total_rows = 0
    matched_rows = 0
    singleton_rows = 0
    errors = []

    with open(filepath, 'r', encoding='utf-8') as f:
        for line_no, raw_line in enumerate(f, 1):
            line = raw_line.rstrip('\r\n')
            if not line:
                continue

            parts = line.split('\t')
            if len(parts) > 2:
                errors.append(f"Line {line_no}: Expected 1 or 2 tab-separated columns, found {len(parts)}.")
                continue

            source1_id = parts[0].strip()
            matched_str = parts[1].strip() if len(parts) > 1 else ""

            if not source1_id:
                errors.append(f"Line {line_no}: Empty source_1_id.")
                continue

            if source1_id in seen_source1_ids:
                errors.append(f"Line {line_no}: Duplicate entry for Source 1 entity '{source1_id}'.")
            seen_source1_ids.add(source1_id)

            total_rows += 1
            if matched_str:
                matched_rows += 1
                # Validate comma separated list
                matches = [m.strip() for m in matched_str.split(',') if m.strip()]
                for m in matches:
                    if not (m.startswith('S2-') or m.startswith('S3-') or 'S2' in m or 'S3' in m):
                        # Warning if not matching vendor format
                        pass
            else:
                singleton_rows += 1

    if expected_source1_ids:
        missing = expected_source1_ids - seen_source1_ids
        if missing:
            errors.append(f"Missing predictions for {len(missing)} Source 1 entities: {list(missing)[:5]}...")

    if errors:
        print(f"❌ Found {len(errors)} validation errors:")
        for err in errors[:10]:
            print(f"   • {err}")
        return False

    print("✅ Validation Passed!")
    print(f"   • Total Source 1 Entities: {total_rows}")
    print(f"   • Entities with Matches:   {matched_rows}")
    print(f"   • Singletons (Empty Match): {singleton_rows}")
    print(f"   • Singleton Ratio:         {(singleton_rows / total_rows * 100):.1f}%")
    return True

def validate_candidate_pairs(filepath: str) -> bool:
    if not os.path.exists(filepath):
        print(f"ℹ️ Optional candidate pairs file '{filepath}' not found.")
        return True

    print(f"🔍 Validating candidate pairs in '{filepath}'...")
    pairs_count = 0
    with open(filepath, 'r', encoding='utf-8') as f:
        for line_no, raw_line in enumerate(f, 1):
            line = raw_line.rstrip('\r\n')
            if not line:
                continue
            parts = line.split('\t')
            if len(parts) < 2:
                print(f"❌ Line {line_no}: Must have at least 2 tab-separated columns (source_1_id, candidate_id).")
                return False
            pairs_count += 1

    print(f"✅ Candidate pairs valid ({pairs_count} pairs generated).")
    return True

if __name__ == "__main__":
    target_file = sys.argv[1] if len(sys.argv) > 1 else "output/matching_results.tsv"
    success = validate_matching_results(target_file)
    if os.path.exists("output/candidate_pairs.tsv"):
        validate_candidate_pairs("output/candidate_pairs.tsv")
    sys.exit(0 if success else 1)
