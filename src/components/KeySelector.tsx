interface KeySelectorProps {
  keys: string[];
  selectedKey: string;
  onKeyChange: (key: string) => void;
  disabled?: boolean;
}

export function KeySelector({ keys, selectedKey, onKeyChange, disabled }: KeySelectorProps) {
  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">Match Key</label>
      <select
        value={selectedKey}
        onChange={(e) => onKeyChange(e.target.value)}
        disabled={disabled || keys.length === 0}
        className={`w-full px-4 py-3 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
          disabled || keys.length === 0 
            ? 'bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed' 
            : 'bg-white text-gray-900 border-gray-300'
        }`}
      >
        <option value="">Select a key to match objects...</option>
        {keys.map((key) => (
          <option key={key} value={key}>{key}</option>
        ))}
      </select>
      <p className="mt-1 text-xs text-gray-500">
        Objects will be matched by this field (e.g., id, userId, email)
      </p>
    </div>
  );
}
