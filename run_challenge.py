#!/usr/bin/env python3
"""
run_challenge.py - Amazon ML Challenge 2026: End-to-End Pipeline
Reads Source 1, Source 2, and Source 3 TSV files and outputs:
  - output/candidate_pairs.tsv (blocking set)
  - output/matching_results.tsv (final leaderboard submission)

Optimized for high match recall and Macro F_0.5 (minimizing false singletons).
"""

import sys
import os
import re
import csv
import math
import argparse
from typing import Dict, List, Tuple, Set, Optional

# --- 1. NLP & Cleaning ---

GENERIC_LEGAL = {
    'pvt', 'ltd', 'private', 'limited', 'llp', 'inc', 'corp', 'corporation',
    'co', 'company', 'enterprises', 'associates', 'group', 'services', 'solutions', 'llc'
}

GENERIC_ADDR = {
    'road', 'rd', 'street', 'st', 'lane', 'ln', 'marg', 'avenue', 'ave',
    'near', 'opp', 'opposite', 'behind', 'beside', 'next', 'samor', 'chowk',
    'plot', 'shop', 'gala', 'floor', 'flr', 'bldg', 'building', 'complex',
    'nagar', 'colony', 'galli', 'gali', 'sector', 'sec', 'phase', 'block',
    'blvd', 'dr', 'drive', 'hwy', 'highway', 'way', 'ct', 'court'
}

def clean_str(s: str) -> str:
    if not s:
        return ""
    # Remove domain suffixes like .in, .com
    s = re.sub(r'\.(in|com|org|co|io|net|ai|app)\b', '', s.lower())
    s = re.sub(r'[^\w\s]', ' ', s)
    return re.sub(r'\s+', ' ', s).strip()

def tokenize(s: str) -> List[str]:
    return clean_str(s).split()

def lev_ratio(s1: str, s2: str) -> float:
    c1, c2 = clean_str(s1), clean_str(s2)
    if c1 == c2: return 1.0
    if not c1 or not c2: return 0.0
    l1, l2 = len(c1), len(c2)
    dp = [[0] * (l2 + 1) for _ in range(l1 + 1)]
    for i in range(l1 + 1): dp[i][0] = i
    for j in range(l2 + 1): dp[0][j] = j
    for i in range(1, l1 + 1):
        for j in range(1, l2 + 1):
            cost = 0 if c1[i - 1] == c2[j - 1] else 1
            dp[i][j] = min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost)
    return max(0.0, 1.0 - (dp[l1][l2] / max(l1, l2)))

def token_sort_sim(s1: str, s2: str) -> float:
    t1 = " ".join(sorted(tokenize(s1)))
    t2 = " ".join(sorted(tokenize(s2)))
    return lev_ratio(t1, t2)

def token_containment(s1: str, s2: str) -> float:
    t1, t2 = set(tokenize(s1)), set(tokenize(s2))
    if not t1 or not t2: return 0.0
    short_set, long_set = (t1, t2) if len(t1) <= len(t2) else (t2, t1)
    matched = sum(1 for t in short_set if t in long_set or any(lev_ratio(t, lt) >= 0.82 for lt in long_set))
    return matched / len(short_set)

def extract_pin(text: str) -> str:
    m = re.search(r'\b([1-9][0-9]{4,5})\b', text)
    return m.group(1) if m else ""

def extract_house_nums(text: str) -> List[str]:
    pin = extract_pin(text)
    c = text.replace(pin, ' ') if pin else text
    nums = re.findall(r'\b\d+(?:[a-zA-Z])?\b', c)
    return [n for n in set(nums) if any(ch.isdigit() for ch in n) and int(re.sub(r'\D', '', n) or '0') < 10000]

# --- 2. Record Structure ---

class Record:
    def __init__(self, rid: str, name: str, address: str, source: str):
        self.id = rid.strip()
        self.name = name.strip()
        self.address = address.strip()
        self.source = source
        self.cname = clean_str(name)
        self.caddr = clean_str(address)
        self.name_tokens = [t for t in tokenize(name) if t not in GENERIC_LEGAL]
        self.addr_tokens = [t for t in tokenize(address) if t not in GENERIC_ADDR]
        self.pin = extract_pin(address)
        self.nums = extract_house_nums(address)

# --- 3. Multi-Pass Union Blocking ---

