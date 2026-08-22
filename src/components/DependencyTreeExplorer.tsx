import { useRef, useState, useMemo, useCallback } from 'react';
import { parseDependencyTree, getPathToNode } from '../utils/dependencyParser';
import { DependencyNode } from '../types/dependencyTree';

interface DependencyTreeExplorerProps {
  readonly onBack: () => void;
}

interface LevelStyle {
  readonly label: string;
  readonly dot: string;
  readonly gradient: string;
  readonly text: string;
  readonly border: string;
  readonly bg: string;
  readonly ring: string;
  readonly line: string;
  readonly glow: string;
}

// Cycles every 8 levels so deeply nested trees still get a distinct color per depth
const LEVEL_STYLES: readonly LevelStyle[] = [
  { label: 'Root', dot: 'bg-slate-500', gradient: 'from-slate-500 to-slate-600', text: 'text-slate-700 dark:text-slate-300', border: 'border-slate-400/70 dark:border-slate-500/70', bg: 'bg-slate-50 dark:bg-slate-800/50', ring: 'ring-slate-400/50 dark:ring-slate-500/50', line: 'border-slate-300 dark:border-slate-700', glow: 'shadow-slate-400/30' },
  { label: 'Level 1', dot: 'bg-indigo-500', gradient: 'from-indigo-500 to-violet-500', text: 'text-indigo-700 dark:text-indigo-300', border: 'border-indigo-400/70 dark:border-indigo-500/70', bg: 'bg-indigo-50 dark:bg-indigo-500/10', ring: 'ring-indigo-400/50 dark:ring-indigo-500/50', line: 'border-indigo-300 dark:border-indigo-800', glow: 'shadow-indigo-400/30' },
  { label: 'Level 2', dot: 'bg-sky-500', gradient: 'from-sky-500 to-cyan-500', text: 'text-sky-700 dark:text-sky-300', border: 'border-sky-400/70 dark:border-sky-500/70', bg: 'bg-sky-50 dark:bg-sky-500/10', ring: 'ring-sky-400/50 dark:ring-sky-500/50', line: 'border-sky-300 dark:border-sky-800', glow: 'shadow-sky-400/30' },
  { label: 'Level 3', dot: 'bg-emerald-500', gradient: 'from-emerald-500 to-teal-500', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-400/70 dark:border-emerald-500/70', bg: 'bg-emerald-50 dark:bg-emerald-500/10', ring: 'ring-emerald-400/50 dark:ring-emerald-500/50', line: 'border-emerald-300 dark:border-emerald-800', glow: 'shadow-emerald-400/30' },
  { label: 'Level 4', dot: 'bg-amber-500', gradient: 'from-amber-500 to-orange-500', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-400/70 dark:border-amber-500/70', bg: 'bg-amber-50 dark:bg-amber-500/10', ring: 'ring-amber-400/50 dark:ring-amber-500/50', line: 'border-amber-300 dark:border-amber-800', glow: 'shadow-amber-400/30' },
  { label: 'Level 5', dot: 'bg-rose-500', gradient: 'from-rose-500 to-pink-500', text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-400/70 dark:border-rose-500/70', bg: 'bg-rose-50 dark:bg-rose-500/10', ring: 'ring-rose-400/50 dark:ring-rose-500/50', line: 'border-rose-300 dark:border-rose-800', glow: 'shadow-rose-400/30' },
  { label: 'Level 6', dot: 'bg-purple-500', gradient: 'from-purple-500 to-fuchsia-500', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-400/70 dark:border-purple-500/70', bg: 'bg-purple-50 dark:bg-purple-500/10', ring: 'ring-purple-400/50 dark:ring-purple-500/50', line: 'border-purple-300 dark:border-purple-800', glow: 'shadow-purple-400/30' },
  { label: 'Level 7', dot: 'bg-teal-500', gradient: 'from-teal-500 to-cyan-500', text: 'text-teal-700 dark:text-teal-300', border: 'border-teal-400/70 dark:border-teal-500/70', bg: 'bg-teal-50 dark:bg-teal-500/10', ring: 'ring-teal-400/50 dark:ring-teal-500/50', line: 'border-teal-300 dark:border-teal-800', glow: 'shadow-teal-400/30' },
];

function getLevelStyle(depth: number): LevelStyle {
  return LEVEL_STYLES[depth % LEVEL_STYLES.length];
}

function getMaxDepth(node: DependencyNode): number {
  let max = node.depth;
  for (const child of node.children) {
    max = Math.max(max, getMaxDepth(child));
  }
  return max;
}

interface SearchResult {
  readonly matches: Set<string>;
  readonly ancestorsToExpand: Set<string>;
}

function findMatches(root: DependencyNode, query: string, nodeKeyFn: (node: DependencyNode) => string): SearchResult {
  const matches = new Set<string>();
  const ancestorsToExpand = new Set<string>();
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return { matches, ancestorsToExpand };
  }

  const visit = (node: DependencyNode, ancestors: readonly string[]) => {
    const key = nodeKeyFn(node);
    if (node.name.toLowerCase().includes(normalizedQuery)) {
      matches.add(key);
      ancestors.forEach((ancestorKey) => ancestorsToExpand.add(ancestorKey));
    }
    const nextAncestors = [...ancestors, key];
    node.children.forEach((child) => visit(child, nextAncestors));
  };

  visit(root, []);
  return { matches, ancestorsToExpand };
}

export function DependencyTreeExplorer({ onBack }: DependencyTreeExplorerProps) {
  const [input, setInput] = useState('');
  const [fileName, setFileName] = useState('');
  const [submittedText, setSubmittedText] = useState('');
  const [error, setError] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedNode, setSelectedNode] = useState<DependencyNode | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMatches, setSearchMatches] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parsedTree = useMemo(() => {
    if (!submittedText.trim()) return null;
    try {
      setError('');
      return parseDependencyTree(submittedText);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to parse dependency tree');
      return null;
    }
  }, [submittedText]);

  const nodeKey = useCallback((node: DependencyNode): string => {
    return `${node.name}@${node.version}`;
  }, []);

  const toggleNode = useCallback((node: DependencyNode) => {
    setExpandedNodes((prev) => {
      const key = nodeKey(node);
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, [nodeKey]);

  const handleNodeClick = useCallback((node: DependencyNode) => {
    setSelectedNode(node);
  }, []);

  const pathToSelected = useMemo(() => {
    if (!parsedTree || !selectedNode) return [];
    const path = getPathToNode(parsedTree.root, selectedNode);
    return path || [];
  }, [parsedTree, selectedNode]);

  const legendLevels = useMemo(() => {
    if (!parsedTree) return [];
    const maxDepth = Math.min(getMaxDepth(parsedTree.root), LEVEL_STYLES.length - 1);
    return Array.from({ length: maxDepth + 1 }, (_, depth) => getLevelStyle(depth));
  }, [parsedTree]);

  const handleExpandAll = useCallback(() => {
    if (!parsedTree) return;
    const allKeys = new Set<string>();
    const visit = (node: DependencyNode) => {
      allKeys.add(nodeKey(node));
      node.children.forEach(visit);
    };
    visit(parsedTree.root);
    setExpandedNodes(allKeys);
  }, [parsedTree, nodeKey]);

  const handleCollapseAll = useCallback(() => {
    setExpandedNodes(new Set());
  }, []);

  const handleFileSelected = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    file.text().then((text) => setInput(text));
    e.target.value = '';
  }, []);

  const handleGenerate = useCallback(() => {
    setSubmittedText(input);
    setSelectedNode(null);
    setExpandedNodes(new Set());
    setSearchQuery('');
    setSearchMatches(new Set());
  }, [input]);

  const handleClearInput = useCallback(() => {
    setInput('');
    setFileName('');
    setSubmittedText('');
    setError('');
    setSelectedNode(null);
    setExpandedNodes(new Set());
    setSearchQuery('');
    setSearchMatches(new Set());
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleSearch = useCallback(() => {
    if (!parsedTree || !searchQuery.trim()) {
      setSearchMatches(new Set());
      return;
    }
    const { matches, ancestorsToExpand } = findMatches(parsedTree.root, searchQuery, nodeKey);
    setSearchMatches(matches);
    setExpandedNodes((prev) => new Set([...prev, ...ancestorsToExpand]));
  }, [parsedTree, searchQuery, nodeKey]);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchMatches(new Set());
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/70 dark:bg-slate-900/60 border-b border-slate-200/70 dark:border-slate-800/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Dependency Tree Explorer</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">Visualize nested dependencies as a colored, explorable map</p>
              </div>
            </div>
            <button
              onClick={onBack}
              type="button"
              className="group inline-flex items-center gap-2 pl-3 pr-4 py-2.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md transition-all duration-200 font-medium text-sm"
            >
              <svg className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Section */}
          <div className="lg:col-span-1">
            <div className="rounded-3xl bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl shadow-xl shadow-slate-200/50 dark:shadow-black/20 ring-1 ring-slate-900/5 dark:ring-white/10 p-6">
              <div className="mb-4">
                <label htmlFor="dependency-tree-input" className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white mb-2">
                  <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 4H6a2 2 0 00-2 2v2m0 8v2a2 2 0 002 2h2m8-16h2a2 2 0 012 2v2m0 8v2a2 2 0 01-2 2h-2M9 9h6m-6 3h6m-6 3h6" />
                  </svg>
                  Dependency Tree
                </label>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.log,text/plain"
                  onChange={handleFileSelected}
                  className="hidden"
                  id="dependency-tree-file"
                />
                <label
                  htmlFor="dependency-tree-file"
                  className="flex items-center justify-center gap-2 w-full mb-3 px-4 py-3 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 text-sm text-slate-500 dark:text-slate-400 hover:border-indigo-400 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M12 12v9m0-9l-3 3m3-3l3 3" />
                  </svg>
                  {fileName || 'Add a dependency tree file (.txt/.log)'}
                </label>

                <textarea
                  id="dependency-tree-input"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={'...or paste it here\n\nMaven example:\n[INFO] com.example:my-app:jar:1.0.0\n[INFO] +- com.example:dep1:jar:2.0.0:compile\n[INFO] |  \\- org.example:subdep:jar:1.5.0\n[INFO] \\- com.example:dep2:jar:3.0.0:compile'}
                  className="w-full h-40 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60 text-slate-900 dark:text-white font-mono text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:border-indigo-400 dark:focus:border-indigo-500 transition-shadow resize-none"
                />
              </div>

              {error && (
                <div className="mb-4 p-4 rounded-2xl bg-red-50/80 dark:bg-red-500/10 ring-1 ring-red-200 dark:ring-red-500/30">
                  <div className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p className="text-sm text-red-700 dark:text-red-400 font-medium">{error}</p>
                  </div>
                  <details className="text-xs text-red-600 dark:text-red-300 mt-2 ml-6">
                    <summary className="cursor-pointer hover:underline">Try these formats</summary>
                    <pre className="mt-2 bg-red-100/70 dark:bg-red-500/10 p-3 rounded-xl text-xs overflow-auto">
{String.raw`Maven (mvn dependency:tree):
[INFO] com.example:my-app:jar:1.0.0
[INFO] +- com.example:dep1:jar:2.0.0:compile
[INFO] |  \- org.example:subdep:jar:1.5.0:compile
[INFO] \- com.example:dep2:jar:3.0.0:compile

npm/yarn:
package@1.0.0
├── dependency@2.0.0
│   └── subdep@1.0.0
└── another@3.0.0

Gradle:
group:artifact:version
├── group:dependency:2.0.0
└── group:another:3.0.0`}
                    </pre>
                  </details>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={handleGenerate}
                  type="button"
                  disabled={!input.trim()}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-gradient-to-br from-indigo-500 to-violet-600 text-white rounded-xl hover:shadow-lg hover:shadow-indigo-500/30 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none transition-all duration-200 font-medium text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Generate Map
                </button>
                <button
                  onClick={handleClearInput}
                  type="button"
                  className="px-3 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-medium text-sm"
                >
                  Clear
                </button>
              </div>

              {parsedTree && (
                <div className="mt-6 pt-6 border-t border-slate-200/70 dark:border-slate-800/70">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-500/10 dark:to-transparent ring-1 ring-indigo-100 dark:ring-indigo-500/20 p-4">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center mb-2 shadow-md shadow-indigo-500/30">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                        </svg>
                      </div>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">{parsedTree.totalDependencies}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Total Dependencies</p>
                    </div>
                    <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-500/10 dark:to-transparent ring-1 ring-emerald-100 dark:ring-emerald-500/20 p-4">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mb-2 shadow-md shadow-emerald-500/30">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">{parsedTree.uniqueDependencies.size}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Unique Packages</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tree Explorer Section */}
          <div className="lg:col-span-2">
            {parsedTree ? (
              <>
                {/* Search */}
                <div className="mb-4 flex items-center gap-2">
                  <div className="relative flex-1">
                    <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
                    </svg>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSearch();
                      }}
                      placeholder="Search dependencies by name..."
                      className="w-full pl-10 pr-9 py-2.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 text-slate-900 dark:text-white text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:border-indigo-400 dark:focus:border-indigo-500 transition-shadow"
                    />
                    {searchQuery && (
                      <button
                        onClick={handleClearSearch}
                        type="button"
                        aria-label="Clear search"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                  <button
                    onClick={handleSearch}
                    type="button"
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-br from-indigo-500 to-violet-600 text-white rounded-full hover:shadow-lg hover:shadow-indigo-500/30 transition-all duration-200 font-medium text-sm flex-shrink-0"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
                    </svg>
                    Search
                  </button>
                </div>

                {searchQuery && (
                  <p className="mb-4 -mt-2 text-xs text-slate-500 dark:text-slate-400">
                    {(() => {
                      if (searchMatches.size === 0) return 'No matching dependencies found';
                      const label = searchMatches.size > 1 ? 'matches' : 'match';
                      return `${searchMatches.size} ${label} found and expanded below`;
                    })()}
                  </p>
                )}

                {/* Controls */}
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleExpandAll}
                    type="button"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-br from-indigo-500 to-violet-600 text-white rounded-full hover:shadow-lg hover:shadow-indigo-500/30 transition-all duration-200 font-medium text-sm"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                    </svg>
                    Expand All
                  </button>
                  <button
                    onClick={handleCollapseAll}
                    type="button"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/80 dark:bg-slate-800/80 ring-1 ring-slate-200 dark:ring-slate-700 text-slate-700 dark:text-slate-300 rounded-full hover:bg-white dark:hover:bg-slate-800 hover:shadow-md transition-all duration-200 font-medium text-sm"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                    Collapse All
                  </button>

                  {/* Level color legend */}
                  <div className="flex flex-wrap items-center gap-1.5 ml-auto">
                    {legendLevels.map((style) => (
                      <span
                        key={style.label}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text} ring-1 ring-inset ${style.border}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full bg-gradient-to-br ${style.gradient}`} />
                        {style.label}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Tree View */}
                <div className="rounded-3xl bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl shadow-xl shadow-slate-200/50 dark:shadow-black/20 ring-1 ring-slate-900/5 dark:ring-white/10 p-5 mb-6 overflow-x-auto">
                  <div className="text-sm space-y-1 min-w-max">
                    <TreeNodeComponent
                      node={parsedTree.root}
                      expandedNodes={expandedNodes}
                      selectedNode={selectedNode}
                      nodeKey={nodeKey}
                      onToggle={toggleNode}
                      onSelect={handleNodeClick}
                      searchMatches={searchMatches}
                    />
                  </div>
                </div>

                {/* Selected Node Details */}
                {selectedNode && (
                  <div className="rounded-3xl bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl shadow-xl shadow-slate-200/50 dark:shadow-black/20 ring-1 ring-slate-900/5 dark:ring-white/10 p-6">
                    <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-white mb-4">
                      <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                      Dependency Path
                    </h3>
                    <div className="flex flex-wrap items-center gap-2">
                      {pathToSelected.map((dep, idx) => {
                        const style = getLevelStyle(idx);
                        return (
                          <div key={dep} className="flex items-center gap-2">
                            {idx > 0 && (
                              <svg className="w-4 h-4 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            )}
                            <div className={`flex items-center gap-1.5 pl-1.5 pr-3 py-1.5 rounded-full ${style.bg} ring-1 ring-inset ${style.border}`}>
                              <span className={`w-4 h-4 rounded-full bg-gradient-to-br ${style.gradient} flex-shrink-0`} />
                              <span className={`font-mono text-xs font-medium ${style.text}`}>{dep}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                      Shows the complete path from root to this dependency
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-3xl bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl shadow-xl shadow-slate-200/50 dark:shadow-black/20 ring-1 ring-slate-900/5 dark:ring-white/10 p-12 text-center">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-500/10 dark:to-violet-500/10 flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-indigo-400 dark:text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
                  </svg>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-base font-medium">Add a file or paste your dependency tree, then click Generate Map</p>
                <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Supports Maven, npm/yarn, and Gradle formats</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

interface TreeNodeComponentProps {
  readonly node: DependencyNode;
  readonly expandedNodes: Set<string>;
  readonly selectedNode: DependencyNode | null;
  readonly nodeKey: (node: DependencyNode) => string;
  readonly onToggle: (node: DependencyNode) => void;
  readonly onSelect: (node: DependencyNode) => void;
  readonly searchMatches: Set<string>;
}

function TreeNodeComponent({
  node,
  expandedNodes,
  selectedNode,
  nodeKey,
  onToggle,
  onSelect,
  searchMatches,
}: TreeNodeComponentProps) {
  const hasChildren = node.children.length > 0;
  const isExpanded = expandedNodes.has(nodeKey(node));
  const isSelected = selectedNode === node;
  const isMatch = searchMatches.has(nodeKey(node));
  const style = getLevelStyle(node.depth);

  let rowStateClass = 'hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:shadow-sm';
  if (isSelected) {
    rowStateClass = `${style.bg} ring-2 ${style.ring} shadow-md ${style.glow}`;
  } else if (isMatch) {
    rowStateClass = 'bg-amber-50 dark:bg-amber-500/10 ring-2 ring-amber-400 dark:ring-amber-500 shadow-md shadow-amber-400/30';
  }

  return (
    <div className="relative">
      <div
        role="treeitem"
        aria-selected={isSelected}
        aria-expanded={hasChildren ? isExpanded : undefined}
        tabIndex={0}
        className={`group flex items-center gap-2 py-2 pl-2 pr-3 rounded-xl cursor-pointer transition-all duration-150 border-l-4 ${style.border} ${rowStateClass}`}
        onClick={() => {
          onSelect(node);
          if (hasChildren) {
            onToggle(node);
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect(node);
            if (hasChildren) {
              onToggle(node);
            }
          }
        }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggle(node);
            }}
            className="p-1 hover:bg-slate-200/70 dark:hover:bg-slate-700 rounded-lg transition-colors flex-shrink-0"
          >
            <svg
              className={`w-4 h-4 ${style.text} transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ) : (
          <div className="w-6 flex-shrink-0 flex items-center justify-center">
            <span className={`w-1.5 h-1.5 rounded-full bg-gradient-to-br ${style.gradient}`} />
          </div>
        )}

        <span className={`flex-shrink-0 w-5 h-5 rounded-full bg-gradient-to-br ${style.gradient} text-white text-[10px] font-bold flex items-center justify-center shadow-sm`}>
          {node.depth}
        </span>

        <div className="flex-1 min-w-0 flex items-center gap-2">
          <span className={`font-semibold truncate text-sm ${style.text}`}>{node.name}</span>
          {node.version !== 'unknown' && (
            <span className={`flex-shrink-0 px-1.5 py-0.5 rounded-md text-[10px] font-mono ${style.bg} ${style.text} ring-1 ring-inset ${style.border}`}>
              {node.version}
            </span>
          )}
          {hasChildren && (
            <span className="flex-shrink-0 text-[10px] text-slate-400 dark:text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
              {node.children.length} dep{node.children.length > 1 ? 's' : ''}
            </span>
          )}
          {isMatch && (
            <span className="flex-shrink-0 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-amber-400 text-white">
              match
            </span>
          )}
        </div>
      </div>

      {isExpanded && hasChildren && (
        <div className={`ml-5 pl-4 mt-1 space-y-1 border-l-2 border-dashed ${style.line}`}>
          {node.children.map((child, idx) => (
            <TreeNodeComponent
              key={`${child.name}-${child.version}-${idx}`}
              node={child}
              expandedNodes={expandedNodes}
              selectedNode={selectedNode}
              nodeKey={nodeKey}
              onToggle={onToggle}
              onSelect={onSelect}
              searchMatches={searchMatches}
            />
          ))}
        </div>
      )}
    </div>
  );
}

