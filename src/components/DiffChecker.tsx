import { useState, useMemo, useCallback } from 'react';
import { FileUploader } from './FileUploader';
import { KeySelector } from './KeySelector';
import { DiffSummary } from './DiffSummary';
import { DiffTable } from './DiffTable';
import { DownloadButtons } from './DownloadButtons';
import { findCommonKeys } from '../utils/keyExtractor';
import { compareJsonLists } from '../utils/diffEngine';
import { DiffResult } from '../types/diff';

interface DiffCheckerProps {
  onBack: () => void;
}

type AppState = 'upload' | 'compare' | 'results';

export function DiffChecker({ onBack }: DiffCheckerProps) {
  const [state, setState] = useState<AppState>('upload');
  const [sourceData, setSourceData] = useState<Record<string, unknown>[] | null>(null);
  const [targetData, setTargetData] = useState<Record<string, unknown>[] | null>(null);
  const [sourceFilename, setSourceFilename] = useState<string>('');
  const [targetFilename, setTargetFilename] = useState<string>('');
  const [selectedKey, setSelectedKey] = useState<string>('');
  const [diffResult, setDiffResult] = useState<DiffResult | null>(null);
  const [isComparing, setIsComparing] = useState(false);

  const availableKeys = useMemo(() => {
    if (!sourceData || !targetData) return [];
    return findCommonKeys(sourceData, targetData);
  }, [sourceData, targetData]);

  const handleSourceLoaded = useCallback((data: Record<string, unknown>[], filename: string) => {
    setSourceData(data);
    setSourceFilename(filename);
    setSelectedKey('');
    setDiffResult(null);
    setState('upload');
  }, []);

  const handleTargetLoaded = useCallback((data: Record<string, unknown>[], filename: string) => {
    setTargetData(data);
    setTargetFilename(filename);
    setSelectedKey('');
    setDiffResult(null);
    setState('upload');
  }, []);

  const canCompare = sourceData && targetData && selectedKey;

  const handleCompare = useCallback(() => {
    if (!sourceData || !targetData || !selectedKey) return;

    setIsComparing(true);
    setState('compare');

    setTimeout(() => {
      const result = compareJsonLists(sourceData, targetData, selectedKey);
      setDiffResult(result);
      setIsComparing(false);
      setState('results');
    }, 100);
  }, [sourceData, targetData, selectedKey]);

  const handleReset = useCallback(() => {
    setSourceData(null);
    setTargetData(null);
    setSourceFilename('');
    setTargetFilename('');
    setSelectedKey('');
    setDiffResult(null);
    setState('upload');
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={onBack}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="Back to Home"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Intelligent Diff Checker</h1>
                  <p className="text-sm text-gray-500">Compare JSON arrays by key</p>
                </div>
              </div>
            </div>
            {state === 'results' && (
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Start Over
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Upload Section */}
        {(state === 'upload' || !diffResult) && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Upload JSON Files</h2>

            <div className="grid md:grid-cols-2 gap-8 mb-6">
              <FileUploader
                label="Source JSON (before)"
                onFileLoaded={handleSourceLoaded}
                filename={sourceFilename}
              />
              <FileUploader
                label="Target JSON (after)"
                onFileLoaded={handleTargetLoaded}
                filename={targetFilename}
              />
            </div>

            {sourceData && targetData && (
              <div className="border-t border-gray-200 pt-6">
                <div className="flex flex-col sm:flex-row gap-4 items-end">
                  <div className="flex-1 w-full">
                    <KeySelector
                      keys={availableKeys}
                      selectedKey={selectedKey}
                      onKeyChange={setSelectedKey}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleCompare}
                    disabled={!canCompare}
                    className={`w-full sm:w-auto px-8 py-3 rounded-lg font-semibold text-white transition-all ${
                      canCompare
                        ? 'bg-blue-600 hover:bg-blue-700 shadow-lg'
                        : 'bg-gray-300 cursor-not-allowed'
                    }`}
                  >
                    Compare
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Loading State */}
        {isComparing && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent mx-auto"></div>
            <p className="mt-4 text-gray-600">Comparing JSON files...</p>
          </div>
        )}

        {/* Results Section */}
        {state === 'results' && diffResult && !isComparing && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Comparison Results</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Matched by: <code className="bg-gray-100 px-2 py-0.5 rounded text-gray-700">{diffResult.matchKey}</code>
                  </p>
                </div>
                <DownloadButtons result={diffResult} />
              </div>
              <DiffSummary summary={diffResult.summary} />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Detailed Changes</h2>
              <DiffTable result={diffResult} />
            </div>
          </div>
        )}

        {/* Empty State */}
        {!sourceData && !targetData && (
          <div className="text-center py-16">
            <svg className="mx-auto h-16 w-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-700">No files uploaded</h3>
            <p className="mt-2 text-gray-500">Upload or paste two JSON arrays to compare them</p>
          </div>
        )}
      </main>
    </div>
  );
}
