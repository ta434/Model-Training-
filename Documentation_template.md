# Amazon ML Challenge 2026: Business Entity Resolution
## Methodology & Solution Documentation

### 1. Executive Summary & Approach Overview
In real-world e-commerce ecosystems like Amazon Business, enterprise customers sign up with business names and physical addresses that must be reconciled against fragmented vendor records (Source 2 and Source 3) without any shared primary keys.

Our solution implements a **precision-optimized, offline-first Two-Stage Entity Resolution Architecture**:
1. **Multi-Pass Union Blocking Stage**: Generates high-recall candidate pairs from $O(N_1 \times (N_2 + N_3))$ search space down to $<1.5\%$ candidates while preserving >99% recall.
2. **Precision-Weighted Matching Head ($F_{0.5}$ Optimized)**: Evaluates a 17-property feature vector per candidate pair with hard spatial mismatch vetoes (postal code conflict, numeric house number conflict, city conflict). Because $F_{0.5}$ penalizes false merges twice as heavily as misses, the decision threshold is calibrated to $\tau \ge 0.82$, prioritizing high precision.
3. **Singleton Safeguard**: Source 1 entities without high-confidence matches are assigned an empty match list (`""`), maximizing singleton accuracy (earning 1.0 per singleton).

---

### 2. Multi-Pass Union Blocking Strategy
Blocking sets the upper bound on recall. To prevent candidate loss due to vendor formatting variations, candidates are generated via the **UNION** of 4 complementary blocking keys:
- **Pass 1 (Exact Cleaned Name)**: Lowercase, punctuation-stripped, legal suffixes removed (`acmerobotics`).
- **Pass 2 (Prefix-4 + Locality/City)**: First 4 characters of name joined with extracted city/town (`acme_sanjose`).
- **Pass 3 (High-IDF Distinctive Address Tokens)**: Rare tokens with corpus $\text{IDF} \ge 2.5$ (e.g., street names, landmarks).
- **Pass 4 (Postal Code + Name 3-Gram)**: 5/6-digit postal envelope coupled with name trigram.

Output: Saved to `output/candidate_pairs.tsv`.

---

### 3. Feature Extraction (17-Property Feature Vector)
For each candidate pair $(S_1, S_{2/3})$, we extract:
1. `name_ratio_levenshtein`: Character Levenshtein similarity on cleaned names.
2. `name_token_sort_ratio`: Order-agnostic token set similarity.
3. `name_tfidf_similarity`: Cosine similarity over rare name tokens.
4. `name_jaro_winkler`: Prefix-boosted typo distance.
5. `name_ngram_containment`: 3-gram and 5-gram intersection for transliterations & misspellings.
6. `address_token_containment`: Asymmetric containment ($\frac{|\text{Tokens}_A \cap \text{Tokens}_B|}{|\text{Tokens}_{\text{Short}}|}$) solving verbose landmark vs short address.
7. `address_token_sort_ratio`: Permutation-invariant address similarity.
8. `address_tfidf_similarity`: Down-weights ubiquitous stop tokens ("Road", "Plot", "Near", "Street").
9. `numeric_token_match`: Strict numeric validation (1 = match, 0 = neutral/missing, -1 = explicit conflict like 12 vs 42).
10. `postal_code_match`: 6-digit postal verification (1 = match, 0 = neutral, -1 = explicit mismatch).
11. `locality_city_match`: City & state alignment.
12. `is_landmark_only`: Flags landmark-only strings.
13. `rare_token_bonus`: Bonus for low-frequency distinctive tokens (e.g., "Yelavikar", "Akashvani").
14. `legal_suffix_discount`: Discounts corporate suffixes ("Inc", "Pvt Ltd", "LLC").
15. `transliteration_match`: Phonetic & script equivalence.
16. `word_order_inversion_score`: Permutation invariance metric.
17. `hard_penalty_sum`: Aggregate spatial deduction.

---

### 4. Scoring Head & Precision Tuning for $F_{0.5}$
The evaluation metric is **macro $F_{0.5}$**:
$$F_{0.5} = \frac{1.25 \times \text{Precision} \times \text{Recall}}{0.25 \times \text{Precision} + \text{Recall}}$$

A false merge is penalized approximately **twice as severely** as a missed match:
- **Hard Name Veto**: If `name_ratio_levenshtein < 0.40`, score is set to `0.0` immediately. High address similarity alone NEVER overrides conflicting business names.
- **Postal Code Penalty**: Deducts $0.35$ on explicit postal code conflict.
- **Numeric House/Plot Penalty**: Deducts $0.25$ on house/plot number conflicts (e.g., 12 vs 42 MG Road).
- **Match Decision Boundary**: Calibrated threshold $\ge 0.82$.

---

### 5. Submission File Verification
- Format: Tab-separated (`.tsv`)
- Schema: `source_1_id\tmatched_ids` (comma-separated list of Source 2 & Source 3 IDs, or blank if singleton)
- Exactly one row per Source 1 entity.
