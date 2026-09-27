// NLP and String Similarity Utilities for Entity Resolution

// Common stop words and generic address/corporate tokens
export const GENERIC_LEGAL_SUFFIXES = new Set([
  'pvt', 'ltd', 'private', 'limited', 'llp', 'inc', 'corp', 'corporation',
  'co', 'company', 'enterprises', 'associates', 'group', 'services', 'solutions',
  'industries', 'ventures', 'holdings', 'agency', 'traders', 'agency'
]);

export const GENERIC_ADDRESS_TOKENS = new Set([
  'road', 'rd', 'street', 'st', 'lane', 'ln', 'marg', 'avenue', 'ave',
  'near', 'opp', 'opposite', 'behind', 'beside', 'next', 'samor', 'chowk',
  'plot', 'shop', 'gala', 'floor', 'flr', 'bldg', 'building', 'complex', 'tower',
  'nagar', 'colony', 'galli', 'gali', 'sector', 'sec', 'phase', 'block',
  'pune', 'mumbai', 'delhi', 'bangalore', 'sangli', 'kolhapur', 'thane', 'india'
]);

// Landmark cue keywords
export const LANDMARK_INDICATORS = new Set([
  'near', 'opp', 'opposite', 'behind', 'beside', 'next', 'samor', 'jawal',
  'mandir', 'temple', 'masjid', 'church', 'hospital', 'school', 'college',
  'garden', 'lake', 'circle', 'chowk', 'bridge', 'station', 'stand', 'depot',
  'akashvani', 'naka', 'gate'
]);

// Common phonetic/transliteration substitutions (Devanagari to Latin and common Indic variations)
const TRANSLITERATION_MAP: Record<string, string> = {
  'हनुमान': 'hanuman',
  'मंदिर': 'mandir',
  'रॉयल': 'royal',
  'कॅफे': 'cafe',
  'कफे': 'cafe',
  'बेकर्स': 'bakers',
  'इलेक्ट्रॉनिक्स': 'electronics',
  'मोबाईल्स': 'mobiles',
  'आकाशवाणी': 'akashvani',
  'समोर': 'samor',
  'तुंग': 'tung',
  'सांगली': 'sangli',
  'पुणे': 'pune',
  'मुंबई': 'mumbai',
  'चौक': 'chowk',
  'रस्ता': 'road',
  'नगर': 'nagar',
  'वाडी': 'wadi'
};

/**
 * Clean text: lowercase, remove non-alphanumeric (keep spaces), normalize whitespace
 */
export function cleanText(text: string): string {
  if (!text) return '';
  let str = text.toLowerCase();

  // Transliterate known Devanagari tokens if present
  for (const [indic, latin] of Object.entries(TRANSLITERATION_MAP)) {
    if (str.includes(indic)) {
      str = str.replace(new RegExp(indic, 'g'), latin);
    }
  }

  // Normalize punctuation and non-alphanumeric except spaces
  str = str.replace(/[^\p{L}\p{N}\s]/gu, ' ');
  // Compress multi-space
  return str.replace(/\s+/g, ' ').trim();
}

/**
 * Tokenize cleaned text into word array
 */
export function tokenize(text: string): string[] {
  const cleaned = cleanText(text);
  if (!cleaned) return [];
  return cleaned.split(' ').filter(t => t.length > 0);
}

/**
 * Extract character n-grams
 */
export function getCharNgrams(text: string, n: number): string[] {
  const cleaned = cleanText(text).replace(/\s/g, '');
  if (cleaned.length < n) return [cleaned];
  const ngrams: string[] = [];
  for (let i = 0; i <= cleaned.length - n; i++) {
    ngrams.push(cleaned.slice(i, i + n));
  }
  return ngrams;
}

/**
 * Character-level Levenshtein Distance similarity (normalized [0, 1])
 */
