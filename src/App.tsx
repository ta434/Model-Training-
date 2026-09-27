import React, { useState } from 'react';
import { Navbar, ActiveTab } from './components/Navbar';
import { AmazonChallengeStudio } from './components/AmazonChallengeStudio';
import { PairTester } from './components/PairTester';
import { BatchBlockingView } from './components/BatchBlockingView';
import { ModelTrainer } from './components/ModelTrainer';
import { ClusterGraphView } from './components/ClusterGraphView';
import { GitHubExportView } from './components/GitHubExportView';
import { DEFAULT_MODEL_WEIGHTS } from './core/model';
import { ModelWeights } from './types/entityResolution';
import { ShieldCheck } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('amazon-challenge');
  const [weights, setWeights] = useState<ModelWeights>({ ...DEFAULT_MODEL_WEIGHTS });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        testedPairsCount={12}
      />

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'amazon-challenge' && (
          <AmazonChallengeStudio weights={weights} />
        )}

        {activeTab === 'pair-tester' && (
          <PairTester weights={weights} />
        )}

        {activeTab === 'blocking' && (
          <BatchBlockingView
            weights={weights}
            onInspectPair={(r1, r2) => {
              setActiveTab('pair-tester');
            }}
          />
        )}

        {activeTab === 'model-training' && (
          <ModelTrainer
            weights={weights}
            setWeights={setWeights}
          />
        )}

        {activeTab === 'clusters' && (
          <ClusterGraphView weights={weights} />
        )}

        {activeTab === 'github-export' && (
          <GitHubExportView />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-900/60 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-400">
              Offline-First Record Linkage &amp; Deduplication Engine • Zero External Geocoding
            </span>
          </div>

          <div className="flex items-center space-x-4 text-slate-400">
            <span>Name Priority w₁: {weights.w1_name}</span>
            <span>•</span>
            <span>Address w₂: {weights.w2_address_containment}</span>
            <span>•</span>
            <span>Hard Penalties: Active</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
