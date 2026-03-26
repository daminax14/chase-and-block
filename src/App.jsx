import React from 'react';
import { useGameStore } from './store/useGameStore';
import { CareerPage } from './components/UI/CareerPage';
import { GameScene } from './components/Game/GameScene';
import { Shop } from './components/UI/Shop';
import { MainMenu } from './components/UI/MainMenu';

function App() {
  const view = useGameStore((state) => state.view);

  return (
    <main className="w-full overflow-hidden" style={{ height: '100dvh' }}>
      {view === 'MENU'   && <MainMenu />}
      {view === 'SHOP'   && <Shop />}
      {view === 'CAREER' && <CareerPage />}
      {view === 'GAME'   && <GameScene />}
    </main>
  );
}

export default App;