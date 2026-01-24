import { useState } from 'react';
import { DiffItem } from '../types/diff';

interface DiffRowProps {
  item: DiffItem;
  matchKey: string;
}

function formatValue(value: unknown): string {
  if (value === undefined) return 'undefined';
  if (value === null) return 'null';
  if (typeof value === 'object') return JSON.stringify(value);
  if (typeof value === 'string') return `"${value}"`;
  return String(value);
}

export function DiffRow({ item, matchKey }: DiffRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const styles = {
    added: { 
      row: 'bg-white border-l-4 border-l-green-500', 
      badge: 'bg-green-100 text-green-800',
      label: 'Added'
    },
    removed: { 
      row: 'bg-white border-l-4 border-l-red-500', 
      badge: 'bg-red-100 text-red-800',
      label: 'Removed'
    },
    modified: { 
      row: 'bg-white border-l-4 border-l-amber-500', 
      badge: 'bg-amber-100 text-amber-800',
      label: 'Modified'
    },
    unchanged: { 
      row: 'bg-white border-l-4 border-l-gray-300', 
      badge: 'bg-gray-100 text-gray-700',
      label: 'Unchanged'
    },
  };

  const changeCount = item.changes?.length || 0;
  const style = styles[item.type];

  return (
    <div className={`${style.row} border border-gray-200 rounded-lg overflow-hidden shadow-sm`}>
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className={`shrink-0 px-2.5 py-1 rounded text-xs font-semibold ${style.badge}`}>
            {style.label}
          </span>
          <span className="font-mono text-sm text-gray-800 truncate">
            {matchKey}: <span className="font-bold text-gray-900">{String(item.keyValue)}</span>
          </span>
          {changeCount > 0 && (
            <span className="text-sm text-gray-500 shrink-0">
              ({changeCount} change{changeCount !== 1 ? 's' : ''})
            </span>
          )}
        </div>
        <svg
          className={`w-5 h-5 text-gray-500 shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="border-t border-gray-200 bg-gray-50 p-4">
          {item.type === 'modified' && item.changes && (
            <div className="space-y-2 mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Field Changes:</h4>
              {item.changes.map((change, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-gray-200 rounded-lg p-3 text-sm font-mono"
                >
                  <span className="font-semibold text-gray-700">{change.path}:</span>{' '}
                  {change.type === 'changed' && (
                    <>
                      <span className="text-red-600 line-through">{formatValue(change.oldValue)}</span>
                      <span className="text-gray-400 mx-2">→</span>
                      <span className="text-green-600 font-medium">{formatValue(change.newValue)}</span>
                    </>
                  )}
                  {change.type === 'added' && (
                    <span className="text-green-600 font-medium">+ {formatValue(change.newValue)}</span>
                  )}
                  {change.type === 'removed' && (
                    <span className="text-red-600">- {formatValue(change.oldValue)}</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {(item.type === 'added' || item.type === 'removed' || item.type === 'unchanged') && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Object Data:</h4>
              <pre className="bg-white border border-gray-200 rounded-lg p-4 text-sm text-gray-800 overflow-x-auto">
                {JSON.stringify(item.data, null, 2)}
              </pre>
            </div>
          )}

          {item.type === 'modified' && (
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Source Object:</h4>
                <pre className="bg-white border border-red-200 rounded-lg p-4 text-sm text-gray-800 overflow-x-auto">
                  {JSON.stringify(item.data, null, 2)}
                </pre>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Target Object:</h4>
                <pre className="bg-white border border-green-200 rounded-lg p-4 text-sm text-gray-800 overflow-x-auto">
                  {JSON.stringify(item.targetData, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
