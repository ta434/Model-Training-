import React, { useState } from 'react';
import {
  PYTHON_PIPELINE_CODE,
  PYTHON_TRAIN_CODE,
  PYTHON_REQUIREMENTS,
  GITHUB_README
} from '../data/pythonExportCode';
import {
  Terminal,
  Copy,
  Check,
  Download,
  Github,
  FileCode,
  ShieldCheck,
  CheckCircle2,
  FolderGit2,
  Cpu
} from 'lucide-react';

export const GitHubExportView: React.FC = () => {
  const [activeFile, setActiveFile] = useState<'train_model.py' | 'pipeline.py' | 'model_weights.json' | 'requirements.txt' | 'README.md' | 'git_commands'>('train_model.py');
  const [copied, setCopied] = useState(false);

  const modelWeightsJson = JSON.stringify(
    {
      "model_type": "WeightedCompositeScoringHead",
      "version": "2.4.0",
      "architecture": "17-Property Feature Vector + Hard Spatial Guards",
      "weights": {
        "w1_name": 0.52,
        "w2_address_containment": 0.33,
        "w3_rare_tokens": 0.15
      },
      "penalties": {
        "postal_code_conflict": -0.35,
        "numeric_plot_conflict": -0.25,
        "city_locality_conflict": -0.30,
        "name_veto_threshold": 0.40
      },
      "decision_thresholds": {
        "match": 0.82,
        "possible_match": 0.60
      }
    },
    null,
    2
  );

  const getActiveContent = () => {
    switch (activeFile) {
      case 'train_model.py':
        return PYTHON_TRAIN_CODE;
      case 'pipeline.py':
        return PYTHON_PIPELINE_CODE;
      case 'model_weights.json':
        return modelWeightsJson;
      case 'requirements.txt':
        return PYTHON_REQUIREMENTS;
      case 'README.md':
        return GITHUB_README;
      case 'git_commands':
        return `# 1. Initialize local Git repository
git init

# 2. Add all pipeline & training files
git add entity_resolution_pipeline.py train_model.py model_weights.json requirements.txt README.md

# 3. Create initial commit
git commit -m "feat(dedup): production-grade offline entity resolution & model training pipeline"

# 4. Link to your GitHub repository
# Replace <YOUR_GITHUB_USERNAME> and <REPO_NAME>
git branch -M main
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/<REPO_NAME>.git

# 5. Push to GitHub
git push -u origin main`;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getActiveContent());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // State for interactive GitHub Push
  const [gitToken, setGitToken] = useState('');
  const [targetRepoUrl, setTargetRepoUrl] = useState('https://github.com/ta434/Amazon-ml-challenge-2-');
  const [isPushing, setIsPushing] = useState(false);
  const [pushStatus, setPushStatus] = useState<{ success: boolean; message: string; output?: string } | null>(null);

  const handleExecutePush = async () => {
    if (!gitToken.trim()) {
      setPushStatus({
        success: false,
        message: 'Please provide a GitHub Personal Access Token with "repo" write scope to authorize the push.'
      });
      return;
    }

    setIsPushing(true);
    setPushStatus(null);

    try {
      const response = await fetch('/api/github-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: gitToken.trim(),
          repoUrl: targetRepoUrl.trim()
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setPushStatus({
          success: true,
          message: data.message,
          output: data.output
        });
      } else {
        setPushStatus({
          success: false,
          message: data.error || 'Push failed. Please verify your token has "repo" write access.',
          output: data.stderr || data.output
        });
      }
    } catch (err: any) {
      setPushStatus({
        success: false,
        message: `Network or server error: ${err.message}`
      });
    } finally {
      setIsPushing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* GitHub & Python Export Header */}
      <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-white">
              <Github className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <span>Production Python Pipeline &amp; GitHub Push Ready</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Self-Contained
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Target Repo: <strong className="text-indigo-400 font-mono">https://github.com/ta434/Amazon-ml-challenge-2-</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 flex-wrap gap-y-2">
            <a
              href="/repo_bundle.tar.gz"
              download="repo_bundle.tar.gz"
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all shadow-sm"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Full Archive (.tar.gz)</span>
            </a>
            <button
              onClick={() => handleDownload('train_model.py', PYTHON_TRAIN_CODE)}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 transition-all shadow-md shadow-purple-600/20"
            >
              <Download className="w-3.5 h-3.5" />
              <span>train_model.py</span>
            </button>
            <button
              onClick={() => handleDownload('entity_resolution_pipeline.py', PYTHON_PIPELINE_CODE)}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-md shadow-indigo-600/20"
            >
              <Download className="w-3.5 h-3.5" />
              <span>pipeline.py</span>
            </button>
          </div>
        </div>

        {/* Direct GitHub Push Console Card */}
        <div className="mt-5 p-4 rounded-xl bg-slate-950/80 border border-indigo-500/30">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <FolderGit2 className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Direct 1-Click Push to GitHub Repository
              </span>
            </div>
            <a
              href="https://github.com/settings/tokens/new?scopes=repo&description=Amazon-ML-Challenge-Push"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-indigo-400 hover:text-indigo-300 underline"
            >
              Generate GitHub Token (1 min) →
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-5">
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Target Repository URL</label>
              <input
                type="text"
                value={targetRepoUrl}
                onChange={e => setTargetRepoUrl(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="md:col-span-4">
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                GitHub Personal Access Token (PAT)
              </label>
              <input
                type="password"
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                value={gitToken}
                onChange={e => setGitToken(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="md:col-span-3 flex items-end">
              <button
                onClick={handleExecutePush}
                disabled={isPushing}
                className={`w-full py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 shadow-md ${
                  isPushing
                    ? 'bg-indigo-800 text-indigo-300 cursor-not-allowed opacity-70'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
                }`}
              >
                <Github className="w-3.5 h-3.5" />
                <span>{isPushing ? 'Pushing to GitHub...' : 'Push Code Now'}</span>
              </button>
            </div>
          </div>

          {pushStatus && (
            <div
              className={`mt-3 p-3 rounded-lg text-xs border ${
                pushStatus.success
                  ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
              }`}
            >
              <div className="flex items-center space-x-2 font-semibold">
                {pushStatus.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <ShieldCheck className="w-4 h-4 text-rose-400" />
                )}
                <span>{pushStatus.message}</span>
              </div>
              {pushStatus.output && (
                <pre className="mt-2 p-2 bg-slate-950 rounded text-[11px] font-mono text-slate-300 overflow-x-auto">
                  {pushStatus.output}
                </pre>
              )}
            </div>
          )}
        </div>

        {/* Feature badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 text-xs">
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center space-x-2 text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>100% Offline (No Google Maps API needed)</span>
          </div>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center space-x-2 text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>Supervised Training &amp; Gradient Descent Loop</span>
          </div>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center space-x-2 text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
            <span>Exact 17-Property Feature Vector</span>
          </div>
        </div>
      </div>

      {/* Code Viewer and File Tabs */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
        {/* File tabs & copy button */}
        <div className="bg-slate-950 p-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-1 flex-wrap gap-y-1">
            <button
              onClick={() => setActiveFile('train_model.py')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                activeFile === 'train_model.py'
                  ? 'bg-purple-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Cpu className="w-3.5 h-3.5 text-purple-300" />
              <span>train_model.py</span>
            </button>

            <button
              onClick={() => setActiveFile('pipeline.py')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                activeFile === 'pipeline.py'
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <FileCode className="w-3.5 h-3.5 text-indigo-300" />
              <span>entity_resolution_pipeline.py</span>
            </button>

            <button
              onClick={() => setActiveFile('model_weights.json')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                activeFile === 'model_weights.json'
                  ? 'bg-emerald-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Terminal className="w-3.5 h-3.5 text-emerald-300" />
              <span>model_weights.json</span>
            </button>

            <button
              onClick={() => setActiveFile('git_commands')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                activeFile === 'git_commands'
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <FolderGit2 className="w-3.5 h-3.5" />
              <span>Git Setup Commands</span>
            </button>

            <button
              onClick={() => setActiveFile('requirements.txt')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                activeFile === 'requirements.txt'
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>requirements.txt</span>
            </button>

            <button
              onClick={() => setActiveFile('README.md')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                activeFile === 'README.md'
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>README.md</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="flex items-center space-x-1.5 text-xs text-indigo-400 hover:text-indigo-300 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg font-medium transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Code'}</span>
            </button>
          </div>
        </div>

        {/* Code Content Box */}
        <pre className="p-5 text-xs font-mono text-slate-200 bg-slate-950 overflow-x-auto max-h-[550px] leading-relaxed selection:bg-indigo-500 selection:text-white">
          {getActiveContent()}
        </pre>
      </div>
    </div>
  );
};
