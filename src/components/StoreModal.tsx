import React, { useState } from 'react';
import { Sparkles, Store, Tag, Users, X, Flame, StopCircle } from 'lucide-react';
import { GameConfig } from '../game/config';
import {
  calculateFairFishPrice,
  calculateFishPrice,
  calculatePopularity,
  isFishSellable,
} from '../game/rules';
import {
  DECOR_META,
  formatMoney,
  formatSpeciesName,
  RARITY_COLORS,
  RARITY_NAMES,
  STAFF_META,
  STAGE_NAMES,
  STORE_UPGRADE_META,
  TRAIT_LABELS,
  UI_TEXT,
} from '../game/strings';
import {
  DecorId,
  GameState,
  Language,
  StaffId,
  StoreUpgradeId,
} from '../game/types';
import { BuyerArtwork } from './BuyerArtwork';
import { FishPortrait } from './FishPortrait';

interface StoreModalProps {
  state: GameState;
  lang: Language;
  now: number;
  onClose: () => void;
  onStartNegotiation: (buyerId: string, fishId: string) => void;
  onBuyDecor: (id: DecorId) => void;
  onBuyStoreUpgrade: (id: StoreUpgradeId) => void;
  onHireStaff: (id: StaffId) => void;
  onStartSale: () => void;
  onStopSale: () => void;
}

