import { DiffResult } from '../types/diff';
import { downloadJsonReport, downloadHtmlReport } from '../utils/reportGenerator';

interface DownloadButtonsProps {
  result: DiffResult;
}

export function DownloadButtons({ result }: DownloadButtonsProps) {
  return (
    <div className="flex gap-3">
      <button
        type="button"
        onClick={() => downloadJsonReport(result)}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        JSON
      </button>
      <button
        type="button"
        onClick={() => downloadHtmlReport(result)}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        HTML
      </button>
    </div>
  );
}
