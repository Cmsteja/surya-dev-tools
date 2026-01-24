import { DiffSummary as DiffSummaryType } from '../types/diff';

interface DiffSummaryProps {
  summary: DiffSummaryType;
}

export function DiffSummary({ summary }: DiffSummaryProps) {
  const stats = [
    { label: 'Added', value: summary.added, textColor: 'text-green-700', bgColor: 'bg-green-50', borderColor: 'border-green-200' },
    { label: 'Removed', value: summary.removed, textColor: 'text-red-700', bgColor: 'bg-red-50', borderColor: 'border-red-200' },
    { label: 'Modified', value: summary.modified, textColor: 'text-amber-700', bgColor: 'bg-amber-50', borderColor: 'border-amber-200' },
    { label: 'Unchanged', value: summary.unchanged, textColor: 'text-gray-700', bgColor: 'bg-gray-50', borderColor: 'border-gray-200' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div 
          key={stat.label} 
          className={`${stat.bgColor} ${stat.borderColor} border rounded-lg p-4 text-center`}
        >
          <div className={`text-3xl font-bold ${stat.textColor}`}>
            {stat.value.toLocaleString()}
          </div>
          <div className="text-sm font-medium text-gray-600 mt-1">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}
