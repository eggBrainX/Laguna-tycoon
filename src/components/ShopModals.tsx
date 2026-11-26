import React from 'react';
import { Beaker, Droplets, FlaskConical, Leaf, ShoppingBag, Sparkles, X } from 'lucide-react';
import { GameConfig } from '../game/config';
import {
  formatMoney,
  RESEARCH_META,
  SUPPLY_META,
  TANK_UPGRADE_META,
  UI_TEXT,
} from '../game/strings';
import {
  EggType,
  FeedType,
  GameState,
  Language,
  ResearchPath,
  SupplyItemId,
  TankUpgradeId,
  TimeMode,
} from '../game/types';
import { RoeArtwork } from './RoeArtwork';

interface BaseModalProps {
  lang: Language;
  onClose: () => void;
}

export const EggsModal: React.FC<
  BaseModalProps & {
    state: GameState;
    onSelectEggToDrop: (eggType: EggType) => void;
  }
> = ({ state, lang, onClose, onSelectEggToDrop }) => {
  const envLv = state.research.ENVIRONMENT;
  const eggs: { type: EggType; titleId: string; titleEn: string; descId: string; descEn: string }[] = [
    {
      type: 'COMMON',
      titleId: 'Telur Common (Roe Merah Muda)',
      titleEn: 'Common Roe (Pink)',
      descId: 'Spesies K0 · Peluang mutasi langka 1% · Menetas 2–5 ekor',
      descEn: 'K0 species · 1% rare mutation chance · Hatches 2–5 fry',
    },
    {
      type: 'PREMIUM',
      titleId: 'Telur Premium (Roe Emas)',
      titleEn: 'Premium Roe (Gold)',
      descId: 'Spesies K0–K1 · Peluang mutasi langka 2% · Butuh Riset Environment Lv1',
      descEn: 'K0–K1 species · 2% rare mutation chance · Needs Environment Lv1',
    },
    {
      type: 'EXCLUSIVE',
      titleId: 'Telur Exclusive (Roe Ungu)',
      titleEn: 'Exclusive Roe (Purple)',
      descId: 'Spesies K0–K2 · Peluang mutasi langka 3% · Butuh Riset Environment Lv2',
      descEn: 'K0–K2 species · 3% rare mutation chance · Needs Environment Lv2',
    },
  ];

  return (
    <div className="fixed inset-0 z-40 bg-slate-950/80 flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-slate-900 border border-sky-300/25 rounded-2xl overflow-hidden shadow-2xl">
        <div className="px-5 py-3.5 bg-slate-800/80 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-pink-300" />
            <h2 className="text-lg font-bold text-white">{UI_TEXT.eggs[lang]}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={UI_TEXT.close[lang]}
            className="p-1.5 rounded-lg bg-slate-700/70 hover:bg-slate-600 text-slate-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          {eggs.map((eg) => {
            const cfg = GameConfig.EGGS[eg.type];
            const locked = envLv < cfg.reqEnvLevel;
            const affordable = state.money >= cfg.price;
            return (
              <div
                key={eg.type}
                className="rounded-xl bg-slate-800/70 border border-white/10 p-4 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3.5">
                  <RoeArtwork type={eg.type} size={46} />
                  <div>
                    <div className="text-sm font-bold text-white">
                      {lang === 'id' ? eg.titleId : eg.titleEn}
                    </div>
                    <div className="text-xs text-sky-200/75 mt-0.5">
                      {lang === 'id' ? eg.descId : eg.descEn}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={locked || !affordable}
                  onClick={() => onSelectEggToDrop(eg.type)}
                  className="shrink-0 px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 disabled:bg-slate-700 disabled:text-slate-400 text-slate-950 font-bold text-xs cursor-pointer tabular-nums"
                >
                  {locked
                    ? `Env Lv${cfg.reqEnvLevel}`
                    : `${lang === 'id' ? 'Beli' : 'Buy'} · ${formatMoney(cfg.price, lang)}`}
                </button>
              </div>
            );
          })}
          <p className="text-xs text-slate-400 pt-1">
            {lang === 'id'
              ? 'Catatan: 7 Ikan Ajaib tidak pernah menetas dari telur toko — temukan lewat kawin silang.'
              : 'Note: The 7 Magic Fish never hatch from store roe — discover them through breeding.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export const FeedModal: React.FC<
  BaseModalProps & {
    state: GameState;
    onBuyFeed: (feedType: FeedType) => void;
    onArmFeed: (feedType: FeedType) => void;
  }
> = ({ state, lang, onClose, onBuyFeed, onArmFeed }) => {
  const feeds: { type: FeedType; itemKey: SupplyItemId }[] = [
    { type: 'REGULAR', itemKey: 'FEED_REGULAR' },
    { type: 'PREMIUM', itemKey: 'FEED_PREMIUM' },
  ];

  return (
    <div className="fixed inset-0 z-40 bg-slate-950/80 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-sky-300/25 rounded-2xl overflow-hidden shadow-2xl">
        <div className="px-5 py-3.5 bg-slate-800/80 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Droplets className="w-5 h-5 text-sky-300" />
            <h2 className="text-lg font-bold text-white">{UI_TEXT.feed[lang]}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={UI_TEXT.close[lang]}
            className="p-1.5 rounded-lg bg-slate-700/70 hover:bg-slate-600 text-slate-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          {feeds.map((fd) => {
            const meta = SUPPLY_META[fd.itemKey];
            const stock = state.inventory[fd.itemKey] ?? 0;
            const price = GameConfig.SUPPLIES[fd.itemKey].price;
            return (
              <div
                key={fd.type}
                className="rounded-xl bg-slate-800/70 border border-white/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="text-sm font-bold text-white">
                    {lang === 'id' ? meta.nameId : meta.nameEn}
                    <span className="ml-2 text-xs font-semibold text-sky-300 tabular-nums">
                      ({lang === 'id' ? 'Stok' : 'Stock'}: {stock}/99)
                    </span>
                  </div>
                  <div className="text-xs text-slate-300 mt-0.5">
                    {lang === 'id' ? meta.descId : meta.descEn}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    disabled={stock >= 99 || state.money < price}
                    onClick={() => onBuyFeed(fd.type)}
                    className="px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-45 text-white text-xs font-semibold cursor-pointer tabular-nums"
                  >
                    +1 ({formatMoney(price, lang)})
                  </button>
                  <button
                    type="button"
                    disabled={stock <= 0}
                    onClick={() => onArmFeed(fd.type)}
                    className="px-3.5 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 disabled:bg-slate-700 disabled:text-slate-400 text-slate-950 text-xs font-bold cursor-pointer"
                  >
                    {lang === 'id' ? 'Tebar' : 'Drop'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const SuppliesModal: React.FC<
  BaseModalProps & {
    state: GameState;
    onBuySupply: (item: SupplyItemId) => void;
    onActivateDiscoveryPotion: () => void;
  }
> = ({ state, lang, onClose, onBuySupply, onActivateDiscoveryPotion }) => {
  const items: SupplyItemId[] = [
    'MED_FUNGUS',
    'MED_ICH',
    'VITAMIN',
    'INSTAGROW',
    'INSTABIRTH',
    'DISCOVERY_POTION',
  ];

  return (
    <div className="fixed inset-0 z-40 bg-slate-950/80 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl max-h-[88vh] bg-slate-900 border border-sky-300/25 rounded-2xl flex flex-col overflow-hidden shadow-2xl">
        <div className="px-5 py-3.5 bg-slate-800/80 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-emerald-300" />
            <h2 className="text-lg font-bold text-white">{UI_TEXT.supplies[lang]}</h2>
            <span className="text-xs font-bold text-amber-300 tabular-nums">
              {formatMoney(state.money, lang)}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={UI_TEXT.close[lang]}
            className="p-1.5 rounded-lg bg-slate-700/70 hover:bg-slate-600 text-slate-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto laguna-scroll grid grid-cols-1 sm:grid-cols-2 gap-3">
          {items.map((id) => {
            const meta = SUPPLY_META[id];
            const cfg = GameConfig.SUPPLIES[id];
            const stock = state.inventory[id] ?? 0;
            const affordable = state.money >= cfg.price;
            return (
              <div
                key={id}
                className="rounded-xl bg-slate-800/70 border border-white/10 p-4 flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-white">
                      {lang === 'id' ? meta.nameId : meta.nameEn}
                    </span>
                    <span className="text-xs font-semibold text-emerald-300 tabular-nums">
                      {stock} {lang === 'id' ? 'dosis' : 'doses'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">
                    {lang === 'id' ? meta.descId : meta.descEn}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={!affordable}
                    onClick={() => onBuySupply(id)}
                    className="flex-1 py-2 px-3 rounded-lg bg-amber-400 hover:bg-amber-300 disabled:bg-slate-700 disabled:text-slate-400 text-slate-950 font-bold text-xs cursor-pointer tabular-nums"
                  >
                    {lang === 'id' ? `Beli (+${cfg.doses})` : `Buy (+${cfg.doses})`} ·{' '}
                    {formatMoney(cfg.price, lang)}
                  </button>
                  {id === 'DISCOVERY_POTION' && (
                    <button
                      type="button"
                      disabled={stock <= 0 || state.discoveryPotionActive}
                      onClick={onActivateDiscoveryPotion}
                      className="py-2 px-3 rounded-lg bg-purple-500 hover:bg-purple-400 disabled:bg-slate-700 disabled:text-slate-400 text-white font-bold text-xs cursor-pointer"
                    >
                      {state.discoveryPotionActive
                        ? lang === 'id'
                          ? 'Aktif'
                          : 'Active'
                        : lang === 'id'
                          ? 'Pakai'
                          : 'Use'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const ResearchModal: React.FC<
  BaseModalProps & {
    state: GameState;
    timeMode: TimeMode;
    onStartResearch: (path: ResearchPath) => void;
  }
> = ({ state, timeMode, lang, onClose, onStartResearch }) => {
  const paths: ResearchPath[] = ['FOOD', 'ENVIRONMENT', 'ADVERTISING'];

  return (
    <div className="fixed inset-0 z-40 bg-slate-950/80 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-sky-300/25 rounded-2xl overflow-hidden shadow-2xl">
        <div className="px-5 py-3.5 bg-slate-800/80 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <FlaskConical className="w-5 h-5 text-sky-300" />
            <h2 className="text-lg font-bold text-white">{UI_TEXT.research[lang]}</h2>
            <span className="text-xs font-bold text-amber-300 tabular-nums">
              {formatMoney(state.money, lang)}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={UI_TEXT.close[lang]}
            className="p-1.5 rounded-lg bg-slate-700/70 hover:bg-slate-600 text-slate-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          {state.activeResearch && (
            <div className="rounded-xl bg-sky-500/15 border border-sky-400/35 p-3.5">
              <div className="flex items-center justify-between text-xs font-semibold text-sky-100 mb-1.5">
                <span>
                  {lang === 'id' ? 'Sedang berjalan:' : 'In progress:'}{' '}
                  {lang === 'id'
                    ? RESEARCH_META[state.activeResearch.path].nameId
                    : RESEARCH_META[state.activeResearch.path].nameEn}{' '}
                  Lv{state.activeResearch.targetLevel}
                </span>
                <span className="tabular-nums">
                  {Math.ceil(state.activeResearch.remainingMs / 1000)}s
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-sky-400 transition-all"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round(
                        ((state.activeResearch.totalMs - state.activeResearch.remainingMs) /
                          state.activeResearch.totalMs) *
                          100
                      )
                    )}%`,
                  }}
                />
              </div>
            </div>
          )}

          {paths.map((p) => {
            const lv = state.research[p];
            const meta = RESEARCH_META[p];
            const maxed = lv >= 3;
            const nextCost = maxed ? 0 : GameConfig.RESEARCH_COST[p][lv];
            const nextDurMs = maxed
              ? 0
              : timeMode === 'fast'
                ? GameConfig.RESEARCH_FAST_MS[lv]
                : GameConfig.RESEARCH_REAL_MS[lv];
            const durLabel =
              timeMode === 'fast'
                ? `${Math.round(nextDurMs / 1000)}s`
                : `${Math.round(nextDurMs / 3600_000)}h`;

            return (
              <div
                key={p}
                className="rounded-xl bg-slate-800/70 border border-white/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="text-sm font-bold text-white">
                    {lang === 'id' ? meta.nameId : meta.nameEn}{' '}
                    <span className="text-sky-300 text-xs">(Lv {lv}/3)</span>
                  </div>
                  <div className="mt-1 space-y-0.5 text-xs">
                    {[0, 1, 2].map((idx) => (
                      <div
                        key={idx}
                        className={idx < lv ? 'text-emerald-400' : 'text-slate-400'}
                      >
                        Lv{idx + 1}: {lang === 'id' ? meta.levelsId[idx] : meta.levelsEn[idx]}
                      </div>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  disabled={maxed || Boolean(state.activeResearch) || state.money < nextCost}
                  onClick={() => onStartResearch(p)}
                  className="shrink-0 px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 disabled:bg-slate-700 disabled:text-slate-400 text-slate-950 font-bold text-xs cursor-pointer tabular-nums"
                >
                  {maxed
                    ? 'MAX'
                    : `${lang === 'id' ? 'Riset' : 'Research'} Lv${lv + 1} · ${formatMoney(
                        nextCost,
                        lang
                      )} (${durLabel})`}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const TankUpgradesModal: React.FC<
  BaseModalProps & {
    state: GameState;
    onBuyTankUpgrade: (id: TankUpgradeId) => void;
  }
> = ({ state, lang, onClose, onBuyTankUpgrade }) => {
  const activeTank = state.activeTank;
  const owned = state.tankUpgrades[activeTank] ?? [];
  const allIds = Object.keys(GameConfig.TANK_UPGRADES) as TankUpgradeId[];
  const hardware = allIds.filter((id) => !GameConfig.TANK_UPGRADES[id].isPlant);
  const plants = allIds.filter((id) => GameConfig.TANK_UPGRADES[id].isPlant);

  return (
    <div className="fixed inset-0 z-40 bg-slate-950/80 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl max-h-[88vh] bg-slate-900 border border-sky-300/25 rounded-2xl flex flex-col overflow-hidden shadow-2xl">
        <div className="px-5 py-3.5 bg-slate-800/80 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Beaker className="w-5 h-5 text-teal-300" />
            <h2 className="text-lg font-bold text-white">
              {lang === 'id'
                ? `Upgrade & Tanaman Tank ${activeTank}`
                : `Tank ${activeTank} Upgrades & Plants`}
            </h2>
            <span className="text-xs font-bold text-amber-300 tabular-nums">
              {formatMoney(state.money, lang)}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={UI_TEXT.close[lang]}
            className="p-1.5 rounded-lg bg-slate-700/70 hover:bg-slate-600 text-slate-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto laguna-scroll space-y-5">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-sky-300 mb-2.5">
              {lang === 'id' ? 'Perlengkapan Tank' : 'Tank Equipment'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {hardware.map((id) => {
                const isOwned = owned.includes(id);
                const price = GameConfig.TANK_UPGRADES[id].price;
                const meta = TANK_UPGRADE_META[id];
                return (
                  <div
                    key={id}
                    className="rounded-xl bg-slate-800/70 border border-white/10 p-3.5 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="text-sm font-bold text-white">
                        {lang === 'id' ? meta.nameId : meta.nameEn}
                      </div>
                      <div className="text-xs text-slate-300 mt-0.5">
                        {lang === 'id' ? meta.descId : meta.descEn}
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={isOwned || state.money < price}
                      onClick={() => onBuyTankUpgrade(id)}
                      className="shrink-0 px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 disabled:bg-slate-700 disabled:text-slate-400 text-slate-950 font-bold text-xs cursor-pointer tabular-nums"
                    >
                      {isOwned ? (lang === 'id' ? 'Aktif' : 'Owned') : formatMoney(price, lang)}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-300 mb-2.5 flex items-center gap-1.5">
              <Leaf className="w-4 h-4" />
              <span>{lang === 'id' ? 'Tanaman Laguna' : 'Laguna Aquatic Plants'}</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {plants.map((id) => {
                const isOwned = owned.includes(id);
                const price = GameConfig.TANK_UPGRADES[id].price;
                const meta = TANK_UPGRADE_META[id];
                return (
                  <div
                    key={id}
                    className="rounded-xl bg-slate-800/70 border border-emerald-400/20 p-3.5 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="text-sm font-bold text-white">
                        {lang === 'id' ? meta.nameId : meta.nameEn}
                      </div>
                      <div className="text-xs text-slate-300 mt-0.5">
                        {lang === 'id' ? meta.descId : meta.descEn}
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={isOwned || state.money < price}
                      onClick={() => onBuyTankUpgrade(id)}
                      className="shrink-0 px-3 py-1.5 rounded-lg bg-emerald-400 hover:bg-emerald-300 disabled:bg-slate-700 disabled:text-slate-400 text-slate-950 font-bold text-xs cursor-pointer tabular-nums"
                    >
                      {isOwned ? (lang === 'id' ? 'Tertanam' : 'Planted') : formatMoney(price, lang)}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
