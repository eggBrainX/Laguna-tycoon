import React, { useState } from 'react';
import {
  ArrowRightLeft,
  Award,
  Beaker,
  BookMarked,
  Droplets,
  Egg,
  FlaskConical,
  GitBranch,
  Heart,
  History,
  Home,
  Lock,
  Settings,
  ShieldAlert,
  ShoppingBag,
  Store,
  Tag,
  Trash2,
} from 'lucide-react';
import { GameConfig, makeSpeciesKey } from '../game/config';
import {
  calculateFishPrice,
  getIsolationFishCount,
  getTankFishCount,
} from '../game/rules';
import {
  formatMoney,
  formatSpeciesName,
  HINT_MESSAGES,
  RARITY_COLORS,
  RARITY_NAMES,
  STAGE_NAMES,
  TUTORIAL_STEPS,
  UI_TEXT,
} from '../game/strings';
import {
  Fish,
  GameState,
  GlobalSettings,
  Stage,
} from '../game/types';
import { FishPortrait } from './FishPortrait';
import { PendingDrop, TankCanvas } from './TankCanvas';

export type ActiveModalType =
  | null
  | 'FEED'
  | 'EGGS'
  | 'SUPPLIES'
  | 'RESEARCH'
  | 'TANK_UPGRADES'
  | 'MAGIC'
  | 'FINDEX'
  | 'STORE'
  | 'PEDIGREE'
  | 'LOG'
  | 'SETTINGS'
  | 'STATS'
  | 'HELP'
  | 'ABOUT';

interface TankScreenProps {
  state: GameState;
  settings: GlobalSettings;
  selectedFishIds: string[];
  pendingDrop: PendingDrop;
  activeHintKey: string | null;
  toastMessage: string | null;
  onSelectFish: (fishId: string) => void;
  onClearSelection: () => void;
  onSelectTank: (tank: number) => void;
  onBuyTank: (tank: number) => void;
  onDropAtWater: (xNorm: number, yNorm: number) => void;
  onCancelPendingDrop: () => void;
  onOpenModal: (modal: ActiveModalType) => void;
  onBackToMenu: () => void;
  onQuickBreed: () => void;
  onClassicBreedWithIsolated: (isolatedMotherId: string, tankFatherId: string) => void;
  onToggleForSale: (fishId: string) => void;
  onSetFishMarkup: (fishId: string, markup: number) => void;
  onMoveFishTank: (fishId: string, targetTank: number) => void;
  onToggleIsolation: (fishId: string) => void;
  onUseSupplyOnFish: (
    fishId: string,
    item: 'MED_FUNGUS' | 'MED_ICH' | 'VITAMIN' | 'INSTAGROW' | 'INSTABIRTH'
  ) => void;
  onDiscardFish: (fishId: string) => void;
  onAdvanceTutorial: () => void;
  onSkipTutorial: () => void;
  onDismissHint: () => void;
  onShowToast: (msg: string) => void;
}

