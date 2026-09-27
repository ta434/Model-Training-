import React, { useState, useMemo } from 'react';
import {
  BusinessRecord,
  ModelWeights,
  MatchEvaluationResult
} from '../types/entityResolution';
import { evaluatePair } from '../core/model';
import { BENCHMARK_PAIRS } from '../data/benchmarkDatasets';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  Check,
  Sparkles,
  Info,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  HelpCircle
} from 'lucide-react';

interface PairTesterProps {
  weights: ModelWeights;
}

export const PairTester: React.FC<PairTesterProps> = ({ weights }) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('case-05');
  const [record1, setRecord1] = useState<BusinessRecord>(BENCHMARK_PAIRS[4].record1);
  const [record2, setRecord2] = useState<BusinessRecord>(BENCHMARK_PAIRS[4].record2);
  const [copiedJson, setCopiedJson] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'features' | 'tokens' | 'json'>('features');

  // Load a preset
  const handleSelectPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    const found = BENCHMARK_PAIRS.find(p => p.id === presetId);
    if (found) {
      setRecord1({ ...found.record1 });
      setRecord2({ ...found.record2 });
    }
  };

  // Evaluate the pair with live weights
  const result: MatchEvaluationResult = useMemo(() => {
    return evaluatePair(record1, record2, weights);
  }, [record1, record2, weights]);

  // Copy JSON to clipboard
  const handleCopyJson = () => {
    const formatted = JSON.stringify(
      {
        match_decision: result.match_decision,
        confidence_score: result.confidence_score,
        reasoning: result.reasoning,
        feature_vector: result.feature_vector,
        token_breakdown: result.token_breakdown,
        hard_penalties_triggered: result.hard_penalties_triggered
      },
      null,
      2
    );
    navigator.clipboard.writeText(formatted);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const getDecisionBadge = () => {
    switch (result.match_decision) {
      case 'MATCH':
        return (
          <div className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <div>
              <div className="text-xs uppercase tracking-wider font-semibold text-emerald-500">Match Decision</div>
              <div className="text-lg font-bold">MATCH (Link / Merge Entity)</div>
            </div>
          </div>
        );
      case 'POSSIBLE_MATCH':
        return (
          <div className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <div>
              <div className="text-xs uppercase tracking-wider font-semibold text-amber-500">Match Decision</div>
              <div className="text-lg font-bold">POSSIBLE_MATCH (Human Audit)</div>
            </div>
          </div>
        );
      case 'NO_MATCH':
      default:
        return (
          <div className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
            <XCircle className="w-5 h-5 text-rose-400" />
            <div>
              <div className="text-xs uppercase tracking-wider font-semibold text-rose-500">Match Decision</div>
              <div className="text-lg font-bold">NO_MATCH (Distinct Entities)</div>
            </div>
          </div>
        );
    }
  };

  const selectedPreset = BENCHMARK_PAIRS.find(p => p.id === selectedPresetId);

  return (
    <div className="space-y-6">
      {/* Edge-Case Benchmark Presets Bar */}
      <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 shadow-sm backdrop-blur-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-semibold text-slate-200">20 Edge-Case Featurization Test Scenarios</h2>
          </div>
          <span className="text-xs text-slate-400 hidden sm:inline">Click any scenario to load authentic candidate pair</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {BENCHMARK_PAIRS.map(preset => {
            const isSelected = preset.id === selectedPresetId;
            return (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(preset.id)}
                className={`text-left p-2.5 rounded-xl border text-xs transition-all relative overflow-hidden ${
                  isSelected
                    ? 'bg-indigo-950/70 border-indigo-500/80 text-white shadow-md shadow-indigo-950'
                    : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <div className="font-semibold truncate text-[11px] text-indigo-300">
                  {preset.id.toUpperCase()}
                </div>
                <div className="truncate font-medium text-slate-200 text-xs mt-0.5">
                  {preset.edgeCaseCategory.split(':')[1]?.trim() || preset.edgeCaseCategory}
                </div>
                <div className="flex items-center space-x-1.5 mt-1.5">
                  <span
                    className={`inline-block w-1.5 h-1.5 rounded-full ${
                      preset.groundTruth === 'MATCH' ? 'bg-emerald-400' : 'bg-rose-400'
                    }`}
                  />
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider">{preset.groundTruth}</span>
                </div>
              </button>
            );
          })}
        </div>

        {selectedPreset && (
          <div className="mt-3 text-xs bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 flex items-start space-x-2">
            <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-200">{selectedPreset.edgeCaseCategory}:</strong>{' '}
              <span className="text-slate-400">{selectedPreset.description}</span>
            </div>
          </div>
        )}
      </div>

      {/* Candidate Pair Input Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Record 1 */}
        <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Candidate Record 1 (Master / Anchor)
              </span>
              <span className="text-xs font-mono text-slate-500">ID: {record1.id}</span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Business Name</label>
                <input
                  type="text"
                  value={record1.name}
                  onChange={e => setRecord1({ ...record1, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 font-medium"
                  placeholder="e.g. ABC Electronics"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Address String</label>
                <textarea
                  rows={2}
                  value={record1.address}
                  onChange={e => setRecord1({ ...record1, address: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                  placeholder="e.g. Plot 12, MG Road, Camp, Pune 411001"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">City / Locality</label>
                  <input
                    type="text"
                    value={record1.city || ''}
                    onChange={e => setRecord1({ ...record1, city: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                    placeholder="e.g. Pune"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Postal Code (PIN)</label>
                  <input
                    type="text"
                    value={record1.pincode || ''}
                    onChange={e => setRecord1({ ...record1, pincode: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                    placeholder="e.g. 411001"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Record 2 */}
        <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20">
                Candidate Record 2 (Incoming / Query)
              </span>
              <span className="text-xs font-mono text-slate-500">ID: {record2.id}</span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Business Name</label>
                <input
                  type="text"
                  value={record2.name}
                  onChange={e => setRecord2({ ...record2, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 font-medium"
                  placeholder="e.g. ABC Electronics Private Limited"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Address String</label>
                <textarea
                  rows={2}
                  value={record2.address}
                  onChange={e => setRecord2({ ...record2, address: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                  placeholder="e.g. 12 MG Road, Pune"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">City / Locality</label>
                  <input
                    type="text"
                    value={record2.city || ''}
                    onChange={e => setRecord2({ ...record2, city: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                    placeholder="e.g. Pune"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Postal Code (PIN)</label>
                  <input
                    type="text"
                    value={record2.pincode || ''}
                    onChange={e => setRecord2({ ...record2, pincode: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                    placeholder="e.g. 411001"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Decision Output & Confidence Header */}
      <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>{getDecisionBadge()}</div>

          <div className="flex items-center space-x-6">
            <div className="text-right">
              <span className="text-xs text-slate-400 block font-medium">Composite Confidence</span>
              <span className="text-3xl font-extrabold font-mono text-white">
                {(result.confidence_score * 100).toFixed(0)}
                <span className="text-base text-slate-400 font-normal">%</span>
              </span>
            </div>

            <div className="w-36 hidden sm:block">
              <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    result.match_decision === 'MATCH'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                      : result.match_decision === 'POSSIBLE_MATCH'
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                      : 'bg-gradient-to-r from-rose-500 to-red-600'
                  }`}
                  style={{ width: `${Math.max(5, result.confidence_score * 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>0%</span>
                <span>Cutoff: {(weights.threshold_match * 100).toFixed(0)}%</span>
                <span>100%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Hard Penalties Alert Banner */}
        {result.hard_penalties_triggered.length > 0 && (
          <div className="mt-4 p-3.5 rounded-xl bg-rose-950/30 border border-rose-600/40 text-rose-300">
            <div className="flex items-center space-x-2 font-semibold text-xs text-rose-400 mb-1">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>SPATIAL HARD PENALTY TRIGGERED ({result.hard_penalties_triggered.length})</span>
            </div>
            <ul className="space-y-1 text-xs">
              {result.hard_penalties_triggered.map((p, idx) => (
                <li key={idx} className="flex items-center justify-between">
                  <span>• {p.description}</span>
                  <span className="font-mono font-bold text-rose-400 bg-rose-900/40 px-2 py-0.5 rounded">
                    {p.penalty > 0 ? `-${p.penalty.toFixed(2)}` : p.penalty.toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Explainable Reasoning Callout */}
        <div className="mt-4 bg-slate-950/70 p-4 rounded-xl border border-slate-800">
          <div className="text-xs uppercase font-semibold text-indigo-400 tracking-wider mb-1 flex items-center space-x-1.5">
            <Info className="w-3.5 h-3.5" />
            <span>Audit Trail &amp; Model Reasoning</span>
          </div>
          <p className="text-sm text-slate-200 leading-relaxed font-sans font-medium">
            "{result.reasoning}"
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="mt-6 flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveSubTab('features')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeSubTab === 'features'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-800/40'
              }`}
            >
              17-Property Feature Vector
            </button>
            <button
              onClick={() => setActiveSubTab('tokens')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeSubTab === 'tokens'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-800/40'
              }`}
            >
              Token Breakdown &amp; Diff
            </button>
            <button
              onClick={() => setActiveSubTab('json')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeSubTab === 'json'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-800/40'
              }`}
            >
              Structured JSON Output
            </button>
          </div>

          {activeSubTab === 'json' && (
            <button
              onClick={handleCopyJson}
              className="flex items-center space-x-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium bg-slate-800 px-3 py-1.5 rounded-lg"
            >
              {copiedJson ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedJson ? 'Copied!' : 'Copy JSON'}</span>
            </button>
          )}
        </div>

        {/* SUBTAB 1: 17-Property Feature Vector */}
        {activeSubTab === 'features' && (
          <div className="mt-5 space-y-6">
            {/* Category A: Name Disambiguation & Weighting */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span>Category A: Business Name Disambiguation &amp; Weighting</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <FeatureCard
                  label="name_ratio_levenshtein"
                  value={result.feature_vector.name_ratio_levenshtein}
                  description="Character Levenshtein similarity on cleaned names"
                  critical={result.feature_vector.name_ratio_levenshtein < weights.name_veto_threshold}
                  criticalText={`< ${weights.name_veto_threshold} (Hard Veto)`}
                />
                <FeatureCard
                  label="name_token_sort_ratio"
                  value={result.feature_vector.name_token_sort_ratio}
                  description="Order-agnostic token set similarity"
                />
                <FeatureCard
                  label="name_tfidf_similarity"
                  value={result.feature_vector.name_tfidf_similarity}
                  description="TF-IDF cosine similarity focusing on rare name tokens"
                />
                <FeatureCard
                  label="name_jaro_winkler"
                  value={result.feature_vector.name_jaro_winkler}
                  description="Prefix-weighted similarity for typos and abbreviations"
                />
                <FeatureCard
                  label="name_ngram_containment"
                  value={result.feature_vector.name_ngram_containment}
                  description="3-gram character intersection for phonetics & misspellings"
                />
                <FeatureCard
                  label="legal_suffix_discount"
                  value={result.feature_vector.legal_suffix_discount}
                  description="Discount applied for generic corporate terms (Pvt, Ltd, LLP)"
                />
              </div>
            </div>

            {/* Category B: Address, Structural & Spatial Disambiguation */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Category B: Address, Structural &amp; Spatial Disambiguation</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <FeatureCard
                  label="address_token_containment"
                  value={result.feature_vector.address_token_containment}
                  description="Directional subset score: |Tokens_Short ∩ Tokens_Long| / |Tokens_Short|"
                  highlight={result.feature_vector.address_token_containment >= 0.9}
                />
                <FeatureCard
                  label="address_token_sort_ratio"
                  value={result.feature_vector.address_token_sort_ratio}
                  description="Order-agnostic token set similarity on address strings"
                />
                <FeatureCard
                  label="address_tfidf_similarity"
                  value={result.feature_vector.address_tfidf_similarity}
                  description="Address TF-IDF downweighting generic tokens (Road, Plot, Near)"
                />
                <DiscreteFeatureCard
                  label="numeric_token_match"
                  value={result.feature_vector.numeric_token_match}
                  description="House / plot numbers check"
                  options={{
                    1: { text: '1 (Exact Match)', color: 'emerald' },
                    0: { text: '0 (No Numbers / Neutral)', color: 'slate' },
                    '-1': { text: '-1 (Explicit Conflict Penalty)', color: 'rose' }
                  }}
                />
                <DiscreteFeatureCard
                  label="postal_code_match"
                  value={result.feature_vector.postal_code_match}
                  description="6-digit postal code verification"
                  options={{
                    1: { text: '1 (Exact Match)', color: 'emerald' },
                    0: { text: '0 (Missing PIN / Neutral)', color: 'slate' },
                    '-1': { text: '-1 (Explicit Mismatch Penalty)', color: 'rose' }
                  }}
                />
                <FeatureCard
                  label="locality_city_match"
                  value={result.feature_vector.locality_city_match}
                  description="Locality / City territory consistency"
                />
              </div>
            </div>

            {/* Category C: Linguistic, Token Weighting & Safeguards */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                <span>Category C: Linguistic, Token Weighting &amp; Blocking Safeguards</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <FeatureCard
                  label="rare_token_bonus"
                  value={result.feature_vector.rare_token_bonus}
                  description="Bonus for low-frequency unique tokens (Akashvani, Yelavikar)"
                  highlight={result.feature_vector.rare_token_bonus > 0.2}
                />
                <FeatureCard
                  label="transliteration_match"
                  value={result.feature_vector.transliteration_match}
                  description="Phonetic / Devanagari script equivalence"
                />
                <FeatureCard
                  label="word_order_inversion_score"
                  value={result.feature_vector.word_order_inversion_score}
                  description="Permutation-invariance score (e.g. Pune MG Rd vs MG Rd Pune)"
                />
                <DiscreteFeatureCard
                  label="is_landmark_only"
                  value={result.feature_vector.is_landmark_only}
                  description="Flags if address consists solely of a landmark"
                  options={{
                    1: { text: '1 (Landmark Only)', color: 'amber' },
                    0: { text: '0 (Full Structured Address)', color: 'slate' }
                  }}
                />
                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                  <div className="text-[11px] font-mono text-slate-400">hard_penalty_sum</div>
                  <div className={`text-xl font-bold font-mono mt-1 ${result.feature_vector.hard_penalty_sum < 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                    {result.feature_vector.hard_penalty_sum.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">Sum of spatial &amp; numeric deductions applied</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 2: Token Breakdown & Diff */}
        {activeSubTab === 'tokens' && (
          <div className="mt-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="text-xs font-semibold text-slate-300 mb-2">Record 1 Tokens</div>
                <div className="flex flex-wrap gap-1.5">
                  {result.token_breakdown.name_tokens_1.map((tok, i) => (
                    <span
                      key={i}
                      className={`text-xs px-2 py-0.5 rounded-md font-mono ${
                        result.token_breakdown.name_shared_tokens.includes(tok)
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {tok}
                    </span>
                  ))}
                  {result.token_breakdown.address_tokens_1.map((tok, i) => (
                    <span
                      key={`a-${i}`}
                      className={`text-xs px-2 py-0.5 rounded-md font-mono ${
                        result.token_breakdown.rare_tokens.includes(tok)
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 font-semibold'
                          : result.token_breakdown.address_shared_tokens.includes(tok)
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-slate-800/80 text-slate-400'
                      }`}
                    >
                      {tok}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="text-xs font-semibold text-slate-300 mb-2">Record 2 Tokens</div>
                <div className="flex flex-wrap gap-1.5">
                  {result.token_breakdown.name_tokens_2.map((tok, i) => (
                    <span
                      key={i}
                      className={`text-xs px-2 py-0.5 rounded-md font-mono ${
                        result.token_breakdown.name_shared_tokens.includes(tok)
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {tok}
                    </span>
                  ))}
                  {result.token_breakdown.address_tokens_2.map((tok, i) => (
                    <span
                      key={`a-${i}`}
                      className={`text-xs px-2 py-0.5 rounded-md font-mono ${
                        result.token_breakdown.rare_tokens.includes(tok)
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 font-semibold'
                          : result.token_breakdown.address_shared_tokens.includes(tok)
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-slate-800/80 text-slate-400'
                      }`}
                    >
                      {tok}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Extracted Key Identifiers */}
            <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block mb-1">Postal Codes (PIN)</span>
                <div className="font-mono text-slate-200">
                  {result.token_breakdown.postal_code_1 || 'None'} <ArrowRight className="inline w-3 h-3 text-slate-500 mx-1" /> {result.token_breakdown.postal_code_2 || 'None'}
                </div>
              </div>
              <div>
                <span className="text-slate-400 block mb-1">Numeric Tokens (House / Plot)</span>
                <div className="font-mono text-slate-200">
                  [{result.token_breakdown.numeric_tokens_1.join(', ') || 'None'}] <ArrowRight className="inline w-3 h-3 text-slate-500 mx-1" /> [{result.token_breakdown.numeric_tokens_2.join(', ') || 'None'}]
                </div>
              </div>
              <div>
                <span className="text-slate-400 block mb-1">Rare High-IDF Tokens</span>
                <div className="font-mono text-purple-300">
                  {result.token_breakdown.rare_tokens.length > 0 ? result.token_breakdown.rare_tokens.join(', ') : 'None detected'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 3: Structured JSON Output */}
        {activeSubTab === 'json' && (
          <div className="mt-5">
            <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs font-mono text-emerald-400 overflow-x-auto max-h-96 leading-relaxed">
              {JSON.stringify(
                {
                  match_decision: result.match_decision,
                  confidence_score: result.confidence_score,
                  raw_score: result.raw_score,
                  reasoning: result.reasoning,
                  hard_penalties_triggered: result.hard_penalties_triggered,
                  feature_vector: result.feature_vector,
                  token_breakdown: result.token_breakdown
                },
                null,
                2
              )}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

interface FeatureCardProps {
  label: string;
  value: number;
  description: string;
  highlight?: boolean;
  critical?: boolean;
  criticalText?: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  label,
  value,
  description,
  highlight,
  critical,
  criticalText
}) => {
  return (
    <div
      className={`p-3 rounded-xl border transition-all ${
        critical
          ? 'bg-rose-950/40 border-rose-600/50'
          : highlight
          ? 'bg-emerald-950/20 border-emerald-500/40'
          : 'bg-slate-950/80 border-slate-800'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-mono font-medium text-slate-400 truncate">{label}</span>
        <span
          className={`text-sm font-bold font-mono ${
            critical
              ? 'text-rose-400'
              : highlight
              ? 'text-emerald-400'
              : value >= 0.8
              ? 'text-indigo-400'
              : 'text-slate-200'
          }`}
        >
          {value.toFixed(4)}
        </span>
      </div>

      <div className="h-1.5 w-full bg-slate-800 rounded-full mt-2 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            critical
              ? 'bg-rose-500'
              : highlight
              ? 'bg-emerald-400'
              : value >= 0.8
              ? 'bg-indigo-500'
              : 'bg-slate-600'
          }`}
          style={{ width: `${Math.min(100, Math.max(0, value * 100))}%` }}
        />
      </div>

      <div className="text-[10px] text-slate-500 mt-1.5 truncate">
        {critical && criticalText ? (
          <span className="text-rose-400 font-semibold">{criticalText}</span>
        ) : (
          description
        )}
      </div>
    </div>
  );
};

interface DiscreteFeatureCardProps {
  label: string;
  value: number;
  description: string;
  options: Record<string, { text: string; color: string }>;
}

const DiscreteFeatureCard: React.FC<DiscreteFeatureCardProps> = ({
  label,
  value,
  description,
  options
}) => {
  const opt = options[String(value)] || { text: String(value), color: 'slate' };
  const colorClass =
    opt.color === 'emerald'
      ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
      : opt.color === 'rose'
      ? 'text-rose-400 bg-rose-500/10 border-rose-500/20'
      : opt.color === 'amber'
      ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
      : 'text-slate-300 bg-slate-800 border-slate-700';

  return (
    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
      <div className="text-[11px] font-mono text-slate-400">{label}</div>
      <div className="mt-1">
        <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-md border ${colorClass}`}>
          {opt.text}
        </span>
      </div>
      <div className="text-[10px] text-slate-500 mt-1.5">{description}</div>
    </div>
  );
};
