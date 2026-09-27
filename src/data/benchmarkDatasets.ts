import { BusinessRecord, LabeledPair } from '../types/entityResolution';

export const BENCHMARK_PAIRS: LabeledPair[] = [
  {
    id: 'case-01',
    edgeCaseCategory: 'Case 1: Same Name, Different Business',
    description: 'Same exact business name, but operating in Pune vs Mumbai. Spatial evidence overrides name similarity.',
    groundTruth: 'NO_MATCH',
    record1: {
      id: 'REC-01A',
      name: 'Royal Cafe',
      address: 'Shop 4, FC Road, Deccan Gymkhana, Pune',
      city: 'Pune',
      pincode: '411004'
    },
    record2: {
      id: 'REC-01B',
      name: 'Royal Cafe',
      address: '15 Hill Road, Bandra West, Mumbai',
      city: 'Mumbai',
      pincode: '400050'
    }
  },
  {
    id: 'case-02',
    edgeCaseCategory: 'Case 2: Name Variations & Extra Words',
    description: 'Core name match with corporate suffix (Private Limited) discounted via asymmetric IDF.',
    groundTruth: 'MATCH',
    record1: {
      id: 'REC-02A',
      name: 'ABC Electronics',
      address: 'Plot 12, MG Road, Camp, Pune 411001',
      city: 'Pune',
      pincode: '411001'
    },
    record2: {
      id: 'REC-02B',
      name: 'ABC Electronics Private Limited',
      address: '12 MG Road, Camp, Pune 411001',
      city: 'Pune',
      pincode: '411001'
    }
  },
  {
    id: 'case-03',
    edgeCaseCategory: 'Case 3: Abbreviations & Typos',
    description: 'Minor character transposition typo ("Pranalii") and standard abbreviation ("MG Road" vs "Mahatma Gandhi Rd").',
    groundTruth: 'MATCH',
    record1: {
      id: 'REC-03A',
      name: 'Pranali Jewellers',
      address: 'Mahatma Gandhi Road, Laxmi Chowk, Sangli 416416',
      city: 'Sangli',
      pincode: '416416'
    },
    record2: {
      id: 'REC-03B',
      name: 'Pranalii Jewellers',
      address: 'MG Road, Laxmi Chowk, Sangli 416416',
      city: 'Sangli',
      pincode: '416416'
    }
  },
  {
    id: 'case-04',
    edgeCaseCategory: 'Case 4: Same Address, Different Business',
    description: 'High address overlap (same commercial plot), but completely distinct businesses. Hard Name Veto must trigger.',
    groundTruth: 'NO_MATCH',
    record1: {
      id: 'REC-04A',
      name: 'ABC Electronics',
      address: 'Plot 12, MG Road, Pune 411001',
      city: 'Pune',
      pincode: '411001'
    },
    record2: {
      id: 'REC-04B',
      name: 'XYZ Mobiles',
      address: 'Plot 12, MG Road, Pune 411001',
      city: 'Pune',
      pincode: '411001'
    }
  },
  {
    id: 'case-05',
    edgeCaseCategory: 'Case 5: Long Address vs Short Landmark',
    description: 'Asymmetric containment: short address ("Tung, Sangli") is 100% contained inside master landmark address.',
    groundTruth: 'MATCH',
    record1: {
      id: 'REC-05A',
      name: 'iCandy',
      address: 'Akashvani Samor, Near Hanuman Mandir, Tung, Sangli 416416',
      city: 'Sangli',
      pincode: '416416'
    },
    record2: {
      id: 'REC-05B',
      name: 'icandy.in',
      address: 'Tung, Sangli',
      city: 'Sangli'
    }
  },
  {
    id: 'case-06',
    edgeCaseCategory: 'Case 6: Word Order Inversion',
    description: 'Permutation-invariant token sort match. Word order is inverted between city and street name.',
    groundTruth: 'MATCH',
    record1: {
      id: 'REC-06A',
      name: 'Royal Bakers',
      address: 'MG Road Pune 411001',
      city: 'Pune',
      pincode: '411001'
    },
    record2: {
      id: 'REC-06B',
      name: 'Royal Bakers',
      address: 'Pune MG Road 411001',
      city: 'Pune',
      pincode: '411001'
    }
  },
  {
    id: 'case-07',
    edgeCaseCategory: 'Case 7: Street Number Conflicts',
    description: 'Identical business and street name, but explicit house number conflict (12 vs 42) indicates distinct physical branches.',
    groundTruth: 'NO_MATCH',
    record1: {
      id: 'REC-07A',
      name: 'Royal Bakers',
      address: '12 MG Road, Pune',
      city: 'Pune'
    },
    record2: {
      id: 'REC-07B',
      name: 'Royal Bakers',
      address: '42 MG Road, Pune',
      city: 'Pune'
    }
  },
  {
    id: 'case-08a',
    edgeCaseCategory: 'Case 8: Postal Code Explicit Conflict',
    description: 'Same business name in Pune, but postal code conflict (411001 Camp vs 411045 Baner) enforces mismatch penalty.',
    groundTruth: 'NO_MATCH',
    record1: {
      id: 'REC-08A',
      name: 'Apollo Pharmacy',
      address: 'Main Road, Camp, Pune 411001',
      city: 'Pune',
      pincode: '411001'
    },
    record2: {
      id: 'REC-08B',
      name: 'Apollo Pharmacy',
      address: 'Main Road, Baner, Pune 411045',
      city: 'Pune',
      pincode: '411045'
    }
  },
  {
    id: 'case-08b',
    edgeCaseCategory: 'Case 8: Postal Code Missing (Neutral Weight)',
    description: 'One record has 411001, the other has no pincode. Treated as neutral unknown (0), not conflict.',
    groundTruth: 'MATCH',
    record1: {
      id: 'REC-08C',
      name: 'Apollo Pharmacy',
      address: 'Plot 7, East Street, Camp, Pune 411001',
      city: 'Pune',
      pincode: '411001'
    },
    record2: {
      id: 'REC-08D',
      name: 'Apollo Pharmacy',
      address: 'Plot 7, East Street, Camp, Pune',
      city: 'Pune'
    }
  },
  {
    id: 'case-09',
    edgeCaseCategory: 'Case 9: Generic Landmark vs Different Businesses',
    description: 'Shared generic landmark ("Near Hanuman Mandir") cannot bridge distinct business entities.',
    groundTruth: 'NO_MATCH',
    record1: {
      id: 'REC-09A',
      name: 'Shree Ganesh Dairy',
      address: 'Near Hanuman Mandir, Sangli Road, Tung',
      city: 'Tung'
    },
    record2: {
      id: 'REC-09B',
      name: 'Yelavikar Hardware Store',
      address: 'Near Hanuman Mandir, Sangli Road, Tung',
      city: 'Tung'
    }
  },
  {
    id: 'case-10',
    edgeCaseCategory: 'Case 10: Common vs Rare Token Weighting',
    description: 'Rare token ("Yelavikar", "Akashvani") generates heavy IDF bonus across sparse representations.',
    groundTruth: 'MATCH',
    record1: {
      id: 'REC-10A',
      name: 'Yelavikar Auto Works',
      address: 'Akashvani Chowk, Sangli 416416',
      city: 'Sangli',
      pincode: '416416'
    },
    record2: {
      id: 'REC-10B',
      name: 'Yelavikar Automobiles',
      address: 'Near Akashvani, Sangli 416416',
      city: 'Sangli',
      pincode: '416416'
    }
  },
  {
    id: 'case-11',
    edgeCaseCategory: 'Case 11: Script Variations & Transliteration',
    description: 'Devanagari script ("हनुमान मंदिर") vs Latin English ("Hanuman Mandir") offline phonetic transliteration match.',
    groundTruth: 'MATCH',
    record1: {
      id: 'REC-11A',
      name: 'हनुमान बेकर्स',
      address: 'समोर आकाशवाणी, सांगली',
      city: 'Sangli'
    },
    record2: {
      id: 'REC-11B',
      name: 'Hanuman Bakers',
      address: 'Akashvani Samor, Sangli',
      city: 'Sangli'
    }
  }
];

