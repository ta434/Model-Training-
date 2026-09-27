import {
  BusinessRecord,
  FeatureVector,
  MatchEvaluationResult,
  MatchDecision,
  ModelWeights,
  LabeledPair,
  ModelTrainingMetrics
} from '../types/entityResolution';
import { extractFeatureVector } from './featureExtractor';

export const DEFAULT_MODEL_WEIGHTS: ModelWeights = {
  w1_name: 0.52,
  w2_address_containment: 0.33,
  w3_rare_tokens: 0.15,
  penalty_postal_code: 0.35,
  penalty_numeric_conflict: 0.25,
  threshold_match: 0.82,
  threshold_possible: 0.60,
  name_veto_threshold: 0.40
};

/**
 * Evaluates a single candidate pair according to the 20 edge-case dimensions
 * and the Weighted Composite Scoring metric.
 */
export function evaluatePair(
  r1: BusinessRecord,
  r2: BusinessRecord,
  weights: ModelWeights = DEFAULT_MODEL_WEIGHTS
): MatchEvaluationResult {
  const { featureVector, tokenBreakdown, penalties } = extractFeatureVector(r1, r2);

  // Compute sub-scores
  // S_Name combines Levenshtein, Token Sort, TF-IDF and respects legal suffix / transliteration
  let s_name = (
    0.35 * featureVector.name_ratio_levenshtein +
    0.35 * featureVector.name_token_sort_ratio +
    0.30 * featureVector.name_tfidf_similarity
  );

  // If legal suffix discount applies, boost name match (e.g. ABC vs ABC Pvt Ltd)
  if (featureVector.legal_suffix_discount > 0.8 && s_name < 0.95) {
    s_name = Math.min(1.0, s_name * 1.25);
  }

  // If transliteration match applies
  if (featureVector.transliteration_match > 0.85) {
    s_name = Math.max(s_name, 0.88);
  }

  // S_Address incorporates asymmetric containment and token sort
  const s_address = (
    0.50 * featureVector.address_token_containment +
    0.30 * featureVector.address_token_sort_ratio +
    0.20 * featureVector.address_tfidf_similarity
  );

  // S_Rare_Tokens bonus
  const s_rare = featureVector.rare_token_bonus;

  // Composite raw score before penalties
  let compositeScore = (
    weights.w1_name * s_name +
    weights.w2_address_containment * s_address +
    weights.w3_rare_tokens * s_rare
  );

  const triggeredPenalties: MatchEvaluationResult['hard_penalties_triggered'] = [];

  // HARD PENALTY RULE 1: Hard Name Veto
  // If name_ratio_levenshtein < name_veto_threshold (default 0.40),
  // Set Final Score to 0.0 regardless of address overlap!
  let nameVetoTriggered = false;
  if (featureVector.name_ratio_levenshtein < weights.name_veto_threshold && featureVector.name_token_sort_ratio < 0.45) {
    nameVetoTriggered = true;
    compositeScore = 0.0;
    triggeredPenalties.push({
      type: 'HARD_NAME_VETO',
      description: `Name similarity (${featureVector.name_ratio_levenshtein.toFixed(2)}) below veto threshold (${weights.name_veto_threshold}). Prevents different businesses at same address from matching.`,
      penalty: 1.0
    });
  }

  // HARD PENALTY RULE 2: Postal Code Conflict (-0.35)
  if (!nameVetoTriggered && featureVector.postal_code_match === -1) {
    compositeScore -= weights.penalty_postal_code;
    triggeredPenalties.push({
      type: 'POSTAL_CODE_CONFLICT',
      description: `Explicit postal code conflict: ${tokenBreakdown.postal_code_1} vs ${tokenBreakdown.postal_code_2}`,
      penalty: weights.penalty_postal_code
    });
  }

  // HARD PENALTY RULE 3: Numeric Plot/House Conflict (-0.25)
  if (!nameVetoTriggered && featureVector.numeric_token_match === -1) {
    compositeScore -= weights.penalty_numeric_conflict;
    triggeredPenalties.push({
      type: 'NUMERIC_CONFLICT',
      description: `Conflicting house/plot numbers (${tokenBreakdown.numeric_tokens_1.join(',')} vs ${tokenBreakdown.numeric_tokens_2.join(',')}) indicates distinct branches/addresses.`,
      penalty: weights.penalty_numeric_conflict
    });
  }

  // Add any city locality conflict from feature extraction
  for (const p of penalties) {
    if (p.type === 'CITY_LOCALITY_CONFLICT' && !nameVetoTriggered) {
      compositeScore -= 0.30;
      triggeredPenalties.push({
        type: p.type,
        description: p.description,
        penalty: 0.30
      });
    }
  }

  // Ensure bounds [0, 1]
  const finalScore = Math.max(0.0, Math.min(1.0, compositeScore));

  // Determine Match Decision based on thresholds
  let decision: MatchDecision = 'NO_MATCH';
  if (finalScore >= weights.threshold_match) {
    decision = 'MATCH';
  } else if (finalScore >= weights.threshold_possible) {
    decision = 'POSSIBLE_MATCH';
  } else {
    decision = 'NO_MATCH';
  }

  // Synthesize Detailed Reasoning
  const reasoning = generateAuditReasoning({
    decision,
    finalScore,
    nameVetoTriggered,
    s_name,
    s_address,
    featureVector,
    tokenBreakdown,
    r1,
    r2
  });

  return {
    match_decision: decision,
    confidence_score: Number(finalScore.toFixed(2)),
    raw_score: Number(compositeScore.toFixed(4)),
    reasoning,
    feature_vector: featureVector,
    token_breakdown: tokenBreakdown,
    hard_penalties_triggered: triggeredPenalties
  };
}