def run_blocking(s1_records: List[Record], candidate_records: List[Record]) -> Dict[str, Set[str]]:
    """
    Builds candidate pairs via Union of 5 complementary passes.
    High recall ensures legitimate matches are never missed or left as singletons.
    """
    pass_name_exact = {}
    pass_prefix4 = {}
    pass_token_pair = {}
    pass_pin_token = {}
    pass_addr_token = {}

    for r in candidate_records:
        # Pass 1: Core Cleaned Name
        core_name = "".join(r.name_tokens[:3])
        if core_name:
            pass_name_exact.setdefault(core_name, []).append(r.id)

        # Pass 2: Name Prefix 4
        if len(r.cname) >= 3:
            pass_prefix4.setdefault(r.cname[:4], []).append(r.id)

        # Pass 3: Distinctive Name Token
        for t in r.name_tokens:
            if len(t) >= 4:
                pass_token_pair.setdefault(t, []).append(r.id)

        # Pass 4: Postal Code + 1st Token
        if r.pin and r.name_tokens:
            pass_pin_token.setdefault(f"{r.pin}_{r.name_tokens[0][:3]}", []).append(r.id)

        # Pass 5: Address Token
        for at in r.addr_tokens:
            if len(at) >= 5:
                pass_addr_token.setdefault(at, []).append(r.id)

    candidates_by_s1 = {}
    for s1 in s1_records:
        cand_set = set()
        core_name = "".join(s1.name_tokens[:3])
        if core_name in pass_name_exact:
            cand_set.update(pass_name_exact[core_name][:60])

        if len(s1.cname) >= 3 and s1.cname[:4] in pass_prefix4:
            cand_set.update(pass_prefix4[s1.cname[:4]][:60])

        for t in s1.name_tokens:
            if len(t) >= 4 and t in pass_token_pair:
                cand_set.update(pass_token_pair[t][:40])

        if s1.pin and s1.name_tokens:
            key = f"{s1.pin}_{s1.name_tokens[0][:3]}"
            if key in pass_pin_token:
                cand_set.update(pass_pin_token[key][:40])

        for at in s1.addr_tokens:
            if len(at) >= 5 and at in pass_addr_token:
                cand_set.update(pass_addr_token[at][:30])

        candidates_by_s1[s1.id] = cand_set

    return candidates_by_s1

# --- 4. Scoring Head & Precision-Weighted Matching ---

def evaluate_match(r1: Record, r2: Record) -> Tuple[bool, float, str]:
    # 1. Name metrics
    n_lev = lev_ratio(r1.name, r2.name)
    n_sort = token_sort_sim(r1.name, r2.name)
    n_cont = token_containment(r1.name, r2.name)
    s_name = max(n_lev, n_sort, n_cont)

    # Hard Name Veto: If business name fundamentally conflicts, DO NOT MERGE
    if s_name < 0.40 and n_sort < 0.45:
        return False, 0.0, "HARD_NAME_VETO"

    # 2. Address metrics
    a_cont = token_containment(r1.address, r2.address)
    a_sort = token_sort_sim(r1.address, r2.address)
    s_addr = 0.65 * a_cont + 0.35 * a_sort

    # Weighted baseline score
    score = 0.55 * s_name + 0.45 * s_addr

    # Legal suffix match bonus
    t1_clean = set(r1.name_tokens)
    t2_clean = set(r2.name_tokens)
    if t1_clean and t2_clean and (t1_clean == t2_clean or t1_clean.issubset(t2_clean) or t2_clean.issubset(t1_clean)):
        score = max(score, 0.85)

    # 3. Spatial guard deductions
    if r1.pin and r2.pin and r1.pin != r2.pin:
        score -= 0.35

    if r1.nums and r2.nums and not set(r1.nums).intersection(set(r2.nums)):
        score -= 0.35

    score = max(0.0, min(1.0, score))

    # Decision threshold: 0.72 ensures true matches with noisy vendor formats are captured
    # (drastically reducing false singletons while hard vetoes protect precision)
    is_match = (score >= 0.72 and s_name >= 0.50)
    return is_match, score, "MATCH" if is_match else "NO_MATCH"

# --- 5. TSV Loader ---

