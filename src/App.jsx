import React from 'react';
import { useGameStore } from './store/useGameStore';
import { CareerPage } from './components/UI/CareerPage';
import { GameScene } from './components/Game/GameScene';
import { Shop } from './components/UI/Shop';         // Lo creeremo tra un secondo
import { MainMenu } from './components/UI/MainMenu'; // Lo creeremo tra un secondo

function App() {
  // Prendiamo la vista attuale dallo store
  const view = useGameStore((state) => state.view);

  return (
    <main className="w-full h-screen overflow-hidden bg-black text-white">
      
      {/* 🏠 SCHERMATA MENU PRINCIPALE */}
      {view === 'MENU' && <MainMenu />}

      {/* 💰 IL NEGOZIO DELLE SKIN */}
      {view === 'SHOP' && <Shop />}

      {/* 🗺️ MAPPA DELLA CARRIERA (LIVELLI) */}
      {view === 'CAREER' && <CareerPage />}
      
      {/* 🎮 IL GIOCO VERO E PROPRIO */}
      {view === 'GAME' && <GameScene />}

    </main>
  );
}

export default App;