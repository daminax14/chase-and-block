import React, { useState } from 'react';
import { useGameStore } from '../../store/useGameStore';

/* ===========================
   DATA
=========================== */

const GEM_PACKS = [
  { id: 'g1', amount: 80, price: '€0.99' },
  { id: 'g2', amount: 250, price: '€2.99', bonus: 20 },
  { id: 'g3', amount: 700, price: '€6.99', bonus: 100, popular: true },
  { id: 'g4', amount: 2000, price: '€19.99', bonus: 400 },
];

const COIN_PACKS = [
  { id: 'c1', amount: 2000, price: '€0.99' },
  { id: 'c2', amount: 10000, price: '€2.99', best: true },
  { id: 'c3', amount: 30000, price: '€6.99' },
];

const SKINS = [
  { id: 'guard_basic', name: 'City Guard', rarity: 'common', priceCoins: 500 },
  { id: 'guard_river', name: 'River Patrol', rarity: 'rare', priceCoins: 2000 },
  { id: 'guard_shadow', name: 'Night Hunter', rarity: 'epic', priceGems: 150 },
  { id: 'guard_royal', name: 'Royal Commander', rarity: 'legendary', priceGems: 400 },
];

const BOOSTS = [
  { id: 'wall', name: 'Extra Wall', priceCoins: 300, icon: '🧱' },
  { id: 'freeze', name: 'Freeze Turn', priceCoins: 500, icon: '❄️' },
  { id: 'extraGuard', name: 'Extra Guard', priceGems: 50, icon: '👮' },
];

const rarityStyle = {
  common: 'bg-gray-200 text-gray-800',
  rare: 'bg-blue-500 text-white shadow-lg',
  epic: 'bg-purple-600 text-white shadow-xl ring-2 ring-purple-300',
  legendary: 'bg-yellow-400 text-white shadow-2xl ring-4 ring-yellow-300 animate-pulse'
};

/* ===========================
   COMPONENT
=========================== */