export const StoreModal: React.FC<StoreModalProps> = ({
  state,
  lang,
  now,
  onClose,
  onStartNegotiation,
  onBuyDecor,
  onBuyStoreUpgrade,
  onHireStaff,
  onStartSale,
  onStopSale,
}) => {
  const [tab, setTab] = useState<'SELL' | 'DECOR' | 'UPGRADE' | 'STAFF'>('SELL');
  const [selectedBuyerId, setSelectedBuyerId] = useState<string | null>(
    state.buyers[0]?.id ?? null
  );
  const [selectedFishId, setSelectedFishId] = useState<string | null>(null);

  const popularity = calculatePopularity(state);
  const showcaseFish = state.fish.filter((f) => f.forSale && !f.inIsolation);
  const saleActive = state.saleEvent.active;
  const saleRemainingSec = saleActive
    ? Math.max(0, Math.ceil((state.saleEvent.endsAt - now) / 1000))
    : 0;
  const cooldownSec =
    !saleActive && state.saleEvent.cooldownUntil > now
      ? Math.ceil((state.saleEvent.cooldownUntil - now) / 1000)
      : 0;

  const activeBuyerId =
    state.buyers.find((b) => b.id === selectedBuyerId)?.id ?? state.buyers[0]?.id ?? null;

  const canStartNeg =
    Boolean(activeBuyerId) &&
    Boolean(selectedFishId) &&
    isFishSellable(state.fish.find((f) => f.id === selectedFishId)!);

  // Build SVG polyline points for SALE popularity chart
  const history = state.saleEvent.popularityHistory;
  const chartPoints = history
    .map((pt) => {
      const x = (pt.timeSec / 30) * 200;
      const y = 44 - (pt.pop / 100) * 38;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <div className="fixed inset-0 z-40 bg-slate-950/80 flex items-center justify-center p-3 md:p-6">
      <div className="w-full max-w-5xl max-h-[90vh] bg-slate-900 border border-sky-300/25 rounded-2xl flex flex-col overflow-hidden shadow-2xl">
        {/* Top Bar */}
        <div className="px-5 py-3.5 bg-slate-800/80 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Store className="w-5 h-5 text-amber-300" />
            <h2 className="text-lg font-bold text-white">{UI_TEXT.store[lang]}</h2>
            <span className="text-sm font-bold text-amber-300 tabular-nums">
              {formatMoney(state.money, lang)}
            </span>
          </div>

          {/* Popularity Meter (§8.3) */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-sky-200/80">{UI_TEXT.popularity[lang]}</span>
              <div className="w-28 h-2.5 rounded-full bg-slate-700 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-sky-400 to-amber-400 transition-all"
                  style={{ width: `${popularity}%` }}
                />
              </div>
              <span className="text-xs font-bold text-white tabular-nums">{popularity}/100</span>
            </div>

            {saleActive ? (
              <button
                type="button"
                onClick={onStopSale}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-400 text-white text-xs font-bold cursor-pointer tabular-nums"
              >
                <StopCircle className="w-3.5 h-3.5" />
                <span>
                  {UI_TEXT.stopSale[lang]} ({saleRemainingSec}s)
                </span>
              </button>
            ) : (
              <button
                type="button"
                disabled={cooldownSec > 0}
                onClick={onStartSale}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 disabled:bg-slate-700 disabled:text-slate-400 text-slate-950 text-xs font-bold cursor-pointer tabular-nums"
              >
                <Flame className="w-3.5 h-3.5" />
                <span>
                  {cooldownSec > 0
                    ? `${UI_TEXT.saleEvent[lang]} (${cooldownSec}s)`
                    : UI_TEXT.saleEvent[lang]}
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              aria-label={UI_TEXT.close[lang]}
              className="p-1.5 rounded-lg bg-slate-700/70 hover:bg-slate-600 text-slate-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* SALE Live Popularity Graph (§8.4) */}
        {(saleActive || (state.saleEvent.startedAt > 0 && state.saleEvent.buyersArrived > 0)) && (
          <div className="px-5 py-2.5 bg-amber-500/10 border-b border-amber-400/20 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-xs">
              <span className="font-bold text-amber-300">
                {saleActive
                  ? lang === 'id'
                    ? `SALE Berlangsung (${saleRemainingSec}s)`
                    : `SALE Active (${saleRemainingSec}s)`
                  : lang === 'id'
                    ? 'Ringkasan SALE Terakhir'
                    : 'Last SALE Summary'}
              </span>
              <span className="text-slate-200 tabular-nums">
                {lang === 'id' ? 'Pembeli:' : 'Buyers:'} {state.saleEvent.buyersArrived} ·{' '}
                {lang === 'id' ? 'Terjual:' : 'Sold:'} {state.saleEvent.fishSold} ·{' '}
                {formatMoney(state.saleEvent.revenue, lang)}
              </span>
            </div>
            {history.length > 1 && (
              <svg width="200" height="46" className="bg-slate-950/60 rounded border border-white/10">
                <polyline
                  fill="none"
                  stroke="#FBBF24"
                  strokeWidth="2"
                  points={chartPoints}
                />
              </svg>
            )}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="px-5 pt-3 flex items-center gap-1.5 border-b border-white/10 bg-slate-900">
          {[
            { id: 'SELL', labelId: 'Etalase & Pembeli', labelEn: 'Showcase & Buyers', icon: Tag },
            { id: 'DECOR', labelId: 'Dekorasi', labelEn: 'Decorate', icon: Sparkles },
            { id: 'UPGRADE', labelId: 'Upgrade Toko', labelEn: 'Shop Upgrades', icon: Store },
            { id: 'STAFF', labelId: 'Staf', labelEn: 'Staff', icon: Users },
          ].map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id as typeof tab)}
                className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                  active
                    ? 'border-sky-400 bg-slate-800/80 text-white'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{lang === 'id' ? t.labelId : t.labelEn}</span>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto laguna-scroll p-5">
          {tab === 'SELL' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Buyer Queue */}
              <div>
                <h3 className="text-sm font-bold text-white mb-3">
                  {lang === 'id' ? 'Antrean Pembeli' : 'Buyer Queue'} ({state.buyers.length})
                </h3>
                {state.buyers.length === 0 ? (
                  <div className="rounded-xl bg-slate-800/50 border border-white/10 p-6 text-center text-xs text-slate-400">
                    {lang === 'id'
                      ? 'Menunggu pembeli masuk ke toko...'
                      : 'Waiting for customers to walk in...'}
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {state.buyers.map((b) => {
                      const isSel = activeBuyerId === b.id;
                      return (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => setSelectedBuyerId(b.id)}
                          className={`w-full text-left rounded-xl p-3 border transition-colors flex items-center gap-3 cursor-pointer ${
                            isSel
                              ? 'bg-sky-500/20 border-sky-400'
                              : 'bg-slate-800/60 border-white/10 hover:bg-slate-800'
                          }`}
                        >
                          <BuyerArtwork outfit={b.outfit} size={52} />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold text-white truncate">{b.name}</div>
                            <div className="text-xs text-sky-200/80">
                              {TRAIT_LABELS[b.trait]?.[lang] ?? b.trait} ·{' '}
                              {lang === 'id' ? 'Kesabaran' : 'Patience'} {b.patience}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Showcase Fish Ready For Sale */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-white">
                    {lang === 'id' ? 'Ikan di Etalase' : 'Showcase Fish'} ({showcaseFish.length})
                  </h3>
                  <button
                    type="button"
                    disabled={!canStartNeg}
                    onClick={() => {
                      if (activeBuyerId && selectedFishId) {
                        onStartNegotiation(activeBuyerId, selectedFishId);
                      }
                    }}
                    className="px-4 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 disabled:bg-slate-700 disabled:text-slate-400 text-slate-950 text-xs font-bold cursor-pointer"
                  >
                    {lang === 'id' ? 'Mulai Negosiasi' : 'Start Negotiation'}
                  </button>
                </div>

                {showcaseFish.length === 0 ? (
                  <div className="rounded-xl bg-slate-800/50 border border-white/10 p-6 text-center text-xs text-slate-400">
                    {lang === 'id'
                      ? 'Belum ada ikan yang ditandai Siap Jual. Pilih ikan Remaja+ di Tank lalu klik Siap Jual.'
                      : 'No fish marked For Sale yet. Select a Teen+ fish in your Tank and mark it For Sale.'}
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {showcaseFish.map((f) => {
                      const sellable = isFishSellable(f);
                      const askPrice = calculateFishPrice(f, state);
                      const fairPrice = calculateFairFishPrice(f);
                      const isSel = selectedFishId === f.id;
                      return (
                        <button
                          key={f.id}
                          type="button"
                          disabled={!sellable}
                          onClick={() => setSelectedFishId(f.id)}
                          className={`w-full text-left rounded-xl p-3 border transition-colors flex items-center gap-3 ${
                            !sellable
                              ? 'bg-slate-800/30 border-white/5 opacity-60 cursor-not-allowed'
                              : isSel
                                ? 'bg-amber-500/20 border-amber-400 cursor-pointer'
                                : 'bg-slate-800/60 border-white/10 hover:bg-slate-800 cursor-pointer'
                          }`}
                        >
                          <FishPortrait body={f.body} fin={f.fin} stage={f.stage} sick={f.sick} width={64} height={40} />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold text-white truncate">
                              {formatSpeciesName(f.body, f.fin, lang)}
                            </div>
                            <div className="text-xs text-slate-300 flex items-center gap-1.5">
                              <span style={{ color: RARITY_COLORS[f.rarity].text }}>
                                {RARITY_NAMES[f.rarity]}
                              </span>
                              <span>·</span>
                              <span>{STAGE_NAMES[f.stage][lang]}</span>
                              {f.sick && (
                                <span className="text-rose-400 font-semibold">
                                  · {lang === 'id' ? 'Sakit' : 'Sick'}
                                </span>
                              )}
                              {!f.sick && !sellable && (
                                <span className="text-amber-300 font-semibold">
                                  · {UI_TEXT.tooYoung[lang]}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right tabular-nums">
                            {sellable ? (
                              <>
                                <div className="text-sm font-bold text-amber-300">
                                  {formatMoney(askPrice, lang)}
                                </div>
                                <div className="text-[11px] text-slate-400">
                                  {lang === 'id' ? 'Wajar' : 'Fair'}: {formatMoney(fairPrice, lang)}
                                </div>
                              </>
                            ) : (
                              <div className="text-xs text-slate-400">—</div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === 'DECOR' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(Object.keys(GameConfig.DECORATIONS) as DecorId[]).map((id) => {
                const owned = state.decorations.includes(id);
                const price = GameConfig.DECORATIONS[id];
                return (
                  <div
                    key={id}
                    className="rounded-xl bg-slate-800/70 border border-white/10 p-4 flex flex-col justify-between gap-3"
                  >
                    <div>
                      <div className="text-sm font-bold text-white">
                        {lang === 'id' ? DECOR_META[id].nameId : DECOR_META[id].nameEn}
                      </div>
                      <div className="text-xs text-sky-200/75 mt-1">
                        {lang === 'id'
                          ? 'DEAL +2% (maks +10%) · Popularitas +3'
                          : 'DEAL +2% (max +10%) · Popularity +3'}
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={owned || state.money < price}
                      onClick={() => onBuyDecor(id)}
                      className="py-2 px-3 rounded-lg bg-sky-500 hover:bg-sky-400 disabled:bg-slate-700 disabled:text-slate-400 text-slate-950 font-bold text-xs cursor-pointer tabular-nums"
                    >
                      {owned
                        ? lang === 'id'
                          ? 'Terpasang'
                          : 'Owned'
                        : formatMoney(price, lang)}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {tab === 'UPGRADE' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(Object.keys(GameConfig.STORE_UPGRADES) as StoreUpgradeId[]).map((id) => {
                const owned = state.storeUpgrades.includes(id);
                const price = GameConfig.STORE_UPGRADES[id];
                return (
                  <div
                    key={id}
                    className="rounded-xl bg-slate-800/70 border border-white/10 p-4 flex flex-col justify-between gap-3"
                  >
                    <div>
                      <div className="text-sm font-bold text-white">
                        {lang === 'id'
                          ? STORE_UPGRADE_META[id].nameId
                          : STORE_UPGRADE_META[id].nameEn}
                      </div>
                      <div className="text-xs text-sky-200/80 mt-1">
                        {lang === 'id'
                          ? STORE_UPGRADE_META[id].descId
                          : STORE_UPGRADE_META[id].descEn}
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={owned || state.money < price}
                      onClick={() => onBuyStoreUpgrade(id)}
                      className="py-2 px-3 rounded-lg bg-sky-500 hover:bg-sky-400 disabled:bg-slate-700 disabled:text-slate-400 text-slate-950 font-bold text-xs cursor-pointer tabular-nums"
                    >
                      {owned
                        ? lang === 'id'
                          ? 'Aktif'
                          : 'Active'
                        : formatMoney(price, lang)}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {tab === 'STAFF' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(Object.keys(GameConfig.STAFF) as StaffId[]).map((id) => {
                const hired = state.staff.includes(id);
                const price = GameConfig.STAFF[id];
                return (
                  <div
                    key={id}
                    className="rounded-xl bg-slate-800/70 border border-white/10 p-4 flex flex-col justify-between gap-3"
                  >
                    <div>
                      <div className="text-sm font-bold text-white">
                        {lang === 'id' ? STAFF_META[id].nameId : STAFF_META[id].nameEn}
                      </div>
                      <div className="text-xs text-sky-200/80 mt-1">
                        {lang === 'id' ? STAFF_META[id].descId : STAFF_META[id].descEn}
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={hired || state.money < price}
                      onClick={() => onHireStaff(id)}
                      className="py-2 px-3 rounded-lg bg-amber-400 hover:bg-amber-300 disabled:bg-slate-700 disabled:text-slate-400 text-slate-950 font-bold text-xs cursor-pointer tabular-nums"
                    >
                      {hired
                        ? lang === 'id'
                          ? 'Bekerja'
                          : 'Hired'
                        : formatMoney(price, lang)}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
