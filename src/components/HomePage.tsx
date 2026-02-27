interface HomePageProps {
  onOpenDiffChecker: () => void;
  onOpenQRGenerator: () => void;
  onOpenJsonFormatter: () => void;
}

export function HomePage({ onOpenDiffChecker, onOpenQRGenerator, onOpenJsonFormatter }: HomePageProps) {
  const tools = [
    {
      id: 'diff-checker',
      title: 'Intelligent Diff Checker',
      description: 'Compare two JSON arrays by matching key. Detect added, removed, and modified items with field-level changes.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      color: 'bg-blue-600',
      hoverColor: 'hover:bg-blue-700',
      onClick: onOpenDiffChecker,
    },
    {
      id: 'qr-generator',
      title: 'QR Generator',
      description: 'Paste a URL and instantly generate a QR code that can be downloaded as an image.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm10 4h2m2 0h2m-6-4h2m2 0h2m-2 2v2" />
        </svg>
      ),
      color: 'bg-emerald-600',
      hoverColor: 'hover:bg-emerald-700',
      onClick: onOpenQRGenerator,
    },
    {
      id: 'json-formatter',
      title: 'JSON Formatter',
      description: 'Format, minify, escape, unescape JSON and query nested values using path syntax.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 4H6a2 2 0 00-2 2v2m0 8v2a2 2 0 002 2h2m8-16h2a2 2 0 012 2v2m0 8v2a2 2 0 01-2 2h-2M9 9h6m-6 3h6m-6 3h6" />
        </svg>
      ),
      color: 'bg-indigo-600',
      hoverColor: 'hover:bg-indigo-700',
      onClick: onOpenJsonFormatter,
    },
    // Add more tools here in the future
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">Developer Tools</h1>
            <p className="mt-2 text-gray-600">Productivity tools for developers</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool) => (
            <button
              key={tool.id}
              type="button"
              onClick={tool.onClick}
              className="group bg-white rounded-xl border border-gray-200 p-6 text-left shadow-sm hover:shadow-lg transition-all duration-200 hover:border-gray-300"
            >
              <div className={`w-14 h-14 ${tool.color} ${tool.hoverColor} rounded-xl flex items-center justify-center text-white mb-4 transition-colors group-hover:scale-105 transform duration-200`}>
                {tool.icon}
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">{tool.title}</h2>
              <p className="text-sm text-gray-600 leading-relaxed">{tool.description}</p>
              <div className="mt-4 flex items-center text-blue-600 text-sm font-medium">
                Open tool
                <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          ))}

          {/* Placeholder for future tools */}
          <div className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 p-6 flex flex-col items-center justify-center text-center min-h-[200px]">
            <div className="w-14 h-14 bg-gray-200 rounded-xl flex items-center justify-center text-gray-400 mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <p className="text-sm text-gray-500">More tools coming soon</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-auto">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <p className="text-center text-sm text-gray-500">
            Developer Tools Suite
          </p>
        </div>
      </footer>
    </div>
  );
}
