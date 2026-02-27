import { useMemo, useState } from 'react';

interface QRGeneratorProps {
  onBack: () => void;
}

const URL_PATTERN = /^https?:\/\/.+/i;

export function QRGenerator({ onBack }: QRGeneratorProps) {
  const [urlInput, setUrlInput] = useState('');

  const trimmedUrl = urlInput.trim();
  const hasInput = trimmedUrl.length > 0;
  const isValidUrl = URL_PATTERN.test(trimmedUrl);

  const qrImageUrl = useMemo(() => {
    if (!isValidUrl) return '';
    return `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(trimmedUrl)}`;
  }, [isValidUrl, trimmedUrl]);

  const downloadUrl = useMemo(() => {
    if (!isValidUrl) return '';
    return `https://api.qrserver.com/v1/create-qr-code/?size=1024x1024&data=${encodeURIComponent(trimmedUrl)}&format=png`;
  }, [isValidUrl, trimmedUrl]);

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
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
              <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm10 4h2m2 0h2m-6-4h2m2 0h2m-2 2v2" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">QR Generator</h1>
                <p className="text-sm text-gray-500">Paste a URL to generate a QR code instantly</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <label htmlFor="url-input" className="block text-sm font-semibold text-gray-900 mb-2">
            Website URL
          </label>
          <input
            id="url-input"
            type="url"
            value={urlInput}
            onChange={(event) => setUrlInput(event.target.value)}
            placeholder="https://example.com"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors"
          />
          {hasInput && !isValidUrl && (
            <p className="mt-2 text-sm text-red-600">Enter a valid URL starting with http:// or https://</p>
          )}
        </div>

        <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {!isValidUrl ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-xl mx-auto flex items-center justify-center text-gray-400">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-3-3v6m11 0a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h6l2 2h8a2 2 0 012 2v8z" />
                </svg>
              </div>
              <p className="mt-4 text-sm text-gray-500">Paste a URL above to generate your QR code</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <img
                src={qrImageUrl}
                alt="Generated QR code"
                className="w-72 h-72 rounded-lg border border-gray-200"
              />
              <p className="mt-4 text-sm text-gray-600 break-all text-center">{trimmedUrl}</p>
              <a
                href={downloadUrl}
                download="qr-code.png"
                className="mt-5 px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Download PNG
              </a>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
