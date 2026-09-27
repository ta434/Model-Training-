import React, { useMemo, useState } from 'react';
import { BusinessRecord, ModelWeights, EntityCluster } from '../types/entityResolution';
import { runMultiPassUnionBlocking } from '../core/blocking';
import { evaluatePair } from '../core/model';
import { clusterRecords } from '../core/clustering';
import { BENCHMARK_DATASET_RECORDS } from '../data/benchmarkDatasets';
import {
  GitBranch,
  Crown,
  Layers,
  ArrowRight,
  Download,
  CheckCircle,
  Hash,
  MapPin,
  Phone,
  ShieldCheck,
  Search
} from 'lucide-react';

interface ClusterGraphViewProps {
  weights: ModelWeights;
}

export const ClusterGraphView: React.FC<ClusterGraphViewProps> = ({ weights }) => {
  const [records] = useState<BusinessRecord[]>(BENCHMARK_DATASET_RECORDS);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMultiOnly, setFilterMultiOnly] = useState(false);

  // 1. Run Blocking
  const blockingResult = useMemo(() => {
    return runMultiPassUnionBlocking(records);
  }, [records]);

  // 2. Evaluate all candidate pairs
  const evaluatedPairs = useMemo(() => {
    return blockingResult.candidatePairs.map(cp => ({
      record1: cp.record1,
      record2: cp.record2,
      result: evaluatePair(cp.record1, cp.record2, weights)
    }));
  }, [blockingResult, weights]);

  // 3. Cluster into canonical entities via Graph Connected Components
  const clusters: EntityCluster[] = useMemo(() => {
    return clusterRecords(records, evaluatedPairs);
  }, [records, evaluatedPairs]);

  // Filter clusters
  const filteredClusters = useMemo(() => {
    return clusters.filter(c => {
      if (filterMultiOnly && c.records.length <= 1) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesCanonical =
          c.canonicalRecord.name.toLowerCase().includes(q) ||
          c.canonicalRecord.address.toLowerCase().includes(q);
        const matchesMember = c.records.some(
          r => r.name.toLowerCase().includes(q) || r.address.toLowerCase().includes(q)
        );
        if (!matchesCanonical && !matchesMember) return false;
      }
      return true;
    });
  }, [clusters, filterMultiOnly, searchQuery]);

  const multiRecordClustersCount = clusters.filter(c => c.records.length > 1).length;
  const singletonsCount = clusters.filter(c => c.records.length === 1).length;

  const handleExportCanonicalJSON = () => {
    const payload = clusters.map(c => ({
      cluster_id: c.clusterId,
      canonical_golden_record: c.canonicalRecord,
      member_records_count: c.records.length,
      linked_source_ids: c.records.map(r => r.id),
      confidence: c.confidence
    }));
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `canonical_golden_entities_${Date.now()}.json`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Overview KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
          <span className="text-xs text-slate-400 block mb-1">Source Raw Records</span>
          <div className="text-2xl font-bold font-mono text-white">{records.length}</div>
          <span className="text-[11px] text-slate-500">Unclean input data</span>
        </div>

        <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
          <span className="text-xs text-slate-400 block mb-1">Deduplicated Entities</span>
          <div className="text-2xl font-bold font-mono text-emerald-400">{clusters.length}</div>
          <span className="text-[11px] text-slate-500">Canonical golden clusters</span>
        </div>

        <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
          <span className="text-xs text-slate-400 block mb-1">Merged Multi-Record Clusters</span>
          <div className="text-2xl font-bold font-mono text-indigo-400">{multiRecordClustersCount}</div>
          <span className="text-[11px] text-slate-500">N-way deduplicated groups</span>
        </div>

        <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
          <span className="text-xs text-slate-400 block mb-1">Distinct Singletons (No Match)</span>
          <div className="text-2xl font-bold font-mono text-slate-300">{singletonsCount}</div>
          <span className="text-[11px] text-slate-500">Zero forced false merges</span>
        </div>
      </div>

      {/* Control bar */}
      <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search golden records or members..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <label className="flex items-center space-x-2 text-xs text-slate-400 cursor-pointer whitespace-nowrap">
            <input
              type="checkbox"
              checked={filterMultiOnly}
              onChange={e => setFilterMultiOnly(e.target.checked)}
              className="accent-indigo-500 rounded"
            />
            <span>Merged only (&gt;1 record)</span>
          </label>
        </div>

        <button
          onClick={handleExportCanonicalJSON}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm transition-all whitespace-nowrap self-end sm:self-auto"
        >
          <Download className="w-4 h-4" />
          <span>Export Golden Entities (JSON)</span>
        </button>
      </div>

      {/* Clusters List */}
      <div className="space-y-4">
        {filteredClusters.length === 0 ? (
          <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 text-center text-slate-500 text-xs">
            No entity clusters match the search criteria.
          </div>
        ) : (
          filteredClusters.map(cluster => {
            const isMerged = cluster.records.length > 1;

            return (
              <div
                key={cluster.clusterId}
                className={`bg-slate-900 rounded-2xl border transition-all overflow-hidden ${
                  isMerged
                    ? 'border-indigo-500/40 shadow-md shadow-indigo-950/20'
                    : 'border-slate-800'
                }`}
              >
                {/* Cluster Header */}
                <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-3">
                    <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-md border border-indigo-500/20">
                      {cluster.clusterId}
                    </span>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                        isMerged
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {cluster.records.length} {cluster.records.length === 1 ? 'Record' : 'Records Merged'}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 text-xs text-slate-400">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Cluster Integrity: <strong className="text-slate-200">{(cluster.confidence * 100).toFixed(0)}%</strong></span>
                  </div>
                </div>

                <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Canonical Golden Record (5 cols) */}
                  <div className="lg:col-span-5 bg-gradient-to-br from-indigo-950/40 to-slate-950 p-4 rounded-xl border border-indigo-500/30">
                    <div className="flex items-center space-x-2 mb-3">
                      <Crown className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                        Synthesized Golden Record
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Canonical Name</span>
                        <div className="text-sm font-bold text-white mt-0.5">
                          {cluster.canonicalRecord.name}
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Master Address</span>
                        <div className="text-xs text-slate-300 mt-0.5 flex items-start space-x-1.5">
                          <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                          <span>{cluster.canonicalRecord.address}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                        <div>
                          <span className="text-[10px] text-slate-500 block">Postal Code</span>
                          <span className="font-mono text-slate-200 font-semibold">
                            {cluster.canonicalRecord.pincode || 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">Phone</span>
                          <span className="font-mono text-slate-200">
                            {cluster.canonicalRecord.phone || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Linked Source Records (7 cols) */}
                  <div className="lg:col-span-7 space-y-2.5">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                      Resolved Source Nodes ({cluster.records.length})
                    </span>

                    <div className="space-y-2">
                      {cluster.records.map((r, rIdx) => (
                        <div
                          key={r.id}
                          className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs flex items-center justify-between"
                        >
                          <div className="space-y-0.5 pr-2">
                            <div className="flex items-center space-x-2">
                              <span className="font-mono text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                                {r.id}
                              </span>
                              <span className="font-semibold text-slate-200">{r.name}</span>
                              {r.category && (
                                <span className="text-[10px] text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                                  {r.category}
                                </span>
                              )}
                            </div>
                            <div className="text-slate-400 text-[11px] truncate">{r.address}</div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="inline-flex items-center text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Linked
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
