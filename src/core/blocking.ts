import { BusinessRecord, MultiPassBlockingResult, BlockingPassResult } from '../types/entityResolution';
import { cleanText, tokenize, extractPostalCode, extractCityLocality, defaultIDF } from './nlp';

export function runMultiPassUnionBlocking(records: BusinessRecord[]): MultiPassBlockingResult {
  const n = records.length;
  const totalCartesianPairs = (n * (n - 1)) / 2;

  // Key -> array of record indices
  const pass1Buckets = new Map<string, number[]>(); // Exact Cleaned Name Key
  const pass2Buckets = new Map<string, number[]>(); // First 4 Chars of Name + City/Locality
  const pass3Buckets = new Map<string, number[]>(); // Shared High-IDF Address Tokens
  const pass4Buckets = new Map<string, number[]>(); // Postal Code + Name Prefix n-grams

  // Pre-fit IDF on incoming records
  defaultIDF.fit(records.map(r => `${r.name} ${r.address}`));

  // Generate blocking keys for each record
  for (let i = 0; i < records.length; i++) {
    const r = records[i];
    const cleanedName = cleanText(r.name);
    const postalCode = r.pincode || extractPostalCode(r.address) || 'NOPIN';
    const cities = extractCityLocality(r.address);
    const city = r.city ? cleanText(r.city) : (cities[0] || 'NOCITY');

    // Pass 1: Exact Cleaned Name Key
    if (cleanedName.length > 0) {
      const k1 = cleanedName;
      if (!pass1Buckets.has(k1)) pass1Buckets.set(k1, []);
      pass1Buckets.get(k1)!.push(i);
    }

    // Pass 2: First 4 Chars of Name + City/Locality
    const prefix4 = cleanedName.slice(0, 4);
    if (prefix4.length >= 2) {
      const k2 = `${prefix4}_${city}`;
      if (!pass2Buckets.has(k2)) pass2Buckets.set(k2, []);
      pass2Buckets.get(k2)!.push(i);
    }

    // Pass 3: Shared High-IDF Address Tokens (tokens with IDF > 3.0)
    const addrTokens = tokenize(r.address);
    const highIdfTokens = addrTokens.filter(t => defaultIDF.getIDF(t) >= 2.5);
    for (const token of highIdfTokens) {
      const k3 = `high_idf_${token}`;
      if (!pass3Buckets.has(k3)) pass3Buckets.set(k3, []);
      pass3Buckets.get(k3)!.push(i);
    }

    // Pass 4: Postal Code + Name Prefix n-grams (3-gram prefix)
    const prefix3 = cleanedName.slice(0, 3);
    if (postalCode !== 'NOPIN') {
      const k4 = `pin_${postalCode}_${prefix3}`;
      if (!pass4Buckets.has(k4)) pass4Buckets.set(k4, []);
      pass4Buckets.get(k4)!.push(i);
    }
  }

  // Candidate pair map: "i-j" -> Set of pass numbers that captured it
  const pairPassMap = new Map<string, Set<number>>();

  function addPairsFromBuckets(buckets: Map<string, number[]>, passNum: number): { pairsCount: number; keysCount: number } {
    let pairsCount = 0;
    for (const [, indices] of buckets.entries()) {
      if (indices.length < 2) continue;
      // Cap max cluster size to prevent combinatorial explosion on overly generic tokens
      const capped = indices.slice(0, 50);
      for (let a = 0; a < capped.length; a++) {
        for (let b = a + 1; b < capped.length; b++) {
          const idx1 = Math.min(capped[a], capped[b]);
          const idx2 = Math.max(capped[a], capped[b]);
          const pairKey = `${idx1}-${idx2}`;
          if (!pairPassMap.has(pairKey)) {
            pairPassMap.set(pairKey, new Set<number>());
          }
          pairPassMap.get(pairKey)!.add(passNum);
          pairsCount++;
        }
      }
    }
    return { pairsCount, keysCount: buckets.size };
  }

  const p1 = addPairsFromBuckets(pass1Buckets, 1);
  const p2 = addPairsFromBuckets(pass2Buckets, 2);
  const p3 = addPairsFromBuckets(pass3Buckets, 3);
  const p4 = addPairsFromBuckets(pass4Buckets, 4);

  const passResults: BlockingPassResult[] = [
    {
      passNumber: 1,
      name: 'Exact Cleaned Name Key',
      description: 'Normalizes lowercase and spaces, clusters exact business name matches',
      generatedPairsCount: p1.pairsCount,
      keysCreatedCount: p1.keysCount
    },
    {
      passNumber: 2,
      name: 'Prefix-4 + City / Locality',
      description: 'Captures legal suffix variations & abbreviations in same locality',
      generatedPairsCount: p2.pairsCount,
      keysCreatedCount: p2.keysCount
    },
    {
      passNumber: 3,
      name: 'Shared High-IDF Address Tokens',
      description: 'Finds candidate entities sharing rare distinctive landmarks or sub-localities',
      generatedPairsCount: p3.pairsCount,
      keysCreatedCount: p3.keysCount
    },
    {
      passNumber: 4,
      name: 'Postal Code + Name Prefix (3-gram)',
      description: 'Locates nearby variations within exact postal code envelope',
      generatedPairsCount: p4.pairsCount,
      keysCreatedCount: p4.keysCount
    }
  ];

  // Build unique candidate pair list
  const candidatePairs: MultiPassBlockingResult['candidatePairs'] = [];
  for (const [key, passes] of pairPassMap.entries()) {
    const [idx1, idx2] = key.split('-').map(Number);
    candidatePairs.push({
      record1: records[idx1],
      record2: records[idx2],
      matchedPasses: Array.from(passes).sort()
    });
  }

  const totalCandidatePairs = candidatePairs.length;
  const reductionRatioPercentage = totalCartesianPairs > 0
    ? Number((((totalCartesianPairs - totalCandidatePairs) / totalCartesianPairs) * 100).toFixed(2))
    : 0;

  return {
    totalCartesianPairs,
    totalCandidatePairs,
    reductionRatioPercentage,
    passResults,
    candidatePairs
  };
}