export const BENCHMARK_DATASET_RECORDS: BusinessRecord[] = [
  // Cluster 1: iCandy variants
  {
    id: 'REC-101',
    name: 'iCandy',
    address: 'Akashvani Samor, Near Hanuman Mandir, Tung, Sangli 416416',
    city: 'Sangli',
    pincode: '416416',
    phone: '9822011223',
    category: 'Retail'
  },
  {
    id: 'REC-102',
    name: 'icandy.in',
    address: 'Tung, Sangli',
    city: 'Sangli',
    pincode: '416416',
    phone: '9822011223',
    category: 'Retail'
  },
  {
    id: 'REC-103',
    name: 'I Candy Apparel',
    address: 'Opposite Akashvani, Tung, Sangli 416416',
    city: 'Sangli',
    pincode: '416416',
    phone: '',
    category: 'Retail'
  },

  // Cluster 2: Royal Bakers (12 MG Road)
  {
    id: 'REC-104',
    name: 'Royal Bakers',
    address: '12 MG Road, Camp, Pune 411001',
    city: 'Pune',
    pincode: '411001',
    phone: '020-26123456',
    category: 'Bakery'
  },
  {
    id: 'REC-105',
    name: 'Royal Bakers Pvt Ltd',
    address: 'Plot 12, Mahatma Gandhi Road, Pune 411001',
    city: 'Pune',
    pincode: '411001',
    phone: '020-26123456',
    category: 'Bakery'
  },

  // Distinct branch of Royal Bakers (42 MG Road) -> Must NOT cluster with 12 MG Road!
  {
    id: 'REC-106',
    name: 'Royal Bakers',
    address: '42 MG Road, Camp, Pune 411001',
    city: 'Pune',
    pincode: '411001',
    phone: '020-26998877',
    category: 'Bakery'
  },

  // Royal Bakers Mumbai branch -> Must NOT cluster with Pune
  {
    id: 'REC-107',
    name: 'Royal Bakers',
    address: 'Shop 3, Hill Road, Bandra West, Mumbai 400050',
    city: 'Mumbai',
    pincode: '400050',
    phone: '022-26401122',
    category: 'Bakery'
  },

  // Cluster 3: ABC Electronics (Plot 12 MG Road Pune)
  {
    id: 'REC-108',
    name: 'ABC Electronics',
    address: 'Plot 12, MG Road, Camp, Pune 411001',
    city: 'Pune',
    pincode: '411001',
    phone: '9890123456',
    category: 'Electronics'
  },
  {
    id: 'REC-109',
    name: 'ABC Electronics Private Limited',
    address: '12 MG Road, Pune 411001',
    city: 'Pune',
    pincode: '411001',
    phone: '',
    category: 'Electronics'
  },

  // Same Address as ABC Electronics, but distinct business XYZ Mobiles -> Must NOT cluster!
  {
    id: 'REC-110',
    name: 'XYZ Mobiles & Repairs',
    address: 'Plot 12, MG Road, Camp, Pune 411001',
    city: 'Pune',
    pincode: '411001',
    phone: '9890998877',
    category: 'Mobile'
  },

  // Cluster 4: Yelavikar Auto Works (Rare tokens)
  {
    id: 'REC-111',
    name: 'Yelavikar Auto Works',
    address: 'Akashvani Chowk, Sangli 416416',
    city: 'Sangli',
    pincode: '416416',
    phone: '9422001122',
    category: 'Automotive'
  },
  {
    id: 'REC-112',
    name: 'Yelavikar Automobiles',
    address: 'Near Akashvani, Sangli 416416',
    city: 'Sangli',
    pincode: '416416',
    phone: '9422001122',
    category: 'Automotive'
  },

  // Transliteration pair: Devanagari vs English
  {
    id: 'REC-113',
    name: 'हनुमान बेकर्स',
    address: 'समोर आकाशवाणी, सांगली',
    city: 'Sangli',
    pincode: '416416',
    phone: '9860112233',
    category: 'Bakery'
  },
  {
    id: 'REC-114',
    name: 'Hanuman Bakers',
    address: 'Akashvani Samor, Sangli 416416',
    city: 'Sangli',
    pincode: '416416',
    phone: '9860112233',
    category: 'Bakery'
  },

  // Standalone distinct entities
  {
    id: 'REC-115',
    name: 'Pranali Jewellers',
    address: 'Laxmi Chowk, Sangli 416416',
    city: 'Sangli',
    pincode: '416416',
    phone: '0233-2345678',
    category: 'Jewellery'
  },
  {
    id: 'REC-116',
    name: 'Pranalii Jewellers LLP',
    address: 'Mahatma Gandhi Road, Laxmi Chowk, Sangli 416416',
    city: 'Sangli',
    pincode: '416416',
    phone: '0233-2345678',
    category: 'Jewellery'
  },
  {
    id: 'REC-117',
    name: 'Shree Ganesh Dairy',
    address: 'Near Hanuman Mandir, Tung, Sangli 416416',
    city: 'Sangli',
    pincode: '416416',
    phone: '',
    category: 'Dairy'
  },
  {
    id: 'REC-118',
    name: 'Apollo Pharmacy',
    address: 'Main Road, Camp, Pune 411001',
    city: 'Pune',
    pincode: '411001',
    phone: '020-26334455',
    category: 'Healthcare'
  },
  {
    id: 'REC-119',
    name: 'Apollo Pharmacy',
    address: 'Main Road, Baner, Pune 411045',
    city: 'Pune',
    pincode: '411045',
    phone: '020-27221100',
    category: 'Healthcare'
  }
];
