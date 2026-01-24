import { useState, useMemo } from 'react';
import { DiffResult, DiffItem, DiffItemType } from '../types/diff';
import { DiffRow } from './DiffRow';

interface DiffTableProps {
  result: DiffResult;
}

type FilterType = 'all' | DiffItemType;

export function DiffTable({ result }: DiffTableProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const allItems = useMemo((): DiffItem[] => {
    const items: DiffItem[] = [];

    result.added.forEach((obj) => {
      items.push({
        type: 'added',
        keyValue: obj[result.matchKey] as string | number,
        data: obj,
      });
    });

    result.removed.forEach((obj) => {
      items.push({
        type: 'removed',
        keyValue: obj[result.matchKey] as string | number,
        data: obj,
      });
    });

    result.modified.forEach((mod) => {
      items.push({
        type: 'modified',
        keyValue: mod.keyValue,
        data: mod.sourceObject,
        targetData: mod.targetObject,
        changes: mod.changes,
      });
    });

    result.unchanged.forEach((obj) => {
      items.push({
        type: 'unchanged',
        keyValue: obj[result.matchKey] as string | number,
        data: obj,
      });
    });

    return items;
  }, [result]);

  const filteredItems = useMemo(() => {
    return allItems.filter((item) => {
      if (filter !== 'all' && item.type !== filter) return false;

      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const keyMatch = String(item.keyValue).toLowerCase().includes(searchLower);
        const dataMatch = JSON.stringify(item.data).toLowerCase().includes(searchLower);
        return keyMatch || dataMatch;
      }

      return true;
    });
  }, [allItems, filter, searchQuery]);

  const filters: { type: FilterType; label: string; count: number }[] = [
    { type: 'all', label: 'All', count: allItems.length },
    { type: 'added', label: 'Added', count: result.summary.added },
    { type: 'removed', label: 'Removed', count: result.summary.removed },
    { type: 'modified', label: 'Modified', count: result.summary.modified },
    { type: 'unchanged', label: 'Unchanged', count: result.summary.unchanged },
  ];

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f.type}
              type="button"
              onClick={() => setFilter(f.type)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f.type
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {f.label} ({f.count})
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 min-w-0 px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Results */}
      <div className="space-y-3">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="mt-2 text-gray-500">No items match your filter</p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <DiffRow key={`${item.type}-${item.keyValue}`} item={item} matchKey={result.matchKey} />
          ))
        )}
      </div>

      {filteredItems.length > 0 && filteredItems.length !== allItems.length && (
        <div className="mt-4 text-sm text-gray-500 text-center">
          Showing {filteredItems.length} of {allItems.length} items
        </div>
      )}
    </div>
  );
}
