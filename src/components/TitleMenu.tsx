import React, { useEffect, useState } from 'react';
import {
  Award,
  BarChart3,
  BookOpen,
  Info,
  LogOut,
  Play,
  PlusCircle,
  Settings,
  Trash2,
} from 'lucide-react';
import { formatMoney, UI_TEXT } from '../game/strings';
import { GlobalSettings, Language, SaveSlotSummary } from '../game/types';
import { FishPortrait } from './FishPortrait';
import { BodyPart, Fin, Stage } from '../game/types';

interface TitleMenuProps {
  settings: GlobalSettings;
  slots: SaveSlotSummary[];
  mode: 'TITLE' | 'SLOTS';
  onSelectLanguage: (lang: Language) => void;
  onGoToSlots: (intent: 'new' | 'continue') => void;
  onBackToTitle: () => void;
  onStartSlot: (slotIndex: number, isNew: boolean) => void;
  onDeleteSlot: (slotIndex: number) => void;
  onOpenOverlay: (overlay: 'TROPHY' | 'STATS' | 'SETTINGS' | 'HELP' | 'ABOUT') => void;
}

export const TitleMenu: React.FC<TitleMenuProps> = ({
  settings,
  slots,
  mode,
  onSelectLanguage,
  onGoToSlots,
  onBackToTitle,
  onStartSlot,
  onDeleteSlot,
  onOpenOverlay,
}) => {
  const lang = settings.language;
  const [slotIntent, setSlotIntent] = useState<'new' | 'continue'>('continue');
  const [confirmOverwrite, setConfirmOverwrite] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [confirmExit, setConfirmExit] = useState(false);
  const [exitedMessage, setExitedMessage] = useState(false);

  const hasAnySave = slots.some((s) => !s.empty);

  useEffect(() => {
    if (mode !== 'TITLE' || !settings.languageSelected) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const intent = hasAnySave ? 'continue' : 'new';
        setSlotIntent(intent);
        onGoToSlots(intent);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mode, settings.languageSelected, hasAnySave, onGoToSlots]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gradient-to-b from-[#083B5C] via-[#052338] to-[#02121E] flex flex-col justify-between p-6 md:p-10">
      {/* Calm atmospheric underwater light rays */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-45"
        style={{
          background:
            'radial-gradient(ellipse 65% 45% at 72% 18%, rgba(56, 189, 248, 0.24), transparent 70%), radial-gradient(ellipse 40% 50% at 20% 90%, rgba(16, 185, 129, 0.14), transparent 70%)',
        }}
      />

      {/* Showcase fish swimming gently on the right side (leaves 40% calm negative space on left) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-10 top-1/2 -translate-y-1/2 hidden lg:flex flex-col items-end gap-6 opacity-90"
      >
        <div className="translate-x-4">
          <FishPortrait body={BodyPart.KOI} fin={Fin.FAN} stage={Stage.ADULT} isMagic width={230} height={140} />
        </div>
        <div className="-translate-x-14 flex items-center gap-6">
          <FishPortrait body={BodyPart.DISCUS} fin={Fin.LONG} stage={Stage.ADULT} width={160} height={100} />
          <FishPortrait body={BodyPart.ANGELFISH} fin={Fin.SPIKY} stage={Stage.TEEN} width={130} height={85} />
        </div>
      </div>

      {/* Top minimal utility strip */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="text-xs font-medium tracking-wider text-sky-200/75 uppercase">
          {lang === 'id' ? 'Akuarium Tropis Laguna' : 'Laguna Tropical Aquarium'}
        </div>
        {settings.languageSelected && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onSelectLanguage(lang === 'id' ? 'en' : 'id')}
              className="px-3 py-1.5 rounded-lg bg-slate-900/60 hover:bg-slate-800/80 border border-sky-300/20 text-xs font-medium text-sky-100 transition-colors cursor-pointer"
            >
              {lang === 'id' ? 'ID (Rp)' : 'EN ($)'}
            </button>
          </div>
        )}
      </div>

      {/* Main Stage */}
      <div className="relative z-10 my-auto max-w-2xl">
        {!settings.languageSelected ? (
          <div className="bg-slate-900/75 border border-sky-300/20 rounded-2xl p-8 max-w-md shadow-2xl">
            <h1 className="text-3xl font-bold tracking-tight text-white mb-2">LAGUNA FISH</h1>
            <p className="text-sm text-sky-200/80 mb-6">{UI_TEXT.chooseLang[lang]}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => onSelectLanguage('id')}
                className="px-5 py-4 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-left transition-colors cursor-pointer"
              >
                <div className="text-base">Bahasa Indonesia</div>
                <div className="text-xs opacity-80">Mata uang Rupiah (Rp)</div>
              </button>
              <button
                type="button"
                onClick={() => onSelectLanguage('en')}
                className="px-5 py-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-sky-300/25 text-white font-semibold text-left transition-colors cursor-pointer"
              >
                <div className="text-base">English</div>
                <div className="text-xs text-sky-200/75">Currency USD ($)</div>
              </button>
            </div>
          </div>
        ) : mode === 'TITLE' ? (
          <div>
            {/* Custom SVG Emblem + Title Lockup */}
            <div className="flex items-center gap-4 mb-3">
              <svg width="56" height="56" viewBox="0 0 56 56" aria-hidden="true">
                <circle cx="28" cy="28" r="26" fill="#0EA5E9" fillOpacity="0.18" stroke="#38BDF8" strokeWidth="1.8" />
                <path
                  d="M14 28 C20 18, 34 18, 42 28 C34 38, 20 38, 14 28 Z"
                  fill="#F59E0B"
                />
                <path d="M14 28 L7 21 L9 28 L7 35 Z" fill="#38BDF8" />
                <circle cx="35" cy="26" r="2.2" fill="#0F172A" />
              </svg>
              <div>
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white">
                  LAGUNA FISH
                </h1>
                <p className="text-sm md:text-base text-sky-200/85 mt-1">
                  {UI_TEXT.subtitle[lang]}
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              {hasAnySave && (
                <button
                  type="button"
                  data-start="true"
                  onClick={() => {
                    setSlotIntent('continue');
                    onGoToSlots('continue');
                  }}
                  className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-base shadow-lg transition-colors cursor-pointer"
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>{UI_TEXT.continueGame[lang]}</span>
                </button>
              )}

              <button
                type="button"
                data-start={!hasAnySave ? 'true' : undefined}
                onClick={() => {
                  setSlotIntent('new');
                  onGoToSlots('new');
                }}
                className={`inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl font-bold text-base transition-colors cursor-pointer ${
                  hasAnySave
                    ? 'bg-slate-800/85 hover:bg-slate-700/90 border border-sky-300/25 text-white'
                    : 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-lg'
                }`}
              >
                <PlusCircle className="w-5 h-5" />
                <span>{UI_TEXT.newGame[lang]}</span>
              </button>
            </div>

            {/* Secondary small buttons (§3.2) */}
            <div className="mt-7 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onOpenOverlay('TROPHY')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900/65 hover:bg-slate-800/85 border border-white/10 text-xs font-medium text-sky-100 transition-colors cursor-pointer"
              >
                <Award className="w-4 h-4 text-amber-300" />
                <span>{UI_TEXT.trophy[lang]}</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenOverlay('STATS')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900/65 hover:bg-slate-800/85 border border-white/10 text-xs font-medium text-sky-100 transition-colors cursor-pointer"
              >
                <BarChart3 className="w-4 h-4 text-sky-300" />
                <span>{UI_TEXT.stats[lang]}</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenOverlay('SETTINGS')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900/65 hover:bg-slate-800/85 border border-white/10 text-xs font-medium text-sky-100 transition-colors cursor-pointer"
              >
                <Settings className="w-4 h-4 text-slate-300" />
                <span>{UI_TEXT.options[lang]}</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenOverlay('HELP')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900/65 hover:bg-slate-800/85 border border-white/10 text-xs font-medium text-sky-100 transition-colors cursor-pointer"
              >
                <BookOpen className="w-4 h-4 text-emerald-300" />
                <span>{UI_TEXT.help[lang]}</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenOverlay('ABOUT')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900/65 hover:bg-slate-800/85 border border-white/10 text-xs font-medium text-sky-100 transition-colors cursor-pointer"
              >
                <Info className="w-4 h-4 text-sky-300" />
                <span>{UI_TEXT.about[lang]}</span>
              </button>
              <button
                type="button"
                onClick={() => setConfirmExit(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900/65 hover:bg-rose-950/70 border border-white/10 text-xs font-medium text-rose-200 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>{UI_TEXT.exit[lang]}</span>
              </button>
            </div>
          </div>
        ) : (
          /* 4 Save Slots Screen (§3.3) */
          <div className="bg-slate-900/80 border border-sky-300/20 rounded-2xl p-6 max-w-2xl shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-bold text-white">{UI_TEXT.selectSlot[lang]}</h2>
                <p className="text-xs text-sky-200/75 mt-0.5">
                  {slotIntent === 'new'
                    ? lang === 'id'
                      ? 'Pilih slot untuk memulai toko baru'
                      : 'Choose a slot to start a new shop'
                    : lang === 'id'
                      ? 'Pilih toko untuk dilanjutkan'
                      : 'Choose a saved shop to continue'}
                </p>
              </div>
              <button
                type="button"
                onClick={onBackToTitle}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 cursor-pointer"
              >
                {UI_TEXT.back[lang]}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {slots.map((slot) => (
                <div
                  key={slot.slotIndex}
                  className="rounded-xl bg-slate-800/75 border border-white/10 p-4 flex flex-col justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-white">
                        {lang === 'id' ? `Slot Toko ${slot.slotIndex + 1}` : `Shop Slot ${slot.slotIndex + 1}`}
                      </span>
                      {!slot.empty && (
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(slot.slotIndex)}
                          aria-label={`${UI_TEXT.deleteSlot[lang]} Slot ${slot.slotIndex + 1}`}
                          className="p-1.5 rounded-md text-rose-300 hover:bg-rose-500/20 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {slot.empty ? (
                      <p className="text-xs text-slate-400 mt-2">{UI_TEXT.emptySlot[lang]}</p>
                    ) : (
                      <div className="mt-2 space-y-1 text-xs text-sky-100/85 tabular-nums">
                        <div className="text-amber-300 font-semibold text-sm">
                          {formatMoney(slot.money ?? 0, lang)}
                        </div>
                        <div className="text-slate-300">
                          {slot.fishCount} {lang === 'id' ? 'ikan' : 'fish'} · {slot.speciesCount}/30{' '}
                          {lang === 'id' ? 'spesies' : 'species'} · {slot.magicCount}/7{' '}
                          {lang === 'id' ? 'Ajaib' : 'Magic'}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {slot.empty ? (
                      <button
                        type="button"
                        onClick={() => onStartSlot(slot.slotIndex, true)}
                        className="w-full py-2 px-3 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs transition-colors cursor-pointer"
                      >
                        {UI_TEXT.newGame[lang]}
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => onStartSlot(slot.slotIndex, false)}
                          className="flex-1 py-2 px-3 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold text-xs transition-colors cursor-pointer"
                        >
                          {UI_TEXT.continueGame[lang]}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmOverwrite(slot.slotIndex)}
                          className="py-2 px-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-100 font-medium text-xs transition-colors cursor-pointer"
                        >
                          {lang === 'id' ? 'Baru' : 'New'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom control hint line */}
      <div className="relative z-10 text-xs text-sky-200/60">
        {settings.languageSelected && mode === 'TITLE'
          ? lang === 'id'
            ? 'Tekan Enter / Spasi untuk mulai · Progres tersimpan otomatis di perangkat ini'
            : 'Press Enter / Space to start · Progress saves automatically on this device'
          : lang === 'id'
            ? 'Progres tersimpan otomatis di perangkat ini'
            : 'Progress saves automatically on this device'}
      </div>

      {/* Confirm Overwrite */}
      {confirmOverwrite !== null && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/15 rounded-xl p-6 max-w-sm w-full">
            <h3 className="text-base font-bold text-white mb-2">
              {lang === 'id' ? 'Timpa Slot Simpanan?' : 'Overwrite Save Slot?'}
            </h3>
            <p className="text-xs text-slate-300 mb-5">
              {lang === 'id'
                ? `Progres di Slot ${confirmOverwrite + 1} akan diganti dengan toko baru.`
                : `Progress in Slot ${confirmOverwrite + 1} will be replaced with a new shop.`}
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmOverwrite(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 cursor-pointer"
              >
                {UI_TEXT.cancel[lang]}
              </button>
              <button
                type="button"
                onClick={() => {
                  const idx = confirmOverwrite;
                  setConfirmOverwrite(null);
                  onStartSlot(idx, true);
                }}
                className="px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-xs font-bold text-slate-950 cursor-pointer"
              >
                {UI_TEXT.confirm[lang]}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete */}
      {confirmDelete !== null && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/15 rounded-xl p-6 max-w-sm w-full">
            <h3 className="text-base font-bold text-white mb-2">
              {lang === 'id' ? 'Hapus Simpanan?' : 'Delete Save Slot?'}
            </h3>
            <p className="text-xs text-slate-300 mb-5">
              {lang === 'id'
                ? `Data Slot ${confirmDelete + 1} akan dihapus permanen.`
                : `Slot ${confirmDelete + 1} data will be permanently deleted.`}
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 cursor-pointer"
              >
                {UI_TEXT.cancel[lang]}
              </button>
              <button
                type="button"
                onClick={() => {
                  const idx = confirmDelete;
                  setConfirmDelete(null);
                  onDeleteSlot(idx);
                }}
                className="px-4 py-2 rounded-lg bg-rose-500 hover:bg-rose-400 text-xs font-bold text-white cursor-pointer"
              >
                {UI_TEXT.deleteSlot[lang]}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Exit */}
      {confirmExit && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/15 rounded-xl p-6 max-w-sm w-full">
            <h3 className="text-base font-bold text-white mb-2">
              {lang === 'id' ? 'Keluar dari Laguna Fish?' : 'Exit Laguna Fish?'}
            </h3>
            <p className="text-xs text-slate-300 mb-5">
              {exitedMessage
                ? lang === 'id'
                  ? 'Semua progres telah tersimpan. Kamu bisa menutup tab ini atau kembali bermain.'
                  : 'All progress is saved. You may close this tab or return to play.'
                : lang === 'id'
                  ? 'Progres tokomu aman tersimpan. Yakin ingin keluar?'
                  : 'Your shop progress is safely saved. Are you sure you want to exit?'}
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setConfirmExit(false);
                  setExitedMessage(false);
                }}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 cursor-pointer"
              >
                {exitedMessage ? (lang === 'id' ? 'Kembali' : 'Return') : UI_TEXT.cancel[lang]}
              </button>
              {!exitedMessage && (
                <button
                  type="button"
                  onClick={() => setExitedMessage(true)}
                  className="px-4 py-2 rounded-lg bg-rose-500 hover:bg-rose-400 text-xs font-bold text-white cursor-pointer"
                >
                  {UI_TEXT.exit[lang]}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
