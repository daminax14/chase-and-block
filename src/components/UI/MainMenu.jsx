import React from 'react';
import { useGameStore } from '../../store/useGameStore';

export function MainMenu() {
  const { setView, coins, setCurrentLevel } = useGameStore();

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-slate-950 text-white overflow-hidden">
      
      {/* SFONDO DECORATIVO - Giusto per non avere il nero piatto */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-yellow-500 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600 rounded-full blur-[120px]" />
      </div>

      {/* PORTAFOGLIO IN ALTO A DESTRA */}
      <div className="absolute top-10 right-10 flex items-center gap-3 bg-white/5 backdrop-blur-xl border border-white/10 px-6 py-3 rounded-2xl shadow-2xl">
        <span className="text-yellow-400 text-2xl">💰</span>
        <span className="font-black text-2xl tracking-tighter">{coins}</span>
      </div>

      {/* TITOLO PRINCIPALE */}
      <div className="relative z-10 flex flex-col items-center mb-16">
        <h1 className="text-8xl md:text-9xl font-black italic tracking-tighter leading-none text-center uppercase">
          CHASE<br />
          <span className="text-yellow-400 drop-shadow-[0_5px_15px_rgba(250,204,21,0.4)]">BLOCK 3D</span>
        </h1>
        <div className="h-2 w-32 bg-white mt-4 rounded-full opacity-20" />
      </div>

      {/* BOTTONI AZIONE */}
      <div className="relative z-10 flex flex-col gap-5 w-full max-w-sm px-6">
        <button 
          onClick={() => setView('CAREER')}
          className="group relative overflow-hidden bg-yellow-400 text-black font-black py-5 rounded-2xl text-2xl shadow-[0_10px_0_rgb(161,98,7)] active:translate-y-2 active:shadow-none transition-all"
        >
          <span className="relative z-10 uppercase italic">Start Career</span>
          <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 skew-x-12" />
        </button>

        <button 
          onClick={() => setView('SHOP')}
          className="bg-white/5 border-2 border-white/10 py-5 rounded-2xl text-xl font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all"
        >
          Armory / Shop
        </button>
      </div>

      {/* FOOTER / INFO */}
      <div className="absolute bottom-10 flex flex-col items-center opacity-30">
        <p className="text-xs font-mono uppercase tracking-[0.3em]">Build v1.2.0 - Stabilized Architecture</p>
      </div>

    </div>
  );
}