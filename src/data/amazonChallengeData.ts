import { BusinessRecord } from '../types/entityResolution';

export interface MultiSourceDataset {
  source1: BusinessRecord[];
  source2: BusinessRecord[];
  source3: BusinessRecord[];
  groundTruth: Record<string, string[]>; // source1_id -> matching IDs
}

export const AMAZON_CHALLENGE_SAMPLE: MultiSourceDataset = {
  // SOURCE 1: Reference, clean, deduplicated (15 Entities)
  source1: [
    {
      id: 'S1-752914',
      name: 'Acme Robotics Inc.',
      address: '500 Market St, San Jose',
      city: 'San Jose',
      pincode: '95113'
    },
    {
      id: 'S1-889301',
      name: 'Delta Foods',
      address: '8 Oak Ave, Austin',
      city: 'Austin',
      pincode: '78701'
    },
    {
      id: 'S1-410562',
      name: 'Bright Cafe LLC',
      address: '22 Pine Street, Reno',
      city: 'Reno',
      pincode: '89501'
    },
    {
      id: 'S1-201774',
      name: 'Zen Traders',
      address: '4 Hill Rd, Reno',
      city: 'Reno',
      pincode: '89502'
    },
    {
      id: 'S1-901122',
      name: 'Royal Bakers Pvt Ltd',
      address: '12 MG Road, Camp, Pune 411001',
      city: 'Pune',
      pincode: '411001'
    },
    {
      id: 'S1-334455',
      name: 'iCandy Apparel',
      address: 'Akashvani Samor, Near Hanuman Mandir, Tung, Sangli 416416',
      city: 'Sangli',
      pincode: '416416'
    },
    {
      id: 'S1-556677',
      name: 'Highland Logistics Corp',
      address: '700 Industrial Parkway, Chicago',
      city: 'Chicago',
      pincode: '60601'
    },
    {
      id: 'S1-102938',
      name: 'Apex Diagnostic Labs',
      address: '14 Healthcare Ave, Boston',
      city: 'Boston',
      pincode: '02115'
    },
    {
      id: 'S1-495821',
      name: 'Horizon Books & Media',
      address: '88 Broadway, New York',
      city: 'New York',
      pincode: '10003'
    },
    {
      id: 'S1-678912',
      name: 'Golden Valley Organics',
      address: '320 Farm Way, Fresno',
      city: 'Fresno',
      pincode: '93720'
    },
    {
      id: 'S1-839201',
      name: 'Metro Electricals',
      address: '55 Station Road, Mumbai',
      city: 'Mumbai',
      pincode: '400001'
    },
    {
      id: 'S1-382910',
      name: 'Pacific Maritime Services',
      address: '10 Harbor View, Seattle',
      city: 'Seattle',
      pincode: '98101'
    },
    {
      id: 'S1-592019',
      name: 'Silverline Auto Parts',
      address: '42 Motor Mile, Detroit',
      city: 'Detroit',
      pincode: '48201'
    },
    {
      id: 'S1-748291',
      name: 'Pine Crest Dental Clinic',
      address: '205 Forest Ave, Denver',
      city: 'Denver',
      pincode: '80202'
    },
    // Rare Singleton (Only ~6.7% of dataset)
    {
      id: 'S1-998811',
      name: 'Urban Crafts & Pottery',
      address: '14 Arts District Blvd, Portland',
      city: 'Portland',
      pincode: '97201'
    }
  ],

  // SOURCE 2: Vendor A format (abbreviated, noisy)
  source2: [
    {
      id: 'S2-118820',
      name: 'Acme Robotics Incorporated',
      address: '500 Market Street, San Jose CA',
      city: 'San Jose',
      pincode: '95113'
    },
    {
      id: 'S2-540221',
      name: 'Acme Bakery',
      address: '12 Elm Rd, San Jose',
      city: 'San Jose',
      pincode: '95113'
    },
    {
      id: 'S2-397155',
      name: 'Delta Foods Co',
      address: '8 Oak Avenue, Austin',
      city: 'Austin',
      pincode: '78701'
    },
    {
      id: 'S2-063541',
      name: 'Bright Cafe',
      address: '22 Pine Street, Reno',
      city: 'Reno',
      pincode: '89501'
    },
    {
      id: 'S2-201775',
      name: 'Zen Traders Inc',
      address: '4 Hill Road, Reno NV',
      city: 'Reno',
      pincode: '89502'
    },
    {
      id: 'S2-901123',
      name: 'Royal Bakers',
      address: '12 MG Road, Pune',
      city: 'Pune',
      pincode: '411001'
    },
    {
      id: 'S2-901124',
      name: 'Royal Bakers',
      address: '42 MG Road, Pune', // Conflicting house number -> MUST NOT MATCH
      city: 'Pune',
      pincode: '411001'
    },
    {
      id: 'S2-334456',
      name: 'icandy.in',
      address: 'Tung, Sangli',
      city: 'Sangli',
      pincode: '416416'
    },
    {
      id: 'S2-556678',
      name: 'Highland Logistics',
      address: '700 Industrial Pkwy, Chicago IL',
      city: 'Chicago',
      pincode: '60601'
    },
    {
      id: 'S2-102939',
      name: 'Apex Diagnostic Labs LLC',
      address: '14 Healthcare Avenue, Boston',
      city: 'Boston',
      pincode: '02115'
    },
    {
      id: 'S2-495822',
      name: 'Horizon Books',
      address: '88 Broadway St, New York NY',
      city: 'New York',
      pincode: '10003'
    },
    {
      id: 'S2-678913',
      name: 'Golden Valley Organics Co',
      address: '320 Farm Way, Fresno CA',
      city: 'Fresno',
      pincode: '93720'
    },
    {
      id: 'S2-839202',
      name: 'Metro Electricals Pvt Ltd',
      address: '55 Station Rd, Fort, Mumbai',
      city: 'Mumbai',
      pincode: '400001'
    },
    {
      id: 'S2-382911',
      name: 'Pacific Maritime Services',
      address: '10 Harbor View Dr, Seattle',
      city: 'Seattle',
      pincode: '98101'
    },
    {
      id: 'S2-592020',
      name: 'Silverline Auto Parts Inc',
      address: '42 Motor Mile Rd, Detroit',
      city: 'Detroit',
      pincode: '48201'
    },
    {
      id: 'S2-748292',
      name: 'Pine Crest Dental Clinic',
      address: '205 Forest Ave, Denver CO',
      city: 'Denver',
      pincode: '80202'
    }
  ],

  // SOURCE 3: Vendor B format (landmarks, missing tokens)
  source3: [
    {
      id: 'S3-065477',
      name: 'Acme Robotics',
      address: 'Nr. City Hall, San Jose',
      city: 'San Jose',
      pincode: ''
    },
    {
      id: 'S3-063118',
      name: 'Acme Bakery',
      address: '500 Market St, San Jose', // Conflict: Bakery vs Robotics
      city: 'San Jose',
      pincode: '95113'
    },
    {
      id: 'S3-851230',
      name: 'Delta Foods Ltd',
      address: '8 Oak Ave, Austin',
      city: 'Austin',
      pincode: '78701'
    },
    {
      id: 'S3-063542',
      name: 'Bright Cafe & Lounge',
      address: 'Near Downtown Plaza, 22 Pine, Reno',
      city: 'Reno',
      pincode: '89501'
    },
    {
      id: 'S3-201776',
      name: 'Zen Traders',
      address: 'Opposite Park, Hill Road, Reno',
      city: 'Reno',
      pincode: '89502'
    },
    {
      id: 'S3-334457',
      name: 'I Candy',
      address: 'Opp. Akashvani, Tung',
      city: 'Sangli',
      pincode: ''
    },
    {
      id: 'S3-556679',
      name: 'Highland Cargo & Logistics',
      address: 'Industrial Parkway, Chicago',
      city: 'Chicago',
      pincode: '60601'
    },
    {
      id: 'S3-102940',
      name: 'Apex Diagnostics',
      address: 'Near General Hospital, Boston',
      city: 'Boston',
      pincode: '02115'
    },
    {
      id: 'S3-495823',
      name: 'Horizon Media & Books',
      address: 'Union Square Broadway, New York',
      city: 'New York',
      pincode: '10003'
    },
    {
      id: 'S3-678914',
      name: 'Golden Valley Organic Foods',
      address: 'Farm Way, Fresno',
      city: 'Fresno',
      pincode: '93720'
    },
    {
      id: 'S3-839203',
      name: 'Metro Electrical Store',
      address: 'Opp CST Station, Mumbai',
      city: 'Mumbai',
      pincode: '400001'
    },
    {
      id: 'S3-382912',
      name: 'Pacific Maritime',
      address: 'Pier 66 Harbor, Seattle',
      city: 'Seattle',
      pincode: '98101'
    },
    {
      id: 'S3-592021',
      name: 'Silverline Automotive',
      address: 'Motor Mile, Detroit',
      city: 'Detroit',
      pincode: '48201'
    }
  ],

  // Ground Truth: 14 out of 15 entities have matches (93.3% match rate; only ~6.7% singletons)
  groundTruth: {
    'S1-752914': ['S2-118820', 'S3-065477'],
    'S1-889301': ['S2-397155', 'S3-851230'],
    'S1-410562': ['S2-063541', 'S3-063542'],
    'S1-201774': ['S2-201775', 'S3-201776'],
    'S1-901122': ['S2-901123'], // (Note: S2-901124 is 42 MG Road, conflicting plot -> NO MATCH!)
    'S1-334455': ['S2-334456', 'S3-334457'],
    'S1-556677': ['S2-556678', 'S3-556679'],
    'S1-102938': ['S2-102939', 'S3-102940'],
    'S1-495821': ['S2-495822', 'S3-495823'],
    'S1-678912': ['S2-678913', 'S3-678914'],
    'S1-839201': ['S2-839202', 'S3-839203'],
    'S1-382910': ['S2-382911', 'S3-382912'],
    'S1-592019': ['S2-592020', 'S3-592021'],
    'S1-748291': ['S2-748292'],
    'S1-998811': [] // The rare true singleton
  }
};

