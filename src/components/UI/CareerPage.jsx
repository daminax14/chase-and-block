import React, { useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { Lock, ChevronLeft, Star, Globe, Rocket } from 'lucide-react';

export function CareerPage() {
  // --- SINCRONIZZAZIONE STATO ---
  // Usiamo i selettori per assicurarci che il componente si aggiorni 
  // quando lo store cambia (specialmente unlockedLevels e view)
  const unlockedLevels = useGameStore((state) => state.unlockedLevels);
  const startLevel = useGameStore((state) => state.startLevel);
  const setView = useGameStore((state) => state.setView);
  const coins = useGameStore((state) => state.coins);

  const [selectedWorld, setSelectedWorld] = useState(null);

  // 🌍 Mondi
  const worlds = [
    { id: 'OCEAN', name: 'Abissi Marini', icon: <Globe className="text-blue-400" />, unlockAt: 1 },
    { id: 'SPACE', name: 'Stazione Galattica', icon: <Rocket className="text-purple-400" />, unlockAt: 5 },
  ];

  // 🔢 Generiamo livelli virtuali (1 → 30)
  const totalLevels = 30;
  const allLevels = Array.from({ length: totalLevels }, (_, i) => i + 1);

  // 🎯 Filtra livelli per mondo
  const filteredLevels = allLevels.filter(levelNumber => {
    if (selectedWorld === 'OCEAN') return levelNumber < 5;
    if (selectedWorld === 'SPACE') return levelNumber >= 5;
    return false;
  });

  // ==============================
  // 🌍 SELEZIONE MONDO
  // ==============================

  if (!selectedWorld) {
    return (
      <div className="fixed inset-0 bg-gradient-to-b from-[#4facfe] to-[#00f2fe] p-8 flex flex-col items-center overflow-y-auto text-slate-900">

        <header className="w-full max-w-4xl flex justify-between items-center mb-12">
          <button
            onClick={() => setView('MENU')}
            className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform"
          >
            <ChevronLeft size={32} />
          </button>

          <h1 className="text-4xl font-black text-white uppercase drop-shadow-md">
            Esplora Mondi
          </h1>

          <div className="bg-yellow-400 px-5 py-2 rounded-full font-black shadow-md">
            💰 {coins}
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
          {worlds.map(world => {
            const isLocked = unlockedLevels < world.unlockAt;

            return (
              <button
                key={world.id}
                disabled={isLocked}
                onClick={() => setSelectedWorld(world.id)}
                className={`h-72 rounded-3xl flex flex-col items-center justify-center transition-all shadow-xl
                  ${isLocked ? 'bg-slate-200 opacity-60 cursor-not-allowed' : 'bg-white hover:scale-105 active:scale-95'}`}
              >
                <div className="text-6xl mb-6">
                  {isLocked ? <Lock size={48} className="text-slate-400" /> : world.icon}
                </div>

                <h2 className="text-2xl font-black uppercase">
                  {world.name}
                </h2>

                {isLocked && (
                  <p className="text-xs mt-3 font-bold text-slate-500">
                    Sblocca al livello {world.unlockAt}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ==============================
  // 🗺 PERCORSO LIVELLI
  // ==============================

  return (
    <div className="fixed inset-0 bg-white flex flex-col text-slate-900">

      <header className="p-6 flex justify-between items-center border-b bg-white z-10 shadow-sm">
        <button
          onClick={() => setSelectedWorld(null)}
          className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center active:scale-90 transition-transform"
        >
          <ChevronLeft />
        </button>

        <h2 className="text-2xl font-black uppercase">
          {worlds.find(w => w.id === selectedWorld)?.name}
        </h2>

        <div className="w-12" />
      </header>

      <main className="flex-1 overflow-y-auto p-10 flex flex-col items-center gap-12 bg-slate-50">

        {filteredLevels.map((levelNumber, index) => {
          const isUnlocked = levelNumber <= unlockedLevels;
          const isCurrent = levelNumber === unlockedLevels;
          const marginClass = index % 2 === 0 ? 'mr-20' : 'ml-20';

          return (
            <div key={levelNumber} className={`flex flex-col items-center ${marginClass}`}>

              <button
                disabled={!isUnlocked}
                onClick={() => {
                  // --- DEBUG LOGS ---
                  console.log(`🎯 Bottone cliccato: Livello ${levelNumber}`);
                  console.log(`🔓 unlockedLevels nello store: ${unlockedLevels}`);
                  console.log(`🚀 Chiamata a startLevel(${levelNumber})...`);
                  
                  startLevel(levelNumber);
                }}
                className={`
                  w-24 h-24 rounded-3xl flex flex-col items-center justify-center transition-all shadow-lg
                  ${isUnlocked 
                    ? 'bg-yellow-400 active:scale-90 cursor-pointer' 
                    : 'bg-slate-200 opacity-50 cursor-not-allowed'}
                  ${isCurrent ? 'ring-8 ring-blue-500/30 scale-110' : ''}
                `}
              >
                {isUnlocked ? (
                  <>
                    <span className="text-blue-900 font-black text-3xl">
                      {levelNumber}
                    </span>
                    <div className="flex gap-1 mt-1 text-blue-900/40">
                      <Star size={10} fill="currentColor" />
                      <Star size={10} fill="currentColor" />
                      <Star size={10} fill="currentColor" />
                    </div>
                  </>
                ) : (
                  <Lock size={30} className="text-slate-400" />
                )}
              </button>

              {isCurrent && (
                <div className="mt-4 text-xs font-black bg-blue-500 text-white px-4 py-1.5 rounded-full animate-bounce shadow-md uppercase tracking-wider">
                  Play Now
                </div>
              )}
            </div>
          );
        })}

        {/* Padding finale per permettere lo scroll oltre l'ultimo livello */}
        <div className="h-20" />
      </main>
    </div>
  );
}