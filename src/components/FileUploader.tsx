import { useCallback, useState } from 'react';

interface FileUploaderProps {
  label: string;
  onFileLoaded: (data: Record<string, unknown>[], filename: string) => void;
  filename?: string;
}

type InputMode = 'upload' | 'paste';

export function FileUploader({ label, onFileLoaded, filename }: FileUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<InputMode>('upload');
  const [pastedJson, setPastedJson] = useState('');
  const [itemCount, setItemCount] = useState<number | null>(null);

  const validateAndParseJson = useCallback(
    (content: string, sourceName: string): boolean => {
      setError(null);
      setItemCount(null);

      try {
        const parsed = JSON.parse(content);

        if (!Array.isArray(parsed)) {
          setError('JSON must be an array of objects');
          return false;
        }

        if (parsed.length === 0) {
          setError('JSON array is empty');
          return false;
        }

        if (typeof parsed[0] !== 'object' || parsed[0] === null) {
          setError('JSON array must contain objects');
          return false;
        }

        setItemCount(parsed.length);
        onFileLoaded(parsed, sourceName);
        return true;
      } catch (err) {
        setError('Invalid JSON: ' + (err instanceof Error ? err.message : 'Parse error'));
        return false;
      }
    },
    [onFileLoaded]
  );

  const handleFile = useCallback(
    (file: File) => {
      setError(null);
      setItemCount(null);

      if (!file.name.endsWith('.json')) {
        setError('Please upload a JSON file');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        validateAndParseJson(content, file.name);
      };
      reader.onerror = () => setError('Failed to read file');
      reader.readAsText(file);
    },
    [validateAndParseJson]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handlePasteSubmit = () => {
    const trimmed = pastedJson.trim();
    if (!trimmed) {
      setError('Please paste JSON content');
      return;
    }
    validateAndParseJson(trimmed, `Pasted JSON`);
    // Don't clear the textarea - keep the data visible
  };

  const isLoaded = !!filename;

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>

      {/* Mode Tabs */}
      <div className="flex border-b border-gray-200 mb-3">
        <button
          type="button"
          onClick={() => { setInputMode('upload'); setError(null); }}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            inputMode === 'upload'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Upload
        </button>
        <button
          type="button"
          onClick={() => { setInputMode('paste'); setError(null); }}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            inputMode === 'paste'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Paste
        </button>
      </div>

      {/* Upload Mode */}
      {inputMode === 'upload' && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
            isDragOver
              ? 'border-blue-500 bg-blue-50'
              : isLoaded
                ? 'border-green-500 bg-green-50'
                : 'border-gray-300 bg-white hover:border-gray-400'
          }`}
        >
          <input
            type="file"
            accept=".json"
            onChange={handleInputChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          {isLoaded ? (
            <div>
              <svg className="mx-auto h-10 w-10 text-green-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-sm font-medium text-green-700">{filename}</p>
              {itemCount && <p className="text-xs text-green-600 mt-1">{itemCount} items loaded</p>}
              <p className="text-xs text-gray-500 mt-1">Click or drop to replace</p>
            </div>
          ) : (
            <div>
              <svg className="mx-auto h-10 w-10 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-sm text-gray-600">
                <span className="font-medium text-blue-600">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-500 mt-1">JSON file (array of objects)</p>
            </div>
          )}
        </div>
      )}

      {/* Paste Mode */}
      {inputMode === 'paste' && (
        <div className="space-y-3">
          {/* Success Banner */}
          {isLoaded && (
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 p-3 rounded-lg">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-medium">
                {filename} {itemCount && `(${itemCount} items)`}
              </span>
            </div>
          )}

          <textarea
            value={pastedJson}
            onChange={(e) => { setPastedJson(e.target.value); setError(null); }}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                handlePasteSubmit();
              }
            }}
            placeholder='[{"id": 1, "name": "Example"}, {"id": 2, "name": "Test"}]'
            className={`w-full h-36 p-3 rounded-lg border text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              isLoaded
                ? 'border-green-300 bg-white text-gray-900'
                : 'border-gray-300 bg-white text-gray-900'
            }`}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Press Ctrl+Enter to apply</span>
            <button
              type="button"
              onClick={handlePasteSubmit}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              Apply JSON
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
}
