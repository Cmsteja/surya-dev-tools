import { useState } from 'react';
import { HomePage } from './components/HomePage';
import { DiffChecker } from './components/DiffChecker';

type View = 'home' | 'diff-checker';

function App() {
  const [currentView, setCurrentView] = useState<View>('home');

  return (
    <>
      {currentView === 'home' && (
        <HomePage onOpenDiffChecker={() => setCurrentView('diff-checker')} />
      )}
      {currentView === 'diff-checker' && (
        <DiffChecker onBack={() => setCurrentView('home')} />
      )}
    </>
  );
}

export default App;