export function Shop() {
  const {
    coins,
    gems,
    ownedSkins,
    selectedSkin,
    ownedBoosts,
    buySkin,
    buyBoost,
    addCoins,
    addGems,
    setView
  } = useGameStore();

  const [tab, setTab] = useState('skins');

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-4 flex flex-col">

      {/* ================= HEADER ================= */}
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => setView('MENU')}
          className="w-12 h-12 bg-white/20 rounded-full text-white text-2xl"
        >
          ←
        </button>

        <h1 className="text-3xl font-black text-white tracking-wide">
          SHOP
        </h1>

        <div className="flex gap-3 text-white font-bold">
          <div className="bg-white/20 px-3 py-1 rounded-full">🪙 {coins}</div>
          <div className="bg-white/20 px-3 py-1 rounded-full">💎 {gems}</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-6">

        {/* ================= OFFER OF THE DAY ================= */}
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-4 rounded-3xl shadow-2xl animate-pulse">
          <div className="text-white font-bold text-sm">🔥 OFFER OF THE DAY</div>
          <div className="flex justify-between items-center mt-2">
            <div className="text-white font-bold text-lg">
              Royal Commander -30%
            </div>
            <button
              onClick={() => addGems(400)}
              className="bg-white text-orange-500 px-4 py-2 rounded-xl font-bold"
            >
              BUY 280 💎
            </button>
          </div>
        </div>

        {/* ================= GEM PACKS ================= */}
        <div>
          <h2 className="text-white font-bold text-xl mb-3">💎 GEM PACKS</h2>
          <div className="grid grid-cols-2 gap-4">
            {GEM_PACKS.map(pack => (
              <div
                key={pack.id}
                className={`relative p-4 rounded-3xl text-white shadow-2xl transition hover:scale-105
                  ${pack.popular
                    ? 'bg-gradient-to-br from-cyan-400 to-blue-600'
                    : 'bg-gradient-to-br from-indigo-500 to-purple-600'
                  }`}
              >
                {pack.popular && (
                  <div className="absolute -top-2 -right-2 bg-yellow-400 text-black text-xs font-bold px-2 py-1 rounded-full">
                    MOST POPULAR
                  </div>
                )}

                <div className="text-2xl font-black">
                  💎 {pack.amount + (pack.bonus || 0)}
                </div>

                {pack.bonus && (
                  <div className="text-xs mt-1 bg-yellow-400 text-black px-2 py-1 rounded-full inline-block">
                    +{pack.bonus} BONUS
                  </div>
                )}

                <button
                  onClick={() => addGems(pack.amount + (pack.bonus || 0))}
                  className="mt-3 w-full bg-white text-purple-600 py-2 rounded-xl font-bold"
                >
                  {pack.price}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ================= COIN PACKS ================= */}
        <div>
          <h2 className="text-white font-bold text-xl mb-3">🪙 COIN PACKS</h2>
          <div className="grid grid-cols-3 gap-3">
            {COIN_PACKS.map(pack => (
              <div
                key={pack.id}
                className={`p-3 rounded-2xl text-center shadow-xl bg-yellow-400 hover:scale-105 transition`}
              >
                <div className="font-bold text-lg">🪙 {pack.amount}</div>
                <button
                  onClick={() => addCoins(pack.amount)}
                  className="mt-2 bg-black text-white px-3 py-1 rounded-lg font-bold"
                >
                  {pack.price}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ================= REMOVE ADS ================= */}
        <button className="bg-black text-white py-3 rounded-2xl font-bold shadow-xl hover:scale-105 transition">
          🚫 REMOVE ADS - €1.99
        </button>

        {/* ================= TABS ================= */}
        <div className="flex gap-3">
          {['skins', 'boosts'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-3 rounded-2xl font-bold transition 
                ${tab === t
                  ? 'bg-white text-purple-600 scale-105'
                  : 'bg-white/20 text-white'
                }`}
            >
              {t.toUpperCase()}
            </button>
          ))}
        </div>

        {/* ================= BOOST INVENTORY ================= */}
        {tab === 'boosts' && (
          <div className="bg-white/20 rounded-2xl p-3 text-white text-sm">
            <div className="font-bold mb-2">Your Boosts</div>
            <div className="flex gap-4">
              {BOOSTS.map(b => (
                <div key={b.id}>
                  {b.icon} x {ownedBoosts?.[b.id] || 0}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= SKINS ================= */}
        {tab === 'skins' &&
          SKINS.map(skin => {
            const isOwned = ownedSkins.includes(skin.id);
            const isSelected = selectedSkin === skin.id;

            return (
              <div
                key={skin.id}
                className={`rounded-3xl p-4 flex items-center shadow-2xl transition hover:scale-[1.02] ${rarityStyle[skin.rarity]}`}
              >
                <div className="flex-1">
                  <div className="font-bold text-lg">{skin.name}</div>
                  <div className="text-xs uppercase opacity-80">{skin.rarity}</div>
                </div>

                {isOwned ? (
                  <button
                    disabled={isSelected}
                    className={`px-4 py-2 rounded-xl font-bold
                      ${isSelected
                        ? 'bg-gray-300 text-gray-600'
                        : 'bg-green-500 text-white'
                      }`}
                  >
                    {isSelected ? 'IN USE' : 'USE'}
                  </button>
                ) : (
                  <button
                    onClick={() =>
                      skin.priceGems
                        ? buySkin(skin.id, 'gems', skin.priceGems)
                        : buySkin(skin.id, 'coins', skin.priceCoins)
                    }
                    className="px-4 py-2 rounded-xl bg-black text-white font-bold"
                  >
                    {skin.priceGems
                      ? `💎 ${skin.priceGems}`
                      : `🪙 ${skin.priceCoins}`}
                  </button>
                )}
              </div>
            );
          })}

        {/* ================= BOOSTS ================= */}
        {tab === 'boosts' &&
          BOOSTS.map(boost => (
            <div
              key={boost.id}
              className="bg-white rounded-3xl p-4 flex items-center shadow-xl hover:scale-[1.02] transition"
            >
              <div className="text-5xl mr-4">{boost.icon}</div>

              <div className="flex-1">
                <div className="font-bold text-lg">{boost.name}</div>
              </div>

              <button
                onClick={() =>
                  boost.priceGems
                    ? buyBoost(boost.id, 'gems', boost.priceGems)
                    : buyBoost(boost.id, 'coins', boost.priceCoins)
                }
                className="px-4 py-2 rounded-xl bg-yellow-400 text-white font-bold"
              >
                {boost.priceGems
                  ? `💎 ${boost.priceGems}`
                  : `🪙 ${boost.priceCoins}`}
              </button>
            </div>
          ))}

      </div>
    </div>
  );
}