export const TankScreen: React.FC<TankScreenProps> = ({
  state,
  settings,
  selectedFishIds,
  pendingDrop,
  activeHintKey,
  toastMessage,
  onSelectFish,
  onClearSelection,
  onSelectTank,
  onBuyTank,
  onDropAtWater,
  onCancelPendingDrop,
  onOpenModal,
  onBackToMenu,
  onQuickBreed,
  onClassicBreedWithIsolated,
  onToggleForSale,
  onSetFishMarkup,
  onMoveFishTank,
  onToggleIsolation,
  onUseSupplyOnFish,
  onDiscardFish,
  onAdvanceTutorial,
  onSkipTutorial,
  onDismissHint,
  onShowToast,
}) => {
  const lang = settings.language;
  const [confirmBuyTank, setConfirmBuyTank] = useState<number | null>(null);
  const [confirmDiscardId, setConfirmDiscardId] = useState<string | null>(null);
  const [showMoveMenu, setShowMoveMenu] = useState(false);

  const activeTankFish = state.fish.filter(
    (f) => !f.inIsolation && f.tank === state.activeTank
  );
  const isolationFish = state.fish.filter((f) => f.inIsolation);
  const primaryFish: Fish | undefined = state.fish.find(
    (f) => f.id === selectedFishIds[selectedFishIds.length - 1]
  );

  // Breeding checks
  const selectedTwo = selectedFishIds
    .map((id) => state.fish.find((f) => f.id === id))
    .filter((f): f is Fish => Boolean(f));
  const canQuickBreed =
    selectedTwo.length === 2 &&
    selectedTwo.every(
      (f) => (f.stage === Stage.ADULT || f.stage === Stage.OLD) && !f.sick
    ) &&
    selectedTwo[0].pregnantRemainingMs === null;

  const isolatedAdult = isolationFish.find(
    (f) =>
      (f.stage === Stage.ADULT || f.stage === Stage.OLD) &&
      !f.sick &&
      f.pregnantRemainingMs === null
  );
  const canClassicMatch =
    Boolean(isolatedAdult) &&
    Boolean(primaryFish) &&
    !primaryFish!.inIsolation &&
    (primaryFish!.stage === Stage.ADULT || primaryFish!.stage === Stage.OLD) &&
    !primaryFish!.sick;

  const price = primaryFish ? calculateFishPrice(primaryFish, state) : 0;
  const primarySpecies = primaryFish
    ? makeSpeciesKey(primaryFish.body, primaryFish.fin)
    : null;
  const primaryMarkup = primaryFish
    ? primaryFish.markup ??
      (primarySpecies ? state.speciesMarkup[primarySpecies] : undefined) ??
      GameConfig.MARKUP_DEFAULT
    : GameConfig.MARKUP_DEFAULT;

  const sellableBlockedReason = primaryFish
    ? primaryFish.isMagic
      ? lang === 'id'
        ? 'Ikan Ajaib tidak bisa dijual'
        : 'Magic Fish cannot be sold'
      : primaryFish.inIsolation
        ? lang === 'id'
          ? 'Keluarkan dari Isolasi dulu'
          : 'Release from Isolation first'
        : primaryFish.sick
          ? lang === 'id'
            ? 'Sembuhkan ikan sakit dulu'
            : 'Cure sick fish first'
          : primaryFish.stage === Stage.BABY || primaryFish.stage === Stage.CHILD
            ? lang === 'id'
              ? 'Hanya Remaja ke atas yang bisa dijual'
              : 'Only Teen+ fish can be sold'
            : null
    : null;

  const doseButtons: {
    id: 'MED_FUNGUS' | 'MED_ICH' | 'VITAMIN' | 'INSTAGROW' | 'INSTABIRTH';
    labelId: string;
    labelEn: string;
  }[] = [
    { id: 'MED_FUNGUS', labelId: 'Obat Jamur', labelEn: 'Fungus Med' },
    { id: 'MED_ICH', labelId: 'Obat Bintik', labelEn: 'Ich Med' },
    { id: 'VITAMIN', labelId: 'Vitamin', labelEn: 'Vitamin' },
    { id: 'INSTAGROW', labelId: 'Instagrow', labelEn: 'Instagrow' },
    { id: 'INSTABIRTH', labelId: 'Instabirth', labelEn: 'Instabirth' },
  ];

  const availableDoses = doseButtons.filter(
    (d) => (state.inventory[d.id] ?? 0) > 0
  );

  return (
    <div className="relative w-full h-screen flex flex-col bg-[#031624] overflow-hidden select-none">
      {/* TOP HUD BAR */}
      <header className="shrink-0 px-3 md:px-5 py-2.5 bg-slate-950/85 border-b border-sky-400/20 flex flex-wrap items-center justify-between gap-2 z-20">
        {/* Left: Home + Money + Active Research */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToMenu}
            aria-label={lang === 'id' ? 'Kembali ke Menu Utama' : 'Back to Main Menu'}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-white/10 text-sky-200 cursor-pointer"
          >
            <Home className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 bg-slate-900/90 border border-amber-400/30 rounded-lg px-3 py-1.5">
            <span className="text-xs text-amber-200/80 font-medium">
              {lang === 'id' ? 'Koin' : 'Coins'}
            </span>
            <span
              data-testid="hud-money"
              className="text-sm md:text-base font-extrabold text-amber-300 tabular-nums"
            >
              {formatMoney(state.money, lang)}
            </span>
          </div>

          {state.activeResearch && (
            <button
              type="button"
              onClick={() => onOpenModal('RESEARCH')}
              className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-sky-500/15 border border-sky-400/30 text-xs text-sky-200 cursor-pointer tabular-nums"
            >
              <FlaskConical className="w-3.5 h-3.5 text-sky-300" />
              <span>
                {state.activeResearch.path} Lv{state.activeResearch.targetLevel} (
                {Math.ceil(state.activeResearch.remainingMs / 1000)}s)
              </span>
            </button>
          )}
        </div>

        {/* Right: Tank 1-4 + Tank Upgrades + Log + Settings */}
        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4].map((tNum) => {
            const owned = state.tanksOwned.includes(tNum);
            const active = state.activeTank === tNum;
            const count = owned ? getTankFishCount(state, tNum) : 0;
            return (
              <button
                key={tNum}
                type="button"
                onClick={() => {
                  if (owned) onSelectTank(tNum);
                  else setConfirmBuyTank(tNum);
                }}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer tabular-nums whitespace-nowrap ${
                  active
                    ? 'bg-sky-500 text-slate-950 shadow'
                    : owned
                      ? 'bg-slate-800/80 hover:bg-slate-700 text-sky-100 border border-white/10'
                      : 'bg-slate-900/70 hover:bg-slate-800 text-slate-400 border border-white/10'
                }`}
              >
                {!owned && <Lock className="w-3 h-3 text-amber-300" />}
                <span>
                  T{tNum}
                  {owned ? ` (${count}/21)` : ''}
                </span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => onOpenModal('TANK_UPGRADES')}
            title={lang === 'id' ? 'Upgrade & Tanaman Tank' : 'Tank Upgrades & Plants'}
            aria-label={lang === 'id' ? 'Upgrade & Tanaman Tank' : 'Tank Upgrades & Plants'}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-white/10 text-xs font-semibold text-teal-200 cursor-pointer whitespace-nowrap"
          >
            <Beaker className="w-3.5 h-3.5" />
            <span className="hidden md:inline">
              {lang === 'id' ? 'Upgrade' : 'Upgrades'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onOpenModal('LOG')}
            aria-label={UI_TEXT.log[lang]}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-white/10 text-slate-200 cursor-pointer"
          >
            <History className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => onOpenModal('SETTINGS')}
            aria-label={UI_TEXT.settings[lang]}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-white/10 text-slate-200 cursor-pointer"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* MAIN AQUARIUM WORKSPACE */}
      <main className="relative flex-1 min-h-0 p-2 md:p-3 flex flex-col gap-2">
        <div className="relative flex-1 min-h-0">
          <TankCanvas
            fishList={activeTankFish}
            selectedFishIds={selectedFishIds}
            tankUpgrades={state.tankUpgrades[state.activeTank] ?? []}
            pendingDrop={pendingDrop}
            lang={lang}
            onSelectFish={onSelectFish}
            onDropAtWater={onDropAtWater}
          />

          {/* Cancel pending drop */}
          {pendingDrop && (
            <button
              type="button"
              onClick={onCancelPendingDrop}
              className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-rose-400/40 text-xs font-semibold text-rose-200 cursor-pointer"
            >
              {UI_TEXT.cancel[lang]}
            </button>
          )}

          {/* Toast Notification */}
          {toastMessage && (
            <div className="pointer-events-none absolute top-12 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-xl bg-slate-900/95 border border-amber-400/45 text-xs font-semibold text-amber-100 shadow-xl">
              {toastMessage}
            </div>
          )}

          {/* Tutorial 4-step opener (§16) */}
          {state.tutorialStep < 4 && (
            <div className="absolute top-3 right-3 z-20 w-72 sm:w-80 bg-slate-900/95 border border-sky-400/45 rounded-xl p-4 shadow-2xl">
              <div className="text-xs font-bold text-sky-300">
                {lang === 'id'
                  ? TUTORIAL_STEPS[state.tutorialStep].titleId
                  : TUTORIAL_STEPS[state.tutorialStep].titleEn}
              </div>
              <p className="text-xs text-slate-200 mt-1.5 leading-relaxed">
                {lang === 'id'
                  ? TUTORIAL_STEPS[state.tutorialStep].bodyId
                  : TUTORIAL_STEPS[state.tutorialStep].bodyEn}
              </p>
              <div className="mt-3 flex items-center justify-between">
                <button
                  type="button"
                  onClick={onSkipTutorial}
                  className="text-[11px] text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  {lang === 'id' ? 'Lewati' : 'Skip'}
                </button>
                <button
                  type="button"
                  onClick={onAdvanceTutorial}
                  className="px-3.5 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold cursor-pointer"
                >
                  {state.tutorialStep === 3
                    ? lang === 'id'
                      ? 'Mulai Main!'
                      : 'Start Playing!'
                    : lang === 'id'
                      ? 'Lanjut'
                      : 'Next'}
                </button>
              </div>
            </div>
          )}

          {/* Contextual Hint (§16) */}
          {state.tutorialStep >= 4 && activeHintKey && HINT_MESSAGES[activeHintKey] && (
            <div className="absolute top-3 right-3 z-20 w-72 sm:w-80 bg-slate-900/95 border border-emerald-400/45 rounded-xl p-4 shadow-2xl">
              <div className="text-xs font-bold text-emerald-300">
                {lang === 'id'
                  ? HINT_MESSAGES[activeHintKey].titleId
                  : HINT_MESSAGES[activeHintKey].titleEn}
              </div>
              <p className="text-xs text-slate-200 mt-1 leading-relaxed">
                {lang === 'id'
                  ? HINT_MESSAGES[activeHintKey].bodyId
                  : HINT_MESSAGES[activeHintKey].bodyEn}
              </p>
              <div className="mt-2.5 flex justify-end">
                <button
                  type="button"
                  onClick={onDismissHint}
                  className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold cursor-pointer"
                >
                  {lang === 'id' ? 'Mengerti' : 'Got it'}
                </button>
              </div>
            </div>
          )}

          {/* Selected Fish Info & Action Bar (§4.1) */}
          {primaryFish && (
            <div className="absolute bottom-2 left-2 right-2 md:left-3 md:right-auto md:max-w-2xl z-20 bg-slate-950/90 border border-sky-400/35 rounded-xl p-3 shadow-2xl">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <FishPortrait
                    body={primaryFish.body}
                    fin={primaryFish.fin}
                    stage={primaryFish.stage}
                    sick={primaryFish.sick}
                    isMagic={primaryFish.isMagic}
                    isPregnant={primaryFish.pregnantRemainingMs !== null}
                    width={62}
                    height={38}
                  />
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm font-bold text-white">
                        {primaryFish.isMagic ? '★ ' : ''}
                        {formatSpeciesName(primaryFish.body, primaryFish.fin, lang)}
                      </span>
                      <span
                        className="text-[11px] font-bold"
                        style={{ color: RARITY_COLORS[primaryFish.rarity].text }}
                      >
                        {RARITY_NAMES[primaryFish.rarity]}
                      </span>
                      <span className="text-[11px] text-slate-300">
                        · {STAGE_NAMES[primaryFish.stage][lang]}
                      </span>
                      {primaryFish.fragile && (
                        <span className="text-[11px] text-rose-300 font-semibold">
                          · {UI_TEXT.fragileHybrid[lang]}
                        </span>
                      )}
                    </div>

                    {/* Fed & Health bars + Price */}
                    <div className="flex flex-wrap items-center gap-3 mt-1 text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400">Fed</span>
                        <div className="w-16 h-2 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full ${primaryFish.fed < 35 ? 'bg-rose-400' : 'bg-amber-400'}`}
                            style={{ width: `${Math.round(primaryFish.fed)}%` }}
                          />
                        </div>
                        <span className="tabular-nums text-slate-200">
                          {Math.round(primaryFish.fed)}%
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400">HP</span>
                        <div className="w-16 h-2 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full ${primaryFish.health < 40 ? 'bg-rose-500' : 'bg-emerald-400'}`}
                            style={{ width: `${Math.round(primaryFish.health)}%` }}
                          />
                        </div>
                        <span className="tabular-nums text-slate-200">
                          {Math.round(primaryFish.health)}%
                        </span>
                      </div>

                      <span className="font-bold text-amber-300 tabular-nums">
                        {price > 0 ? formatMoney(price, lang) : UI_TEXT.tooYoung[lang]}
                      </span>

                      {primaryFish.sick && (
                        <span className="text-rose-400 font-bold">
                          {primaryFish.sick === 'FUNGUS'
                            ? UI_TEXT.sickFungus[lang]
                            : UI_TEXT.sickIch[lang]}
                        </span>
                      )}
                      {primaryFish.pregnantRemainingMs !== null && (
                        <span className="text-amber-300 font-bold">
                          {UI_TEXT.pregnant[lang]} (
                          {Math.ceil(primaryFish.pregnantRemainingMs / 1000)}s)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onClearSelection}
                  className="text-xs text-slate-400 hover:text-white px-2 py-1 cursor-pointer"
                >
                  {UI_TEXT.close[lang]}
                </button>
              </div>

              {/* Action Icons Bar (§4.1) */}
              <div className="mt-2.5 pt-2 border-t border-white/10 flex flex-wrap items-center gap-1.5">
                {/* Markup */}
                <label className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-800 border border-white/10 text-[11px] text-slate-200">
                  <Tag className="w-3 h-3 text-amber-300" />
                  <select
                    aria-label={lang === 'id' ? 'Atur markup ikan' : 'Set fish markup'}
                    value={primaryMarkup}
                    onChange={(e) => onSetFishMarkup(primaryFish.id, Number(e.target.value))}
                    className="bg-transparent text-amber-300 font-bold outline-none tabular-nums cursor-pointer"
                  >
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((m) => (
                      <option key={m} value={m} className="bg-slate-900">
                        +{m}%
                      </option>
                    ))}
                  </select>
                </label>

                {/* Move Tank */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowMoveMenu((v) => !v)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-white/10 text-[11px] font-medium text-sky-100 cursor-pointer"
                  >
                    <ArrowRightLeft className="w-3 h-3" />
                    <span>{lang === 'id' ? 'Pindah' : 'Move'}</span>
                  </button>
                  {showMoveMenu && (
                    <div className="absolute bottom-full left-0 mb-1 bg-slate-900 border border-white/15 rounded-lg p-1 flex gap-1 shadow-xl z-30">
                      {[1, 2, 3, 4].map((tNum) => {
                        const owned = state.tanksOwned.includes(tNum);
                        if (!owned || (!primaryFish.inIsolation && primaryFish.tank === tNum))
                          return null;
                        return (
                          <button
                            key={tNum}
                            type="button"
                            onClick={() => {
                              setShowMoveMenu(false);
                              onMoveFishTank(primaryFish.id, tNum);
                            }}
                            className="px-2 py-1 rounded bg-sky-500 hover:bg-sky-400 text-slate-950 text-[11px] font-bold cursor-pointer"
                          >
                            T{tNum}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Ready for Sale */}
                <button
                  type="button"
                  onClick={() => {
                    if (sellableBlockedReason) {
                      onShowToast(sellableBlockedReason);
                      return;
                    }
                    onToggleForSale(primaryFish.id);
                  }}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded border text-[11px] font-semibold cursor-pointer ${
                    sellableBlockedReason
                      ? 'bg-slate-900 border-white/5 text-slate-500'
                      : primaryFish.forSale
                        ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                        : 'bg-slate-800 hover:bg-slate-700 border-white/10 text-slate-200'
                  }`}
                >
                  <Store className="w-3 h-3" />
                  <span>{UI_TEXT.readyForSale[lang]}</span>
                </button>

                {/* Pedigree */}
                <button
                  type="button"
                  onClick={() => onOpenModal('PEDIGREE')}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-white/10 text-[11px] font-medium text-sky-100 cursor-pointer"
                >
                  <GitBranch className="w-3 h-3" />
                  <span>{lang === 'id' ? 'Silsilah' : 'Pedigree'}</span>
                </button>

                {/* Isolate / Release */}
                <button
                  type="button"
                  onClick={() => onToggleIsolation(primaryFish.id)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-white/10 text-[11px] font-medium text-amber-200 cursor-pointer"
                >
                  <ShieldAlert className="w-3 h-3" />
                  <span>
                    {primaryFish.inIsolation
                      ? lang === 'id'
                        ? 'Lepas'
                        : 'Release'
                      : lang === 'id'
                        ? 'Isolasi'
                        : 'Isolate'}
                  </span>
                </button>

                {/* Classic Matchmaking (Jodohkan) */}
                {isolatedAdult && !primaryFish.inIsolation && (
                  <button
                    type="button"
                    onClick={() => {
                      if (!canClassicMatch) {
                        onShowToast(
                          lang === 'id'
                            ? 'Pilih ikan Dewasa sehat untuk dijodohkan'
                            : 'Select a healthy Adult fish to matchmake'
                        );
                        return;
                      }
                      onClassicBreedWithIsolated(isolatedAdult.id, primaryFish.id);
                    }}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer ${
                      canClassicMatch
                        ? 'bg-pink-500 hover:bg-pink-400 text-white'
                        : 'bg-slate-900 border border-white/5 text-slate-500'
                    }`}
                  >
                    <Heart className="w-3 h-3" />
                    <span>{lang === 'id' ? 'Jodohkan' : 'Match'}</span>
                  </button>
                )}

                {/* Doses available (§12.1) */}
                {availableDoses.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => onUseSupplyOnFish(primaryFish.id, d.id)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/35 border border-emerald-400/40 text-[11px] font-semibold text-emerald-200 cursor-pointer tabular-nums"
                  >
                    <span>
                      {lang === 'id' ? d.labelId : d.labelEn} ({state.inventory[d.id]})
                    </span>
                  </button>
                ))}

                {/* Discard */}
                <button
                  type="button"
                  onClick={() => {
                    if (primaryFish.isMagic) {
                      onShowToast(
                        lang === 'id'
                          ? 'Ikan Ajaib tidak bisa dibuang'
                          : 'Magic Fish cannot be discarded'
                      );
                      return;
                    }
                    setConfirmDiscardId(primaryFish.id);
                  }}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] cursor-pointer ${
                    primaryFish.isMagic
                      ? 'bg-slate-900 text-slate-500 border border-white/5'
                      : 'bg-rose-950/70 hover:bg-rose-900 text-rose-200 border border-rose-500/30'
                  }`}
                >
                  <Trash2 className="w-3 h-3" />
                  <span>{lang === 'id' ? 'Buang' : 'Discard'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM STRIP: ISOLATION TANK (§4.2) + MAIN TOOLBAR (§3.4) */}
        <div className="shrink-0 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2">
          {/* Isolation Tank (capacity 2, always free) */}
          <div className="flex items-center gap-2 bg-slate-900/90 border border-amber-400/25 rounded-xl px-3 py-1.5">
            <div className="text-[11px] font-bold text-amber-200 whitespace-nowrap">
              {UI_TEXT.isolation[lang]} ({getIsolationFishCount(state)}/2)
            </div>
            <div className="flex items-center gap-1.5">
              {isolationFish.length === 0 ? (
                <span className="text-[11px] text-slate-400">
                  {lang === 'id' ? 'Kosong' : 'Empty'}
                </span>
              ) : (
                isolationFish.map((f) => {
                  const sel = selectedFishIds.includes(f.id);
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => onSelectFish(f.id)}
                      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[11px] cursor-pointer ${
                        sel
                          ? 'bg-sky-500/25 border-sky-400 text-white'
                          : 'bg-slate-800/80 border-white/10 text-slate-200 hover:bg-slate-700'
                      }`}
                    >
                      <FishPortrait
                        body={f.body}
                        fin={f.fin}
                        stage={f.stage}
                        sick={f.sick}
                        width={32}
                        height={20}
                      />
                      <span className="font-medium truncate max-w-[90px]">
                        {formatSpeciesName(f.body, f.fin, lang)}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Main 8 Action Buttons */}
          <nav
            aria-label={lang === 'id' ? 'Menu aksi akuarium' : 'Aquarium action bar'}
            className="flex flex-wrap items-center gap-1.5"
          >
            <button
              type="button"
              onClick={() => onOpenModal('FEED')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-white/10 text-xs font-semibold text-sky-100 cursor-pointer whitespace-nowrap"
            >
              <Droplets className="w-4 h-4 text-sky-300" />
              <span>{UI_TEXT.feed[lang]}</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenModal('EGGS')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-white/10 text-xs font-semibold text-pink-100 cursor-pointer whitespace-nowrap"
            >
              <Egg className="w-4 h-4 text-pink-300" />
              <span>{UI_TEXT.eggs[lang]}</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenModal('SUPPLIES')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-white/10 text-xs font-semibold text-emerald-100 cursor-pointer whitespace-nowrap"
            >
              <ShoppingBag className="w-4 h-4 text-emerald-300" />
              <span>{UI_TEXT.supplies[lang]}</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenModal('RESEARCH')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-white/10 text-xs font-semibold text-cyan-100 cursor-pointer whitespace-nowrap"
            >
              <FlaskConical className="w-4 h-4 text-cyan-300" />
              <span>{UI_TEXT.research[lang]}</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenModal('MAGIC')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-amber-400/25 text-xs font-semibold text-amber-200 cursor-pointer whitespace-nowrap"
            >
              <Award className="w-4 h-4 text-amber-300" />
              <span>
                {UI_TEXT.magicFish[lang]} ({Object.keys(state.magicFound).length}/7)
              </span>
            </button>

            <button
              type="button"
              onClick={() => onOpenModal('FINDEX')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-white/10 text-xs font-semibold text-indigo-100 cursor-pointer whitespace-nowrap"
            >
              <BookMarked className="w-4 h-4 text-indigo-300" />
              <span>
                {UI_TEXT.species[lang]} ({Object.keys(state.discovered).length}/30)
              </span>
            </button>

            <button
              type="button"
              onClick={() => onOpenModal('STORE')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold cursor-pointer whitespace-nowrap tabular-nums"
            >
              <Store className="w-4 h-4" />
              <span>
                {UI_TEXT.store[lang]} ({state.buyers.length})
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (!canQuickBreed) {
                  onShowToast(
                    lang === 'id'
                      ? 'Pilih 2 ikan Dewasa sehat untuk dikawinkan'
                      : 'Select 2 healthy Adult fish to breed'
                  );
                  return;
                }
                onQuickBreed();
              }}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer whitespace-nowrap ${
                canQuickBreed
                  ? 'bg-pink-500 hover:bg-pink-400 text-white shadow'
                  : 'bg-slate-800/70 text-slate-400 border border-white/10'
              }`}
            >
              <Heart className="w-4 h-4" />
              <span>{UI_TEXT.breeding[lang]}</span>
            </button>
          </nav>
        </div>
      </main>

      {/* Confirm Buy Tank */}
      {confirmBuyTank !== null && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/15 rounded-xl p-6 max-w-sm w-full">
            <h3 className="text-base font-bold text-white mb-2">
              {lang === 'id' ? `Beli Tank ${confirmBuyTank}?` : `Buy Tank ${confirmBuyTank}?`}
            </h3>
            <p className="text-xs text-slate-300 mb-5 tabular-nums">
              {lang === 'id'
                ? `Harga: ${formatMoney(GameConfig.TANK_PRICES[confirmBuyTank], lang)} (kapasitas 21 ikan)`
                : `Price: ${formatMoney(GameConfig.TANK_PRICES[confirmBuyTank], lang)} (capacity 21 fish)`}
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmBuyTank(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 cursor-pointer"
              >
                {UI_TEXT.cancel[lang]}
              </button>
              <button
                type="button"
                disabled={state.money < GameConfig.TANK_PRICES[confirmBuyTank]}
                onClick={() => {
                  const t = confirmBuyTank;
                  setConfirmBuyTank(null);
                  onBuyTank(t);
                }}
                className="px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 disabled:bg-slate-700 disabled:text-slate-400 text-xs font-bold text-slate-950 cursor-pointer"
              >
                {UI_TEXT.confirm[lang]}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Discard Fish */}
      {confirmDiscardId && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/15 rounded-xl p-6 max-w-sm w-full">
            <h3 className="text-base font-bold text-white mb-2">
              {lang === 'id' ? 'Buang Ikan Ini?' : 'Discard This Fish?'}
            </h3>
            <p className="text-xs text-slate-300 mb-5">
              {lang === 'id'
                ? 'Ikan akan dihapus permanen dari akuarium.'
                : 'This fish will be permanently removed from your aquarium.'}
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDiscardId(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 cursor-pointer"
              >
                {UI_TEXT.cancel[lang]}
              </button>
              <button
                type="button"
                onClick={() => {
                  const id = confirmDiscardId;
                  setConfirmDiscardId(null);
                  onDiscardFish(id);
                }}
                className="px-4 py-2 rounded-lg bg-rose-500 hover:bg-rose-400 text-xs font-bold text-white cursor-pointer"
              >
                {lang === 'id' ? 'Buang' : 'Discard'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
