import { BusinessRecord, FeatureVector, MatchEvaluationResult } from '../types/entityResolution';
import {
  cleanText,
  tokenize,
  getCharNgrams,
  levenshteinRatio,
  jaroWinkler,
  tokenSortRatio,
  asymmetricTokenContainment,
  extractPostalCode,
  extractNumericTokens,
  extractCityLocality,
  isLandmarkOnlyAddress,
  defaultIDF,
  GENERIC_LEGAL_SUFFIXES
} from './nlp';

export interface ExtractionOutput {
  featureVector: FeatureVector;
  tokenBreakdown: MatchEvaluationResult['token_breakdown'];
  penalties: {
    type: string;
    description: string;
    penalty: number;
  }[];
}

/**
 * Extracts the complete 17-Property Feature Vector for record pair (R1, R2)
 */
export function extractFeatureVector(r1: BusinessRecord, r2: BusinessRecord): ExtractionOutput {
  const name1 = r1.name || '';
  const name2 = r2.name || '';
  const addr1 = r1.address || '';
  const addr2 = r2.address || '';

  const cleanName1 = cleanText(name1);
  const cleanName2 = cleanText(name2);
  const tokensName1 = tokenize(name1);
  const tokensName2 = tokenize(name2);

  const cleanAddr1 = cleanText(addr1);
  const cleanAddr2 = cleanText(addr2);
  const tokensAddr1 = tokenize(addr1);
  const tokensAddr2 = tokenize(addr2);

  // 1. name_ratio_levenshtein
  const name_ratio_levenshtein = levenshteinRatio(cleanName1, cleanName2);

  // 2. name_token_sort_ratio
  const name_token_sort_ratio = tokenSortRatio(name1, name2);

  // 3. name_tfidf_similarity
  const name_tfidf_similarity = defaultIDF.getTfidfCosine(name1, name2);

  // 4. name_jaro_winkler
  const name_jaro_winkler = jaroWinkler(cleanName1, cleanName2);

  // 5. name_ngram_containment (3-grams and 5-grams)
  const ngrams3_1 = new Set(getCharNgrams(cleanName1, 3));
  const ngrams3_2 = new Set(getCharNgrams(cleanName2, 3));
  const sharedNgrams3 = Array.from(ngrams3_1).filter(g => ngrams3_2.has(g));
  const minNgrams = Math.min(ngrams3_1.size, ngrams3_2.size) || 1;
  const name_ngram_containment = Math.min(1.0, sharedNgrams3.length / minNgrams);

  // 6. address_token_containment (Directional asymmetric containment score)
  const containmentResult = asymmetricTokenContainment(addr1, addr2);
  const address_token_containment = containmentResult.score;

  // 7. address_token_sort_ratio
  const address_token_sort_ratio = tokenSortRatio(addr1, addr2);

  // 8. address_tfidf_similarity
  const address_tfidf_similarity = defaultIDF.getTfidfCosine(addr1, addr2);

  // 9. numeric_token_match
  const nums1 = extractNumericTokens(addr1);
  const nums2 = extractNumericTokens(addr2);
  let numeric_token_match = 0;
  if (nums1.length === 0 || nums2.length === 0) {
    numeric_token_match = 0; // No numbers in one or both: neutral
  } else {
    // Check if any numbers overlap
    const set1 = new Set(nums1);
    const set2 = new Set(nums2);
    const hasOverlap = nums1.some(n => set2.has(n));
    if (hasOverlap) {
      numeric_token_match = 1; // Strict Match
    } else {
      // Explicit Conflict! (e.g. 12 vs 42)
      numeric_token_match = -1;
    }
  }

  // 10. postal_code_match
  const pin1 = r1.pincode || extractPostalCode(addr1);
  const pin2 = r2.pincode || extractPostalCode(addr2);
  let postal_code_match = 0;
  if (!pin1 || !pin2) {
    postal_code_match = 0; // Missing data: neutral 0
  } else if (pin1 === pin2) {
    postal_code_match = 1; // Exact match
  } else {
    // Explicit mismatch
    postal_code_match = -1;
  }

  // 11. locality_city_match
  const places1 = new Set([...(r1.city ? [r1.city.toLowerCase()] : []), ...extractCityLocality(addr1)]);
  const places2 = new Set([...(r2.city ? [r2.city.toLowerCase()] : []), ...extractCityLocality(addr2)]);
  let locality_city_match = 0.5; // default if neither specified
  if (places1.size > 0 && places2.size > 0) {
    const hasCommonPlace = Array.from(places1).some(p => places2.has(p));
    locality_city_match = hasCommonPlace ? 1.0 : 0.0;
  }

  // 12. is_landmark_only
  const is_landmark_only = (isLandmarkOnlyAddress(addr1) || isLandmarkOnlyAddress(addr2)) ? 1 : 0;

  // 13. rare_token_bonus
  const rareShared = defaultIDF.getRareSharedTokens(`${name1} ${addr1}`, `${name2} ${addr2}`);
  const rare_token_bonus = Math.min(1.0, rareShared.length * 0.35);

  // 14. legal_suffix_discount
  // Checks if extra words in name are just legal suffixes (e.g. Pvt Ltd)
  const diffTokens = tokensName1.filter(t => !tokensName2.includes(t))
    .concat(tokensName2.filter(t => !tokensName1.includes(t)));
  const allDiffsAreLegal = diffTokens.length > 0 && diffTokens.every(t => GENERIC_LEGAL_SUFFIXES.has(t));
  const legal_suffix_discount = allDiffsAreLegal ? 0.95 : (diffTokens.length === 0 ? 1.0 : 0.0);

  // 15. transliteration_match
  // Cleaned text already normalizes common Devanagari/Latin transliterations
  const rawLev = levenshteinRatio(name1, name2);
  const cleanLev = levenshteinRatio(cleanName1, cleanName2);
  const transliteration_match = cleanLev > rawLev + 0.15 ? 1.0 : (cleanLev > 0.8 ? 0.9 : 0.5);

  // 16. word_order_inversion_score
  // Measures high similarity when word order is inverted (e.g. Pune MG Road vs MG Road Pune)
  const orderDiff = Math.abs(name_token_sort_ratio - name_ratio_levenshtein);
  const addrOrderDiff = Math.abs(address_token_sort_ratio - levenshteinRatio(addr1, addr2));
  const word_order_inversion_score = Math.min(1.0, Math.max(orderDiff, addrOrderDiff));

  // Calculate Hard Penalties
  const penalties: { type: string; description: string; penalty: number }[] = [];
  let hardPenaltySum = 0;

  if (postal_code_match === -1) {
    const p = -0.35;
    hardPenaltySum += p;
    penalties.push({
      type: 'POSTAL_CODE_MISMATCH',
      description: `Conflicting postal codes: ${pin1} vs ${pin2}`,
      penalty: p
    });
  }

  if (numeric_token_match === -1) {
    const p = -0.25;
    hardPenaltySum += p;
    penalties.push({
      type: 'NUMERIC_CONFLICT',
      description: `Conflicting house/plot numbers: [${nums1.join(', ')}] vs [${nums2.join(', ')}]`,
      penalty: p
    });
  }

  // City conflict penalty: if explicit cities are present and do not match
  if (places1.size > 0 && places2.size > 0 && locality_city_match === 0) {
    const p = -0.30;
    hardPenaltySum += p;
    penalties.push({
      type: 'CITY_LOCALITY_CONFLICT',
      description: `Different cities/localities: [${Array.from(places1).join(', ')}] vs [${Array.from(places2).join(', ')}]`,
      penalty: p
    });
  }

  const featureVector: FeatureVector = {
    name_ratio_levenshtein: Number(name_ratio_levenshtein.toFixed(4)),
    name_token_sort_ratio: Number(name_token_sort_ratio.toFixed(4)),
    name_tfidf_similarity: Number(name_tfidf_similarity.toFixed(4)),
    name_jaro_winkler: Number(name_jaro_winkler.toFixed(4)),
    name_ngram_containment: Number(name_ngram_containment.toFixed(4)),
    address_token_containment: Number(address_token_containment.toFixed(4)),
    address_token_sort_ratio: Number(address_token_sort_ratio.toFixed(4)),
    address_tfidf_similarity: Number(address_tfidf_similarity.toFixed(4)),
    numeric_token_match,
    postal_code_match,
    locality_city_match: Number(locality_city_match.toFixed(4)),
    is_landmark_only,
    rare_token_bonus: Number(rare_token_bonus.toFixed(4)),
    legal_suffix_discount: Number(legal_suffix_discount.toFixed(4)),
    transliteration_match: Number(transliteration_match.toFixed(4)),
    word_order_inversion_score: Number(word_order_inversion_score.toFixed(4)),
    hard_penalty_sum: Number(hardPenaltySum.toFixed(4))
  };

  const nameSharedTokens = tokensName1.filter(t => tokensName2.includes(t));
  const addrSharedTokens = tokensAddr1.filter(t => tokensAddr2.includes(t));

  const tokenBreakdown: MatchEvaluationResult['token_breakdown'] = {
    name_tokens_1: tokensName1,
    name_tokens_2: tokensName2,
    name_shared_tokens: nameSharedTokens,
    address_tokens_1: tokensAddr1,
    address_tokens_2: tokensAddr2,
    address_shared_tokens: addrSharedTokens,
    numeric_tokens_1: nums1,
    numeric_tokens_2: nums2,
    postal_code_1: pin1,
    postal_code_2: pin2,
    rare_tokens: rareShared
  };

  return { featureVector, tokenBreakdown, penalties };
}