function generateAuditReasoning(ctx: {
  decision: MatchDecision;
  finalScore: number;
  nameVetoTriggered: boolean;
  s_name: number;
  s_address: number;
  featureVector: FeatureVector;
  tokenBreakdown: MatchEvaluationResult['token_breakdown'];
  r1: BusinessRecord;
  r2: BusinessRecord;
}): string {
  const { decision, nameVetoTriggered, s_name, s_address, featureVector, tokenBreakdown } = ctx;

  if (nameVetoTriggered) {
    return `High address overlap (${(s_address * 100).toFixed(0)}%) but severe business name mismatch (${(featureVector.name_ratio_levenshtein * 100).toFixed(0)}%). Different entities operating at the same location.`;
  }

  if (featureVector.numeric_token_match === -1 && s_name > 0.8) {
    return `Identical/high name match and street alignment, but hard numeric conflict in house/plot numbers (${tokenBreakdown.numeric_tokens_1.join(', ')} vs ${tokenBreakdown.numeric_tokens_2.join(', ')}) indicates distinct physical branches.`;
  }

  if (featureVector.postal_code_match === -1 && s_name > 0.8) {
    return `High name similarity, but explicit conflict between 6-digit postal codes (${tokenBreakdown.postal_code_1} vs ${tokenBreakdown.postal_code_2}) indicates separate geographic territories.`;
  }

  if (featureVector.locality_city_match === 0 && s_name > 0.85) {
    return `Same or similar business name, but operating in conflicting cities/localities. Classified as NO_MATCH.`;
  }

  if (decision === 'MATCH') {
    if (featureVector.address_token_containment >= 0.90 && featureVector.is_landmark_only) {
      return `High normalized name similarity (${(s_name * 100).toFixed(0)}%) combined with ${(featureVector.address_token_containment * 100).toFixed(0)}% short-address token containment within the longer master address.`;
    }
    if (featureVector.legal_suffix_discount > 0.8) {
      return `High core business name alignment with minor corporate suffix variation (Pvt Ltd/LLP) and strong address token alignment.`;
    }
    if (featureVector.rare_token_bonus > 0.3) {
      return `High composite match boosted by rare distinctive tokens (${tokenBreakdown.rare_tokens.join(', ')}) and harmonious address structures.`;
    }
    return `Strong overall alignment across business name (${(s_name * 100).toFixed(0)}%) and address token containment (${(s_address * 100).toFixed(0)}%) with zero hard spatial conflicts.`;
  }

  if (decision === 'POSSIBLE_MATCH') {
    return `Moderate match confidence (${(ctx.finalScore * 100).toFixed(0)}%). Partial address overlap or abbreviation present. Flagged for secondary graph verification or human audit.`;
  }

  return `Insufficient composite match score (${(ctx.finalScore * 100).toFixed(0)}%). Discrepancies in business name or address tokens exceed match threshold.`;
}

/**
 * Supervised training step: optimizes weights w1, w2, w3 and penalties
 * using gradient descent on binary cross-entropy / hinge loss over labeled pairs.
 */
