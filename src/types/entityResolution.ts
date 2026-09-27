export interface BusinessRecord {
  id: string;
  name: string;
  address: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
  category?: string;
  rawText?: string;
}

export type MatchDecision = 'MATCH' | 'POSSIBLE_MATCH' | 'NO_MATCH';

export interface FeatureVector {
  // 17 Properties as mandated by specification
  name_ratio_levenshtein: number;       // [0, 1] Character Levenshtein distance on cleaned names
  name_token_sort_ratio: number;        // [0, 1] Order-agnostic token set similarity on names
  name_tfidf_similarity: number;        // [0, 1] TF-IDF cosine similarity focusing on rare name tokens
  name_jaro_winkler: number;            // [0, 1] Prefix-weighted similarity for typos/abbreviations
  name_ngram_containment: number;       // [0, 1] 3-gram and 5-gram containment
  address_token_containment: number;    // [0, 1] Directional asymmetric subset score
  address_token_sort_ratio: number;     // [0, 1] Order-agnostic token set similarity on address
  address_tfidf_similarity: number;     // [0, 1] TF-IDF cosine similarity on address tokens
  numeric_token_match: number;          // 1 = Match, 0 = No numbers, -1 = Explicit Conflict
  postal_code_match: number;            // 1 = Match, 0 = One/Both Missing, -1 = Explicit Mismatch
  locality_city_match: number;          // [0, 1] Extracted locality/city components similarity
  is_landmark_only: number;             // 1 = Landmark only in one address, 0 = full address
  rare_token_bonus: number;             // [0, 1] IDF mass of shared rare tokens
  legal_suffix_discount: number;        // [0, 1] Measure of corporate suffix discount
  transliteration_match: number;        // [0, 1] Phonetic / script equivalence (e.g. Devanagari)
  word_order_inversion_score: number;   // [0, 1] Permutation-invariance score
  hard_penalty_sum: number;             // Sum of applied hard penalties (e.g. -0.35, -0.25)
}

export interface MatchEvaluationResult {
  match_decision: MatchDecision;
  confidence_score: number;
  raw_score: number;
  reasoning: string;
  feature_vector: FeatureVector;
  token_breakdown: {
    name_tokens_1: string[];
    name_tokens_2: string[];
    name_shared_tokens: string[];
    address_tokens_1: string[];
    address_tokens_2: string[];
    address_shared_tokens: string[];
    numeric_tokens_1: string[];
    numeric_tokens_2: string[];
    postal_code_1: string | null;
    postal_code_2: string | null;
    rare_tokens: string[];
  };
  hard_penalties_triggered: {
    type: string;
    description: string;
    penalty: number;
  }[];
}

export interface ModelWeights {
  w1_name: number;                // Primary weight (default 0.52)
  w2_address_containment: number; // Secondary weight (default 0.33)
  w3_rare_tokens: number;         // Rare token bonus (default 0.15)
  penalty_postal_code: number;    // Hard penalty for postal code mismatch (default 0.35)
  penalty_numeric_conflict: number;// Hard penalty for numeric conflict (default 0.25)
  threshold_match: number;        // Default 0.82
  threshold_possible: number;     // Default 0.60
  name_veto_threshold: number;    // Default 0.40 (score=0 if name_levenshtein < 0.40)
}

export interface LabeledPair {
  id: string;
  record1: BusinessRecord;
  record2: BusinessRecord;
  groundTruth: MatchDecision;
  edgeCaseCategory: string; // e.g., "Case 1: Same Name, Diff City", "Case 5: Long Address vs Short Landmark"
  description: string;
}

export interface BlockingPassResult {
  passNumber: number;
  name: string;
  description: string;
  generatedPairsCount: number;
  keysCreatedCount: number;
}

export interface MultiPassBlockingResult {
  totalCartesianPairs: number;
  totalCandidatePairs: number;
  reductionRatioPercentage: number;
  passResults: BlockingPassResult[];
  candidatePairs: {
    record1: BusinessRecord;
    record2: BusinessRecord;
    matchedPasses: number[];
  }[];
}

export interface EntityCluster {
  clusterId: string;
  canonicalRecord: BusinessRecord;
  records: BusinessRecord[];
  confidence: number;
}

export interface ModelTrainingMetrics {
  epoch: number;
  loss: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  confusionMatrix: {
    tp: number;
    fp: number;
    tn: number;
    fn: number;
  };
}