/**
 * Calculates the official challenge metric: macro F_0.5 (precision-weighted)
 * F_0.5 = (1.25 * Precision * Recall) / (0.25 * Precision + Recall)
 */
export function calculateMacroF05(
  predictions: Record<string, string[]>,
  groundTruth: Record<string, string[]>
): {
  macroF05: number;
  macroPrecision: number;
  macroRecall: number;
  matchedRatio: number;
  singletonRatio: number;
  entityScores: {
    source1_id: string;
    precision: number;
    recall: number;
    f05: number;
    isSingleton: boolean;
    correctSingleton: boolean;
  }[];
} {
  const entityScores = [];
  let sumF05 = 0;
  let sumP = 0;
  let sumR = 0;
  let totalSingletons = 0;
  let correctSingletons = 0;
  const s1Ids = Object.keys(groundTruth);

  for (const s1Id of s1Ids) {
    const trueSet = new Set(groundTruth[s1Id] || []);
    const predSet = new Set(predictions[s1Id] || []);

    const isSingleton = trueSet.size === 0;
    if (isSingleton) totalSingletons++;

    if (isSingleton) {
      if (predSet.size === 0) {
        // Full score 1.0 for correctly predicting empty match
        correctSingletons++;
        entityScores.push({
          source1_id: s1Id,
          precision: 1.0,
          recall: 1.0,
          f05: 1.0,
          isSingleton: true,
          correctSingleton: true
        });
        sumF05 += 1.0;
        sumP += 1.0;
        sumR += 1.0;
      } else {
        // False merge on singleton scores 0!
        entityScores.push({
          source1_id: s1Id,
          precision: 0.0,
          recall: 0.0,
          f05: 0.0,
          isSingleton: true,
          correctSingleton: false
        });
      }
      continue;
    }

    // Non-singleton
    let tp = 0;
    for (const p of predSet) {
      if (trueSet.has(p)) tp++;
    }

    const precision = predSet.size > 0 ? tp / predSet.size : 0.0;
    const recall = trueSet.size > 0 ? tp / trueSet.size : 0.0;

    let f05 = 0;
    if (precision + recall > 0) {
      f05 = (1.25 * precision * recall) / (0.25 * precision + recall);
    }

    sumP += precision;
    sumR += recall;
    sumF05 += f05;

    entityScores.push({
      source1_id: s1Id,
      precision,
      recall,
      f05,
      isSingleton: false,
      correctSingleton: false
    });
  }

  const n = s1Ids.length || 1;
  const matchedEntities = n - totalSingletons;

  return {
    macroF05: Number((sumF05 / n).toFixed(4)),
    macroPrecision: Number((sumP / n).toFixed(4)),
    macroRecall: Number((sumR / n).toFixed(4)),
    matchedRatio: Number((matchedEntities / n * 100).toFixed(1)),
    singletonRatio: Number((totalSingletons / n * 100).toFixed(1)),
    entityScores
  };
}