export function levenshteinRatio(s1: string, s2: string): number {
  const c1 = cleanText(s1);
  const c2 = cleanText(s2);
  if (c1 === c2) return 1.0;
  if (!c1.length || !c2.length) return 0.0;

  const len1 = c1.length;
  const len2 = c2.length;
  const d: number[][] = [];

  for (let i = 0; i <= len1; i++) {
    d[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    d[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = c1[i - 1] === c2[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1,       // deletion
        d[i][j - 1] + 1,       // insertion
        d[i - 1][j - 1] + cost // substitution
      );
    }
  }

  const maxLen = Math.max(len1, len2);
  const distance = d[len1][len2];
  return Math.max(0, 1 - distance / maxLen);
}

/**
 * Jaro-Winkler Distance (gives higher weight to common prefix up to 4 chars)
 */
export function jaroWinkler(s1: string, s2: string): number {
  const a = cleanText(s1);
  const b = cleanText(s2);
  if (a === b) return 1.0;
  if (!a.length || !b.length) return 0.0;

  const matchDistance = Math.floor(Math.max(a.length, b.length) / 2) - 1;
  const aMatches = new Array(a.length).fill(false);
  const bMatches = new Array(b.length).fill(false);

  let matches = 0;
  for (let i = 0; i < a.length; i++) {
    const start = Math.max(0, i - matchDistance);
    const end = Math.min(i + matchDistance + 1, b.length);
    for (let j = start; j < end; j++) {
      if (bMatches[j]) continue;
      if (a[i] !== b[j]) continue;
      aMatches[i] = true;
      bMatches[j] = true;
      matches++;
      break;
    }
  }

  if (matches === 0) return 0.0;

  let transpositions = 0;
  let k = 0;
  for (let i = 0; i < a.length; i++) {
    if (!aMatches[i]) continue;
    while (!bMatches[k]) k++;
    if (a[i] !== b[k]) transpositions++;
    k++;
  }
  transpositions = transpositions / 2;

  const jaro = (matches / a.length + matches / b.length + (matches - transpositions) / matches) / 3;

  // Winkler prefix scaling (up to 4 chars)
  let prefix = 0;
  for (let i = 0; i < Math.min(4, Math.min(a.length, b.length)); i++) {
    if (a[i] === b[i]) prefix++;
    else break;
  }

  const p = 0.1; // standard scaling factor
  return Math.min(1.0, jaro + prefix * p * (1 - jaro));
}

/**
 * Token Sort Ratio: sort tokens alphabetically and compute Levenshtein ratio
 * (Agnostic to word inversion like "MG Road Pune" vs "Pune MG Road")
 */
export function tokenSortRatio(s1: string, s2: string): number {
  const tokens1 = tokenize(s1).sort().join(' ');
  const tokens2 = tokenize(s2).sort().join(' ');
  return levenshteinRatio(tokens1, tokens2);
}

/**
 * Directional Asymmetric Token Containment
 * Score = |Tokens_Short ∩ Tokens_Long| / |Tokens_Short|
 */
export function asymmetricTokenContainment(s1: string, s2: string): {
  score: number;
  shortTokens: string[];
  longTokens: string[];
  intersectedTokens: string[];
} {
  const t1 = tokenize(s1);
  const t2 = tokenize(s2);

  if (t1.length === 0 || t2.length === 0) {
    return { score: 0, shortTokens: [], longTokens: [], intersectedTokens: [] };
  }

  const [shortArr, longArr] = t1.length <= t2.length ? [t1, t2] : [t2, t1];
  const longSet = new Set(longArr);

  const matched = shortArr.filter(token => {
    if (longSet.has(token)) return true;
    // Allow minor typos in token containment (>0.85 levenshtein)
    for (const lt of longSet) {
      if (levenshteinRatio(token, lt) >= 0.85) return true;
    }
    return false;
  });

  const score = matched.length / shortArr.length;
  return {
    score: Math.min(1.0, score),
    shortTokens: shortArr,
    longTokens: longArr,
    intersectedTokens: matched
  };
}

/**
 * Extract 6-digit Indian PIN code or postal code
 */
export function extractPostalCode(text: string): string | null {
  if (!text) return null;
  // Match 6-digit standalone pin code e.g. 411001, 416416
  const match6 = text.match(/\b([1-9][0-9]{5})\b/);
  if (match6) return match6[1];
  // Match 5-digit US ZIP code
  const match5 = text.match(/\b([0-9]{5})\b/);
  if (match5) return match5[1];
  return null;
}

/**
 * Extract numeric tokens (house, plot, flat, shop numbers)
 */
export function extractNumericTokens(text: string): string[] {
  if (!text) return [];
  // Exclude 6-digit postal codes so they don't corrupt house numbers
  const postalCode = extractPostalCode(text);
  let cleaned = text;
  if (postalCode) {
    cleaned = cleaned.replace(postalCode, ' ');
  }

  const numbers = cleaned.match(/\b\d+([a-zA-Z])?\b/g) || [];
  // Filter out any numbers > 9999 (likely phone or pin segments)
  return Array.from(new Set(numbers.filter(n => {
    const num = parseInt(n, 10);
    return !isNaN(num) && num < 10000;
  })));
}

/**
 * Extract likely City / Locality candidates
 */
export function extractCityLocality(address: string): string[] {
  const tokens = tokenize(address);
  // Cities or known localities
  const knownPlaces = [
    'pune', 'mumbai', 'sangli', 'tung', 'kolhapur', 'delhi', 'bangalore',
    'hyderabad', 'chennai', 'ahmedabad', 'thane', 'nagpur', 'nashik',
    'kothrud', 'viman nagar', 'wakad', 'baner', 'hadapsar', 'swargate',
    'camp', 'deccan', 'andheri', 'bandra', 'dadar', 'borivali'
  ];
  const found: string[] = [];
  const textLower = address.toLowerCase();
  for (const place of knownPlaces) {
    if (textLower.includes(place)) {
      found.push(place);
    }
  }
  return found;
}

/**
 * Check if address consists solely of generic landmark
 */
export function isLandmarkOnlyAddress(address: string): boolean {
  const tokens = tokenize(address);
  if (tokens.length <= 4) {
    const hasLandmark = tokens.some(t => LANDMARK_INDICATORS.has(t));
    if (hasLandmark) return true;
  }
  return false;
}

/**
 * IDF dictionary simulator and rare word score
 */
export class IDFComputer {
  private docFrequencies: Map<string, number> = new Map();
  private totalDocs: number = 0;

  constructor() {
    // Seed with high baseline counts for generic tokens
    for (const token of GENERIC_ADDRESS_TOKENS) {
      this.docFrequencies.set(token, 1000);
    }
    for (const token of GENERIC_LEGAL_SUFFIXES) {
      this.docFrequencies.set(token, 1000);
    }
    this.totalDocs = 1500;
  }

  public fit(texts: string[]): void {
    this.totalDocs += texts.length;
    for (const text of texts) {
      const uniqueTokens = new Set(tokenize(text));
      for (const token of uniqueTokens) {
        this.docFrequencies.set(token, (this.docFrequencies.get(token) || 0) + 1);
      }
    }
  }

  public getIDF(token: string): number {
    const df = this.docFrequencies.get(token) || 1;
    // Standard IDF: log( (N + 1) / (df + 1) ) + 1
    return Math.log((this.totalDocs + 1) / (df + 1)) + 1;
  }

  public getTfidfCosine(s1: string, s2: string): number {
    const t1 = tokenize(s1);
    const t2 = tokenize(s2);
    if (t1.length === 0 || t2.length === 0) return 0;

    const vec1: Map<string, number> = new Map();
    const vec2: Map<string, number> = new Map();

    for (const t of t1) {
      const idf = this.getIDF(t);
      vec1.set(t, (vec1.get(t) || 0) + idf);
    }
    for (const t of t2) {
      const idf = this.getIDF(t);
      vec2.set(t, (vec2.get(t) || 0) + idf);
    }

    let dot = 0;
    for (const [term, val1] of vec1.entries()) {
      if (vec2.has(term)) {
        dot += val1 * vec2.get(term)!;
      }
    }

    let norm1 = 0;
    for (const v of vec1.values()) norm1 += v * v;
    let norm2 = 0;
    for (const v of vec2.values()) norm2 += v * v;

    if (norm1 === 0 || norm2 === 0) return 0;
    return Math.min(1.0, dot / (Math.sqrt(norm1) * Math.sqrt(norm2)));
  }

  public getRareSharedTokens(s1: string, s2: string, thresholdIDF = 3.5): string[] {
    const t1 = new Set(tokenize(s1));
    const t2 = new Set(tokenize(s2));
    const rare: string[] = [];
    for (const token of t1) {
      if (t2.has(token)) {
        if (this.getIDF(token) >= thresholdIDF) {
          rare.push(token);
        }
      }
    }
    return rare;
  }
}

// Global default IDF computer pre-populated
export const defaultIDF = new IDFComputer();