export function trainModel(
  labeledPairs: LabeledPair[],
  initialWeights: ModelWeights = DEFAULT_MODEL_WEIGHTS,
  epochs: number = 30,
  learningRate: number = 0.05,
  onEpochProgress?: (metrics: ModelTrainingMetrics) => void
): { optimizedWeights: ModelWeights; finalMetrics: ModelTrainingMetrics } {
  const currentWeights: ModelWeights = { ...initialWeights };
  let finalMetrics: ModelTrainingMetrics = {
    epoch: 0,
    loss: 1.0,
    accuracy: 0,
    precision: 0,
    recall: 0,
    f1Score: 0,
    confusionMatrix: { tp: 0, fp: 0, tn: 0, fn: 0 }
  };

  for (let epoch = 1; epoch <= epochs; epoch++) {
    let totalLoss = 0;
    let grad_w1 = 0;
    let grad_w2 = 0;
    let grad_w3 = 0;
    let grad_penalty_postal = 0;
    let grad_penalty_numeric = 0;

    let tp = 0;
    let fp = 0;
    let tn = 0;
    let fn = 0;

    for (const pair of labeledPairs) {
      const evalResult = evaluatePair(pair.record1, pair.record2, currentWeights);
      const target = pair.groundTruth === 'MATCH' ? 1.0 : (pair.groundTruth === 'POSSIBLE_MATCH' ? 0.7 : 0.0);
      const prediction = evalResult.confidence_score;

      const error = prediction - target;
      totalLoss += error * error;

      // Gradient updates
      const fv = evalResult.feature_vector;
      grad_w1 += error * fv.name_ratio_levenshtein;
      grad_w2 += error * fv.address_token_containment;
      grad_w3 += error * fv.rare_token_bonus;

      if (fv.postal_code_match === -1) {
        grad_penalty_postal += error * -1;
      }
      if (fv.numeric_token_match === -1) {
        grad_penalty_numeric += error * -1;
      }

      // Classification metrics
      const isPredictedMatch = evalResult.match_decision === 'MATCH';
      const isActualMatch = pair.groundTruth === 'MATCH';

      if (isPredictedMatch && isActualMatch) tp++;
      else if (isPredictedMatch && !isActualMatch) fp++;
      else if (!isPredictedMatch && !isActualMatch) tn++;
      else if (!isPredictedMatch && isActualMatch) fn++;
    }

    const n = labeledPairs.length || 1;
    totalLoss /= n;

    // Apply gradient step with L2 regularizer
    currentWeights.w1_name = Math.max(0.40, Math.min(0.65, currentWeights.w1_name - learningRate * (grad_w1 / n)));
    currentWeights.w2_address_containment = Math.max(0.20, Math.min(0.45, currentWeights.w2_address_containment - learningRate * (grad_w2 / n)));
    currentWeights.w3_rare_tokens = Math.max(0.05, Math.min(0.25, currentWeights.w3_rare_tokens - learningRate * (grad_w3 / n)));

    // Normalize weights to sum ~1.0
    const sumW = currentWeights.w1_name + currentWeights.w2_address_containment + currentWeights.w3_rare_tokens;
    currentWeights.w1_name = Number((currentWeights.w1_name / sumW).toFixed(3));
    currentWeights.w2_address_containment = Number((currentWeights.w2_address_containment / sumW).toFixed(3));
    currentWeights.w3_rare_tokens = Number((currentWeights.w3_rare_tokens / sumW).toFixed(3));

    // Update penalties
    currentWeights.penalty_postal_code = Math.max(0.25, Math.min(0.50, currentWeights.penalty_postal_code - learningRate * (grad_penalty_postal / n)));
    currentWeights.penalty_numeric_conflict = Math.max(0.15, Math.min(0.40, currentWeights.penalty_numeric_conflict - learningRate * (grad_penalty_numeric / n)));

    const accuracy = (tp + tn) / n;
    const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
    const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
    const f1Score = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

    finalMetrics = {
      epoch,
      loss: Number(totalLoss.toFixed(4)),
      accuracy: Number(accuracy.toFixed(3)),
      precision: Number(precision.toFixed(3)),
      recall: Number(recall.toFixed(3)),
      f1Score: Number(f1Score.toFixed(3)),
      confusionMatrix: { tp, fp, tn, fn }
    };

    if (onEpochProgress) {
      onEpochProgress(finalMetrics);
    }
  }

  return { optimizedWeights: currentWeights, finalMetrics };
}
