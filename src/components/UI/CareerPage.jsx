import { useGameStore } from '../../store/useGameStore';
import { Lock, Play, Star } from 'lucide-react';

export function CareerPage() {
  const { levels, unlockedLevels, setView, setCurrentLevel } = useGameStore();

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8 pb-24">
      <header className="flex justify-between items-center mb-12">
        <button onClick={() => setView('MENU')} className="text-slate-400">Indietro</button>
        <h1 className="text-2xl font-bold tracking-widest">MAPPA CARRIERA</h1>
        <div className="w-10"></div> {/* Spacer */}
      </header>

      <div className="flex flex-col-reverse items-center gap-8">
        {levels.map((lvl) => {
          const isUnlocked = lvl.id <= unlockedLevels;
          const isCurrent = lvl.id === unlockedLevels;

          return (
            <div key={lvl.id} className="relative">
              {/* Bottone Livello */}
              <button
                disabled={!isUnlocked}
                onClick={() => setCurrentLevel(lvl.id)}
                className={`
                  w-20 h-20 rounded-full flex flex-col items-center justify-center transition-all
                  ${isUnlocked ? 'bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]' : 'bg-slate-700 opacity-50'}
                  ${isCurrent ? 'scale-125 border-4 border-white' : 'scale-100'}
                `}
              >
                {isUnlocked ? (
                  <>
                    <span className="text-xs font-bold uppercase">{lvl.bioma}</span>
                    <span className="text-2xl font-black">{lvl.label}</span>
                  </>
                ) : (
                  <Lock size={24} />
                )}
              </button>

              {/* Decorazione Bioma (piccolo indicatore laterale) */}
              <div className="absolute -right-16 top-1/2 -translate-y-1/2">
                 {isCurrent && <div className="text-xs text-yellow-400 animate-bounce">TU SEI QUI</div>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Statistiche */}
      <div className="fixed bottom-0 left-0 w-full p-4 bg-slate-800/80 backdrop-blur-md flex justify-around border-t border-slate-700">
         <div className="text-center">
            <p className="text-slate-400 text-xs">MONETE</p>
            <p className="font-bold text-yellow-500">1,250</p>
         </div>
         <div className="text-center">
            <p className="text-slate-400 text-xs">PROGRESSO</p>
            <p className="font-bold">{(unlockedLevels / levels.length * 100).toFixed(0)}%</p>
         </div>
      </div>
    </div>
  );
}