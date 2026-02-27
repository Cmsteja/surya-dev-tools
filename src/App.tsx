import { useEffect, useState } from 'react';
import { HomePage } from './components/HomePage';
import { DiffChecker } from './components/DiffChecker';
import { QRGenerator } from './components/QRGenerator';
import { JsonFormatter } from './components/JsonFormatter';

type View = 'home' | 'diff-checker' | 'qr-generator' | 'json-formatter';
type ThemeMode = 'light' | 'dark';

function viewFromPath(path: string): View {
  if (path.startsWith('/json-diff-checker')) return 'diff-checker';
  if (path.startsWith('/qr-generator')) return 'qr-generator';
  if (path.startsWith('/json-formatter')) return 'json-formatter';
  return 'home';
}

function App() {
  const [currentView, setCurrentView] = useState<View>(() => viewFromPath(window.location.pathname));
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    const storedTheme = localStorage.getItem('theme-mode');
    if (storedTheme === 'dark' || storedTheme === 'light') {
      return storedTheme;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', themeMode === 'dark');
    localStorage.setItem('theme-mode', themeMode);
  }, [themeMode]);

  // navigate helper updates view state and URL
  const navigate = (view: View) => {
    setCurrentView(view);
    let path = '/';
    switch (view) {
      case 'diff-checker':
        path = '/json-diff-checker';
        break;
      case 'qr-generator':
        path = '/qr-generator';
        break;
      case 'json-formatter':
        path = '/json-formatter';
        break;
      default:
        path = '/';
    }
    history.pushState(null, '', path);
  };

  // listen for back/forward navigation
  useEffect(() => {
    const onPop = () => setCurrentView(viewFromPath(window.location.pathname));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setThemeMode((prev) => (prev === 'dark' ? 'light' : 'dark'))}
        className="fixed top-4 right-4 z-50 inline-flex items-center gap-2 px-3 py-2 rounded-full border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
        title={`Switch to ${themeMode === 'dark' ? 'light' : 'dark'} mode`}
      >
        {themeMode === 'dark' ? (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
            </svg>
            <span className="text-xs font-semibold">Light</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646a9 9 0 1011.708 11.708z" />
            </svg>
            <span className="text-xs font-semibold">Dark</span>
          </>
        )}
      </button>
      {currentView === 'home' && (
        <HomePage
          onOpenDiffChecker={() => navigate('diff-checker')}
          onOpenQRGenerator={() => navigate('qr-generator')}
          onOpenJsonFormatter={() => navigate('json-formatter')}
        />
      )}
      {currentView === 'diff-checker' && (
        <DiffChecker onBack={() => navigate('home')} />
      )}
      {currentView === 'qr-generator' && (
        <QRGenerator onBack={() => navigate('home')} />
      )}
      {currentView === 'json-formatter' && (
        <JsonFormatter onBack={() => navigate('home')} />
      )}
    </>
  );
}

export default App;