def load_tsv_file(path: str, source_label: str) -> List[Record]:
    records = []
    if not os.path.exists(path):
        print(f"Warning: File '{path}' not found.")
        return records

    with open(path, 'r', encoding='utf-8', errors='replace') as f:
        reader = csv.reader(f, delimiter='\t')
        first_row = next(reader, None)
        if not first_row:
            return records

        # Detect headers
        header_map = {}
        for idx, col in enumerate(first_row):
            cl = col.strip().lower()
            if 'id' in cl: header_map['id'] = idx
            elif 'name' in cl or 'business' in cl: header_map['name'] = idx
            elif 'address' in cl or 'addr' in cl: header_map['addr'] = idx

        rows_to_process = []
        if 'id' in header_map and 'name' in header_map:
            # Process remaining rows
            for row in reader:
                if len(row) > max(header_map.values()):
                    rows_to_process.append((
                        row[header_map['id']],
                        row[header_map['name']],
                        row[header_map.get('addr', 1)] if 'addr' in header_map else ""
                    ))
        else:
            # No recognized header, treat first row as data
            all_rows = [first_row] + list(reader)
            for row in all_rows:
                if len(row) >= 3:
                    rows_to_process.append((row[0], row[1], row[2]))
                elif len(row) == 2:
                    rows_to_process.append((row[0], row[1], ""))

        for rid, name, addr in rows_to_process:
            records.append(Record(rid, name, addr, source_label))

    return records

# --- 6. End-to-End Pipeline Execution ---

def run_pipeline(s1_file: str, s2_file: str, s3_file: str, out_dir: str):
    os.makedirs(out_dir, exist_ok=True)
    out_matches_path = os.path.join(out_dir, "matching_results.tsv")
    out_pairs_path = os.path.join(out_dir, "candidate_pairs.tsv")

    print(f"Loading Source 1 records from '{s1_file}'...")
    s1_records = load_tsv_file(s1_file, "Source1")
    print(f"Loading Source 2 records from '{s2_file}'...")
    s2_records = load_tsv_file(s2_file, "Source2")
    print(f"Loading Source 3 records from '{s3_file}'...")
    s3_records = load_tsv_file(s3_file, "Source3")

    candidates = s2_records + s3_records
    cand_by_id = {r.id: r for r in candidates}

    print(f"Entities: Source 1 = {len(s1_records)}, Candidates (S2+S3) = {len(candidates)}")
    print("Running Multi-Pass Union Blocking...")
    candidate_map = run_blocking(s1_records, candidates)

    total_pairs = sum(len(c) for c in candidate_map.values())
    print(f"Generated {total_pairs} candidate pairs across {len(s1_records)} Source 1 entities.")

    # Write candidate_pairs.tsv
    with open(out_pairs_path, 'w', encoding='utf-8') as f_pairs:
        for s1_id, c_ids in candidate_map.items():
            for cid in sorted(c_ids):
                f_pairs.write(f"{s1_id}\t{cid}\n")
    print(f"✅ Saved candidate pairs to '{out_pairs_path}'.")

    # Evaluate matches
    print("Scoring candidate pairs with precision-weighted head...")
    matches_by_s1 = {r.id: [] for r in s1_records}
    singleton_count = 0
    matched_count = 0

    s1_dict = {r.id: r for r in s1_records}
    for s1_id, c_ids in candidate_map.items():
        r1 = s1_dict[s1_id]
        for cid in c_ids:
            r2 = cand_by_id.get(cid)
            if not r2: continue
            matched, score, dec = evaluate_match(r1, r2)
            if matched:
                matches_by_s1[s1_id].append(cid)

    # Write matching_results.tsv (one row per Source 1 entity)
    with open(out_matches_path, 'w', encoding='utf-8') as f_out:
        for s1 in s1_records:
            m_list = matches_by_s1.get(s1.id, [])
            if m_list:
                matched_count += 1
                f_out.write(f"{s1.id}\t{','.join(m_list)}\n")
            else:
                singleton_count += 1
                f_out.write(f"{s1.id}\t\n")

    print(f"✅ Generated '{out_matches_path}'.")
    print(f"   • Total Source 1 Entities:  {len(s1_records)}")
    print(f"   • Entities with Matches:    {matched_count} ({(matched_count/len(s1_records)*100):.1f}%)")
    print(f"   • Singletons (Unmatched):   {singleton_count} ({(singleton_count/len(s1_records)*100):.1f}%)")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Amazon ML Challenge 2026: Business Entity Resolution")
    parser.add_argument("--source1", default="data/source1.tsv", help="Path to Source 1 TSV file")
    parser.add_argument("--source2", default="data/source2.tsv", help="Path to Source 2 TSV file")
    parser.add_argument("--source3", default="data/source3.tsv", help="Path to Source 3 TSV file")
    parser.add_argument("--output", default="output", help="Output directory")
    args = parser.parse_args()

    run_pipeline(args.source1, args.source2, args.source3, args.output)
