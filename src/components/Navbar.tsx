import React from 'react';
import { Network, Split, Cpu, GitBranch, Terminal, ShieldCheck, Trophy } from 'lucide-react';

export type ActiveTab = 'amazon-challenge' | 'pair-tester' | 'blocking' | 'model-training' | 'clusters' | 'github-export';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  testedPairsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, testedPairsCount }) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('amazon-challenge')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-indigo-500 to-cyan-400 p-0.5 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
                <Trophy className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-white">Amazon ML 2026</span>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Macro F₀.₅
                </span>
              </div>
              <p className="text-xs text-slate-400">Business Entity Resolution Pipeline</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-950/60 p-1.5 rounded-xl border border-slate-800/80">
            <button
              onClick={() => setActiveTab('amazon-challenge')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'amazon-challenge'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'text-amber-400 hover:text-amber-300 hover:bg-slate-800/50'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Amazon ML Challenge</span>
            </button>

            <button
              onClick={() => setActiveTab('pair-tester')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'pair-tester'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Split className="w-3.5 h-3.5" />
              <span>Pair Inspector (17-Prop)</span>
            </button>

            <button
              onClick={() => setActiveTab('blocking')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'blocking'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span>Multi-Pass Union Blocking</span>
            </button>

            <button
              onClick={() => setActiveTab('model-training')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'model-training'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Model Training</span>
            </button>

            <button
              onClick={() => setActiveTab('clusters')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'clusters'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>Deduplication</span>
            </button>

            <button
              onClick={() => setActiveTab('github-export')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'github-export'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Submission &amp; GitHub</span>
            </button>
          </nav>

          {/* Quick Stats / Info */}
          <div className="flex items-center space-x-3">
            <div className="hidden lg:flex items-center space-x-2 text-xs text-slate-400 bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700/50">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Amazon ML Metric: <strong className="text-amber-400">Macro F₀.₅</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Tab Bar */}
      <div className="md:hidden flex overflow-x-auto px-4 py-2 bg-slate-950 border-t border-slate-800 space-x-2 text-xs">
        <button
          onClick={() => setActiveTab('amazon-challenge')}
          className={`px-3 py-1.5 rounded-md whitespace-nowrap font-bold ${activeTab === 'amazon-challenge' ? 'bg-amber-500 text-slate-950' : 'text-amber-400'}`}
        >
          Amazon ML 2026
        </button>
        <button
          onClick={() => setActiveTab('pair-tester')}
          className={`px-3 py-1.5 rounded-md whitespace-nowrap ${activeTab === 'pair-tester' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
        >
          Pair Inspector
        </button>
        <button
          onClick={() => setActiveTab('blocking')}
          className={`px-3 py-1.5 rounded-md whitespace-nowrap ${activeTab === 'blocking' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
        >
          Union Blocking
        </button>
        <button
          onClick={() => setActiveTab('model-training')}
          className={`px-3 py-1.5 rounded-md whitespace-nowrap ${activeTab === 'model-training' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
        >
          Model Training
        </button>
        <button
          onClick={() => setActiveTab('clusters')}
          className={`px-3 py-1.5 rounded-md whitespace-nowrap ${activeTab === 'clusters' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
        >
          Deduplication
        </button>
        <button
          onClick={() => setActiveTab('github-export')}
          className={`px-3 py-1.5 rounded-md whitespace-nowrap ${activeTab === 'github-export' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
        >
          Submission
        </button>
      </div>
    </header>
  );
};
