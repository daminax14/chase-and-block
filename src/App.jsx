import { useGameStore } from './store/useGameStore';
import { CareerPage } from './components/UI/CareerPage';
import { GameScene } from './components/Game/GameScene';

function App() {
  const view = useGameStore((state) => state.view);

  return (
    <main className="w-full h-screen overflow-x-hidden bg-black">
      {view === 'MENU' && (
        <div className="h-full flex flex-col items-center justify-center space-y-6">
          <h1 className="text-5xl font-black text-white italic tracking-tighter">CHASE BLOCK 3D</h1>
          <button 
            onClick={() => useGameStore.getState().setView('CAREER')}
            className="px-12 py-4 bg-yellow-400 text-black font-bold rounded-full hover:scale-105 transition-transform"
          >
            START CAREER
          </button>
        </div>
      )}

      {view === 'CAREER' && <CareerPage />}
     
      {view === 'GAME' && <GameScene />}

    </main>
  );
}

export default App;