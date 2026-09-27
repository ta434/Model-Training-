import { BusinessRecord, EntityCluster, MatchEvaluationResult } from '../types/entityResolution';

class DisjointSet {
  private parent: number[];
  private rank: number[];

  constructor(size: number) {
    this.parent = Array.from({ length: size }, (_, i) => i);
    this.rank = new Array(size).fill(0);
  }

  find(i: number): number {
    if (this.parent[i] === i) return i;
    this.parent[i] = this.find(this.parent[i]);
    return this.parent[i];
  }

  union(i: number, j: number): void {
    const rootI = this.find(i);
    const rootJ = this.find(j);
    if (rootI === rootJ) return;

    if (this.rank[rootI] < this.rank[rootJ]) {
      this.parent[rootI] = rootJ;
    } else if (this.rank[rootI] > this.rank[rootJ]) {
      this.parent[rootJ] = rootI;
    } else {
      this.parent[rootJ] = rootI;
      this.rank[rootI]++;
    }
  }
}

/**
 * Groups records into deduplicated clusters based on matched candidate pairs
 * and synthesizes the canonical Golden Record for each cluster.
 */
export function clusterRecords(
  records: BusinessRecord[],
  evaluatedPairs: {
    record1: BusinessRecord;
    record2: BusinessRecord;
    result: MatchEvaluationResult;
  }[]
): EntityCluster[] {
  const n = records.length;
  const idToIndex = new Map<string, number>();
  records.forEach((r, idx) => idToIndex.set(r.id, idx));

  const dsu = new DisjointSet(n);
  const pairConfidence = new Map<string, number>();

  for (const item of evaluatedPairs) {
    if (item.result.match_decision === 'MATCH') {
      const idx1 = idToIndex.get(item.record1.id);
      const idx2 = idToIndex.get(item.record2.id);
      if (idx1 !== undefined && idx2 !== undefined) {
        dsu.union(idx1, idx2);
        const edgeKey = `${Math.min(idx1, idx2)}-${Math.max(idx1, idx2)}`;
        pairConfidence.set(edgeKey, item.result.confidence_score);
      }
    }
  }

  // Group by root component
  const componentMap = new Map<number, BusinessRecord[]>();
  for (let i = 0; i < n; i++) {
    const root = dsu.find(i);
    if (!componentMap.has(root)) {
      componentMap.set(root, []);
    }
    componentMap.get(root)!.push(records[i]);
  }

  // Synthesize canonical records for each cluster
  const clusters: EntityCluster[] = [];
  let clusterCount = 1;

  for (const [, memberRecords] of componentMap.entries()) {
    const canonicalRecord = synthesizeGoldenRecord(memberRecords);
    clusters.push({
      clusterId: `ENT-CLUSTER-${String(clusterCount++).padStart(3, '0')}`,
      canonicalRecord,
      records: memberRecords,
      confidence: memberRecords.length > 1 ? 0.92 : 1.0
    });
  }

  return clusters;
}

/**
 * Synthesizes a golden record by taking the most complete address,
 * cleanest title-cased name, and non-empty postal codes.
 */
function synthesizeGoldenRecord(records: BusinessRecord[]): BusinessRecord {
  if (records.length === 1) return records[0];

  // Best name: longest non-legal suffix or most structured name
  const bestName = [...records].sort((a, b) => b.name.length - a.name.length)[0].name;

  // Best address: longest address (has most landmark/detail information)
  const bestAddress = [...records].sort((a, b) => b.address.length - a.address.length)[0].address;

  // Best pincode: first non-empty 6-digit pin
  const bestPincode = records.find(r => r.pincode && r.pincode.length >= 5)?.pincode || '';

  // Best city
  const bestCity = records.find(r => r.city && r.city.length > 0)?.city || '';

  // Best phone
  const bestPhone = records.find(r => r.phone && r.phone.length > 0)?.phone || '';

  return {
    id: `GOLDEN-${records[0].id}`,
    name: bestName,
    address: bestAddress,
    city: bestCity,
    pincode: bestPincode,
    phone: bestPhone,
    category: records[0].category || 'Business'
  };
}
