import { useMemo, useState } from 'react';

interface JsonFormatterProps {
  onBack: () => void;
}

function toPathTokens(path: string): string[] {
  const normalized = path.replace(/\[(\d+)\]/g, '.$1');
  return normalized
    .split('.')
    .map((part) => part.trim())
    .filter(Boolean);
}

function resolvePathValue(source: unknown, path: string): unknown {
  const tokens = toPathTokens(path);
  let current: unknown = source;

  for (const token of tokens) {
    if (current === null || current === undefined) {
      throw new Error(`Path not found at \"${token}\"`);
    }

    if (Array.isArray(current)) {
      const index = Number(token);
      if (!Number.isInteger(index) || index < 0 || index >= current.length) {
        throw new Error(`Invalid array index \"${token}\"`);
      }
      current = current[index];
      continue;
    }

    if (typeof current === 'object') {
      const record = current as Record<string, unknown>;
      if (!(token in record)) {
        throw new Error(`Path not found at \"${token}\"`);
      }
      current = record[token];
      continue;
    }

    throw new Error(`Cannot access \"${token}\" on primitive value`);
  }

  return current;
}

function stringifyOutput(value: unknown): string {
  if (typeof value === 'string') return value;
  return JSON.stringify(value, null, 2);
}

function tryParseJson(input: string): unknown {
  return JSON.parse(input);
}

export function JsonFormatter({ onBack }: JsonFormatterProps) {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [queryPath, setQueryPath] = useState('');
  const [error, setError] = useState('');

  const hasInput = useMemo(() => inputText.trim().length > 0, [inputText]);

  const runAction = (action: () => string) => {
    try {
      setError('');
      setOutputText(action());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setOutputText('');
    }
  };

  const handleFormat = () => {
    runAction(() => {
      const parsed = tryParseJson(inputText);
      return JSON.stringify(parsed, null, 2);
    });
  };

  const handleMinify = () => {
    runAction(() => {
      const parsed = tryParseJson(inputText);
      return JSON.stringify(parsed);
    });
  };

  const handleEscape = () => {
    runAction(() => JSON.stringify(inputText));
  };

  const handleUnescape = () => {
    runAction(() => {
      const parsed = JSON.parse(inputText);
      if (typeof parsed !== 'string') {
        throw new Error('Input is not an escaped JSON string');
      }
      return parsed;
    });
  };

  const handleQuery = () => {
    runAction(() => {
      if (!queryPath.trim()) {
        throw new Error('Enter a query path first');
      }
      const parsed = tryParseJson(inputText);
      const value = resolvePathValue(parsed, queryPath.trim());
      return stringifyOutput(value);
    });
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
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
              <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 4H6a2 2 0 00-2 2v2m0 8v2a2 2 0 002 2h2m8-16h2a2 2 0 012 2v2m0 8v2a2 2 0 01-2 2h-2M9 9h6m-6 3h6m-6 3h6" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">JSON Formatter</h1>
                <p className="text-sm text-gray-500">Format, minify, escape, unescape and query JSON</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Input</label>
              <textarea
                value={inputText}
                onChange={(event) => {
                  setInputText(event.target.value);
                  setError('');
                }}
                placeholder='{"name":"Surya","skills":["React","TypeScript"]}'
                className="w-full h-96 rounded-lg border border-gray-300 bg-white text-gray-900 p-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Output</label>
              <textarea
                value={outputText}
                readOnly
                placeholder="Result appears here"
                className="w-full h-96 rounded-lg border border-gray-300 bg-gray-50 text-gray-900 p-3 text-sm font-mono"
              />
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="mt-5 space-y-3">
            <button
              type="button"
              onClick={handleFormat}
              disabled={!hasInput}
              className={`w-full px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors ${
                hasInput ? 'bg-slate-800 hover:bg-slate-900' : 'bg-gray-300 cursor-not-allowed'
              }`}
            >
              Format JSON
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={handleMinify}
                disabled={!hasInput}
                className={`px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors ${
                  hasInput ? 'bg-slate-800 hover:bg-slate-900' : 'bg-gray-300 cursor-not-allowed'
                }`}
              >
                Minify JSON
              </button>
              <button
                type="button"
                onClick={handleEscape}
                disabled={!hasInput}
                className={`px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors ${
                  hasInput ? 'bg-slate-800 hover:bg-slate-900' : 'bg-gray-300 cursor-not-allowed'
                }`}
              >
                Escape JSON
              </button>
              <button
                type="button"
                onClick={handleUnescape}
                disabled={!hasInput}
                className={`px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors ${
                  hasInput ? 'bg-slate-800 hover:bg-slate-900' : 'bg-gray-300 cursor-not-allowed'
                }`}
              >
                Unescape JSON
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3">
              <input
                type="text"
                value={queryPath}
                onChange={(event) => setQueryPath(event.target.value)}
                placeholder="Enter query path (e.g. customer.phoneNumber[0])"
                className="px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={handleQuery}
                disabled={!hasInput}
                className={`px-6 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors ${
                  hasInput ? 'bg-slate-800 hover:bg-slate-900' : 'bg-gray-300 cursor-not-allowed'
                }`}
              >
                Query JSON
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
