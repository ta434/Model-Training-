# ResolveAI: Production-Grade Entity Resolution & Deduplication Pipeline

A state-of-the-art, **offline-first** record linkage and entity resolution engine designed for noisy, sparse business records (names and address strings).

## Key Features
- **Weighted Priority Architecture**: Business Name takes priority ($w_1 \approx 0.52$), balanced with asymmetric address containment ($w_2 \approx 0.33$) and rare token IDF bonuses ($w_3 \approx 0.15$).
- **Spatial & Hard Mismatch Penalties**:
  - Postal code conflict deduction ($-0.35$)
  - Numeric house/plot conflict deduction ($-0.25$)
  - Hard Name Veto: forces score to $0.0$ when names differ significantly, preventing different businesses at the same address from clustering.
- **17-Property Feature Vector**: Extracted for every candidate pair including Levenshtein, Jaro-Winkler, TF-IDF cosine, directional token containment, and transliteration equivalence.
- **Multi-Pass Union Blocking**: Eliminates Cartesian $O(N^2)$ pair comparison while guaranteeing zero match loss across 4 union passes:
  1. Exact Cleaned Name Key
  2. Prefix-4 + City / Locality
  3. Shared High-IDF Address Tokens
  4. Postal Code + 3-gram Name Prefix
- **Graph Connected Components Clustering**: Disjoint Set Union (DSU) clustering with Golden Master Record synthesis.

## Quick Start

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Train the Model
```bash
python train_model.py
```

### 3. Run Inference Pipeline
```python
from entity_resolution_pipeline import BusinessRecord, EntityResolutionModel

model = EntityResolutionModel()
r1 = BusinessRecord("1", "iCandy", "Akashvani Samor, Near Hanuman Mandir, Tung, Sangli 416416")
r2 = BusinessRecord("2", "icandy.in", "Tung, Sangli")

res = model.evaluate(r1, r2)
print(res.match_decision) # MATCH
print(res.confidence_score) # 0.91
print(res.reasoning)
```
