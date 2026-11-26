import React from 'react';
import {
  Award,
  BarChart3,
  BookOpen,
  GitBranch,
  History,
  Info,
  Settings,
  Sparkles,
  X,
} from 'lucide-react';
import {
  ALL_SPECIES,
  GameConfig,
  MAGIC_FISH_LIST,
  SPECIES_BASE_VALUES,
} from '../game/config';
import { getSpeciesResistanceK, splitSpeciesKey } from '../game/rules';
import { formatMoney, formatSpeciesName, UI_TEXT } from '../game/strings';
import {
  Fish,
  GameState,
  GlobalSettings,
  Language,
  MusicTrack,
  OfflineSummary,
  SpeciesKey,
  Stage,
} from '../game/types';
import { FishPortrait } from './FishPortrait';

interface BaseProps {
  lang: Language;
  onClose: () => void;
}

export const FindexModal: React.FC<
  BaseProps & {
    state: GameState;
    onChangeSpeciesMarkup: (sp: SpeciesKey, markup: number) => void;
  }
> = ({ state, lang, onClose, onChangeSpeciesMarkup }) => {
  const discoveredCount = Object.keys(state.discovered).length;

  return (
    <div className="fixed inset-0 z-40 bg-slate-950/80 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl max-h-[90vh] bg-slate-900 border border-sky-300/25 rounded-2xl flex flex-col overflow-hidden shadow-2xl">
        <div className="px-5 py-3.5 bg-slate-800/80 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">
              Findex — {discoveredCount}/30 {lang === 'id' ? 'Spesies Ditemukan' : 'Species Discovered'}
            </h2>
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

        <div className="p-5 overflow-y-auto laguna-scroll grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {ALL_SPECIES.map((sp) => {
            const entry = state.discovered[sp];
            const { body, fin } = splitSpeciesKey(sp);
            const k = getSpeciesResistanceK(sp);
            const isMagic = MAGIC_FISH_LIST.some((m) => m.species === sp);
            const markup = state.speciesMarkup[sp] ?? GameConfig.MARKUP_DEFAULT;

            if (!entry) {
              return (
                <div
                  key={sp}
                  className="rounded-xl bg-slate-950/65 border border-white/10 p-3 flex flex-col items-center justify-center text-center min-h-[156px]"
                >
                  <FishPortrait body={body} fin={fin} silhouette width={86} height={52} />
                  <div className="mt-2 text-xs font-bold text-slate-500">???</div>
                  <div className="text-[11px] text-slate-600">
                    K{k} {isMagic ? '· ★' : ''}
                  </div>
                </div>
              );
            }

            const parentText =
              entry.parentA && entry.parentB
                ? `${formatSpeciesName(splitSpeciesKey(entry.parentA).body, splitSpeciesKey(entry.parentA).fin, lang)} × ${formatSpeciesName(splitSpeciesKey(entry.parentB).body, splitSpeciesKey(entry.parentB).fin, lang)}`
                : entry.method === 'starter'
                  ? lang === 'id'
                    ? 'Hadiah awal'
                    : 'Starter'
                  : lang === 'id'
                    ? 'Telur toko'
                    : 'Store roe';

            return (
              <div
                key={sp}
                className={`rounded-xl p-3 border flex flex-col justify-between min-h-[156px] ${
                  isMagic
                    ? 'bg-amber-500/10 border-amber-400/40'
                    : 'bg-slate-800/70 border-white/10'
                }`}
              >
                <div className="flex flex-col items-center text-center">
                  <FishPortrait body={body} fin={fin} stage={Stage.ADULT} isMagic={isMagic} width={86} height={52} />
                  <div className="mt-1.5 text-xs font-bold text-white leading-tight">
                    {isMagic ? '★ ' : ''}
                    {formatSpeciesName(body, fin, lang)}
                  </div>
                  <div className="text-[10px] text-sky-200/75 tabular-nums mt-0.5">
                    K{k} · {formatMoney(SPECIES_BASE_VALUES[sp], lang)}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate max-w-full mt-0.5" title={parentText}>
                    {parentText}
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-[11px]">
                  <span className="text-slate-300">Markup</span>
                  <select
                    aria-label={`Markup ${sp}`}
                    value={markup}
                    onChange={(e) => onChangeSpeciesMarkup(sp, Number(e.target.value))}
                    className="bg-slate-900 border border-white/15 rounded px-1.5 py-0.5 text-amber-300 font-semibold tabular-nums"
                  >
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((m) => (
                      <option key={m} value={m}>
                        +{m}%
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const PedigreeModal: React.FC<BaseProps & { fish: Fish }> = ({
  fish,
  lang,
  onClose,
}) => {
  const parentA = fish.parentASpecies ? splitSpeciesKey(fish.parentASpecies) : null;
  const parentB = fish.parentBSpecies ? splitSpeciesKey(fish.parentBSpecies) : null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-sky-300/25 rounded-2xl overflow-hidden shadow-2xl">
        <div className="px-5 py-3.5 bg-slate-800/80 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-sky-300" />
            <h2 className="text-base font-bold text-white">
              {lang === 'id' ? 'Silsilah Ikan' : 'Fish Pedigree'}
            </h2>
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

        <div className="p-5 space-y-4">
          <div className="rounded-xl bg-slate-800/80 border border-sky-400/30 p-4 flex items-center gap-4">
            <FishPortrait body={fish.body} fin={fish.fin} stage={fish.stage} isMagic={fish.isMagic} width={96} height={58} />
            <div>
              <div className="text-sm font-bold text-white">
                {formatSpeciesName(fish.body, fish.fin, lang)}
              </div>
              <div className="text-xs text-sky-300">
                {lang === 'id' ? `Generasi G${fish.generation}` : `Generation G${fish.generation}`}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {lang === 'id' ? 'Lahir:' : 'Born:'} {new Date(fish.bornAt).toLocaleDateString()}
              </div>
            </div>
          </div>

          <div className="text-xs font-semibold text-slate-300">
            {lang === 'id' ? 'Induk (Generasi Atas)' : 'Parents'}
          </div>
          {parentA && parentB ? (
            <div className="grid grid-cols-2 gap-3">
              {[parentA, parentB].map((p, idx) => (
                <div
                  key={idx}
                  className="rounded-xl bg-slate-800/60 border border-white/10 p-3 flex flex-col items-center text-center"
                >
                  <FishPortrait body={p.body} fin={p.fin} stage={Stage.ADULT} width={76} height={46} />
                  <div className="mt-1.5 text-xs font-bold text-white">
                    {formatSpeciesName(p.body, p.fin, lang)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl bg-slate-800/50 border border-white/10 p-4 text-xs text-slate-400 text-center">
              {lang === 'id'
                ? 'Ikan G0 — menetas langsung dari telur.'
                : 'G0 Fish — hatched directly from roe.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const MagicTrophyModal: React.FC<
  BaseProps & {
    magicFound: GameState['magicFound'];
  }
> = ({ magicFound, lang, onClose }) => {
  const foundCount = Object.keys(magicFound).length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl max-h-[90vh] bg-slate-900 border border-amber-400/30 rounded-2xl flex flex-col overflow-hidden shadow-2xl">
        <div className="px-5 py-3.5 bg-slate-800/80 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Award className="w-5 h-5 text-amber-300" />
            <h2 className="text-lg font-bold text-white">
              {lang === 'id'
                ? `7 Ikan Ajaib Laguna (${foundCount}/7)`
                : `7 Magic Laguna Fish (${foundCount}/7)`}
            </h2>
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
          {MAGIC_FISH_LIST.map((m) => {
            const found = magicFound[m.id];
            return (
              <div
                key={m.id}
                className={`rounded-xl p-4 border flex items-center gap-4 ${
                  found
                    ? 'bg-amber-500/12 border-amber-400/45'
                    : 'bg-slate-950/70 border-white/10 opacity-75'
                }`}
              >
                <div className="shrink-0">
                  <FishPortrait
                    body={m.body}
                    fin={m.fin}
                    stage={Stage.ADULT}
                    isMagic={Boolean(found)}
                    silhouette={!found}
                    width={92}
                    height={58}
                  />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-white">
                    {found ? (lang === 'id' ? m.nameId : m.nameEn) : '???'}
                  </div>
                  <div className="text-xs text-amber-200/85 mt-0.5">
                    {found
                      ? lang === 'id'
                        ? m.effectId
                        : m.effectEn
                      : lang === 'id'
                        ? `Kombinasi: ${formatSpeciesName(m.body, m.fin, 'id')}`
                        : `Species: ${formatSpeciesName(m.body, m.fin, 'en')}`}
                  </div>
                  {found && (
                    <div className="text-[11px] text-slate-400 mt-1">
                      {lang === 'id' ? 'Ditemukan:' : 'Discovered:'}{' '}
                      {new Date(found.foundAt).toLocaleDateString()}
                    </div>
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

export const EpilogueModal: React.FC<BaseProps> = ({ lang, onClose }) => (
  <div className="fixed inset-0 z-50 bg-slate-950/90 flex items-center justify-center p-4">
    <div className="w-full max-w-lg bg-gradient-to-b from-slate-900 to-[#062438] border border-amber-400/50 rounded-2xl p-8 text-center shadow-2xl">
      <Sparkles className="w-12 h-12 text-amber-300 mx-auto mb-3" />
      <h2 className="text-2xl font-extrabold text-white">
        {lang === 'id' ? 'Keseimbangan Laguna Pulih!' : 'Laguna Balance Restored!'}
      </h2>
      <p className="text-sm text-sky-100/85 mt-3 leading-relaxed">
        {lang === 'id'
          ? 'Ketujuh Ikan Ajaib Laguna kini berkumpul di bawah naunganmu. Terumbu karang kembali bercahaya dan ekosistem laguna pulih sepenuhnya. Kamu bebas melanjutkan toko ikan hiasmu dalam Mode Bebas!'
          : 'All seven Magic Fish of Laguna now swim under your care. The coral reefs shine once more and Laguna’s ecosystem is fully restored. Continue running your shop in Free Mode!'}
      </p>
      <button
        type="button"
        onClick={onClose}
        className="mt-6 px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm cursor-pointer"
      >
        {lang === 'id' ? 'Lanjutkan Mode Bebas' : 'Continue Free Mode'}
      </button>
    </div>
  </div>
);

export const StatsModal: React.FC<BaseProps & { state: GameState | null }> = ({
  state,
  lang,
  onClose,
}) => {
  const s = state?.stats;
  const avgPrice = s && s.fishSold > 0 ? Math.round(s.totalRevenue / s.fishSold) : 0;
  const hours = s ? (s.playTimeMs / 3600_000).toFixed(2) : '0.00';

  const rows = [
    [lang === 'id' ? 'Ikan Terjual' : 'Fish Sold', s?.fishSold ?? 0],
    [lang === 'id' ? 'Total Pendapatan' : 'Total Revenue', formatMoney(s?.totalRevenue ?? 0, lang)],
    [lang === 'id' ? 'Total Pengeluaran' : 'Total Spent', formatMoney(s?.totalSpent ?? 0, lang)],
    [lang === 'id' ? 'Rata-rata Harga Jual' : 'Avg Sale Price', formatMoney(avgPrice, lang)],
    [
      lang === 'id' ? 'Harga Termahal Terjual' : 'Highest Sale Price',
      formatMoney(s?.highestSalePrice ?? 0, lang),
    ],
    [lang === 'id' ? 'Ikan Disembuhkan' : 'Fish Cured', s?.fishCured ?? 0],
    [lang === 'id' ? 'Ikan Mati' : 'Fish Died', s?.fishDied ?? 0],
    [lang === 'id' ? 'Ikan Dibuang' : 'Fish Discarded', s?.fishDiscarded ?? 0],
    [lang === 'id' ? 'Total Lahir Ternak' : 'Total Bred', s?.fishBred ?? 0],
    [lang === 'id' ? 'Pakan Diberikan' : 'Feed Given', s?.feedGiven ?? 0],
    [lang === 'id' ? 'Jam Bermain' : 'Play Time (hrs)', hours],
    [
      lang === 'id' ? 'Spesies Ditemukan' : 'Species Discovered',
      `${state ? Object.keys(state.discovered).length : 0}/30`,
    ],
    [
      lang === 'id' ? 'Ikan Ajaib Ditemukan' : 'Magic Fish Found',
      `${state ? Object.keys(state.magicFound).length : 0}/7`,
    ],
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-sky-300/25 rounded-2xl overflow-hidden shadow-2xl">
        <div className="px-5 py-3.5 bg-slate-800/80 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-sky-300" />
            <h2 className="text-lg font-bold text-white">{UI_TEXT.stats[lang]}</h2>
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
        <div className="p-5 divide-y divide-white/10">
          {rows.map(([label, val], i) => (
            <div key={i} className="py-2 flex items-center justify-between text-xs">
              <span className="text-slate-300">{label}</span>
              <span className="font-bold text-white tabular-nums">{val}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const SettingsModal: React.FC<
  BaseProps & {
    settings: GlobalSettings;
    onUpdateSettings: (patch: Partial<GlobalSettings>) => void;
  }
> = ({ settings, lang, onClose, onUpdateSettings }) => {
  const tracks: { id: MusicTrack; label: string }[] = [
    { id: 'akuatik', label: 'Akuatik' },
    { id: 'samudra', label: 'Samudra' },
    { id: 'ceria', label: 'Ceria' },
    { id: 'ajaib', label: 'Ajaib' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-sky-300/25 rounded-2xl overflow-hidden shadow-2xl">
        <div className="px-5 py-3.5 bg-slate-800/80 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-sky-300" />
            <h2 className="text-lg font-bold text-white">{UI_TEXT.settings[lang]}</h2>
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

        <div className="p-5 space-y-4 text-xs">
          {/* Language */}
          <div className="flex items-center justify-between">
            <span className="text-slate-200 font-medium">
              {lang === 'id' ? 'Bahasa & Mata Uang' : 'Language & Currency'}
            </span>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => onUpdateSettings({ language: 'id', languageSelected: true })}
                className={`px-3 py-1.5 rounded-lg font-semibold cursor-pointer ${
                  settings.language === 'id'
                    ? 'bg-sky-500 text-slate-950'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                ID (Rp)
              </button>
              <button
                type="button"
                onClick={() => onUpdateSettings({ language: 'en', languageSelected: true })}
                className={`px-3 py-1.5 rounded-lg font-semibold cursor-pointer ${
                  settings.language === 'en'
                    ? 'bg-sky-500 text-slate-950'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                EN ($)
              </button>
            </div>
          </div>

          {/* Time Mode */}
          <div className="flex items-center justify-between">
            <span className="text-slate-200 font-medium">
              {lang === 'id' ? 'Mode Waktu' : 'Time Mode'}
            </span>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => onUpdateSettings({ timeMode: 'fast' })}
                className={`px-3 py-1.5 rounded-lg font-semibold cursor-pointer ${
                  settings.timeMode === 'fast'
                    ? 'bg-amber-400 text-slate-950'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                {UI_TEXT.fastMode[lang]}
              </button>
              <button
                type="button"
                onClick={() => onUpdateSettings({ timeMode: 'real' })}
                className={`px-3 py-1.5 rounded-lg font-semibold cursor-pointer ${
                  settings.timeMode === 'real'
                    ? 'bg-amber-400 text-slate-950'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                {UI_TEXT.realMode[lang]}
              </button>
            </div>
          </div>

          {/* Sound SFX */}
          <div className="flex items-center justify-between">
            <span className="text-slate-200 font-medium">
              {lang === 'id' ? 'Efek Suara' : 'Sound Effects'}
            </span>
            <button
              type="button"
              onClick={() => onUpdateSettings({ soundEnabled: !settings.soundEnabled })}
              className={`px-3.5 py-1.5 rounded-lg font-semibold cursor-pointer ${
                settings.soundEnabled
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {settings.soundEnabled ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Music */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-200 font-medium">
                {lang === 'id' ? 'Musik Latar' : 'Background Music'}
              </span>
              <button
                type="button"
                onClick={() => onUpdateSettings({ musicEnabled: !settings.musicEnabled })}
                className={`px-3.5 py-1.5 rounded-lg font-semibold cursor-pointer ${
                  settings.musicEnabled
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {settings.musicEnabled ? 'ON' : 'OFF'}
              </button>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {tracks.map((tr) => (
                <button
                  key={tr.id}
                  type="button"
                  onClick={() => onUpdateSettings({ musicTrack: tr.id })}
                  className={`py-1.5 rounded-lg font-medium cursor-pointer ${
                    settings.musicTrack === tr.id
                      ? 'bg-sky-500 text-slate-950 font-bold'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {tr.label}
                </button>
              ))}
            </div>
          </div>

          {/* Hints */}
          <div className="flex items-center justify-between">
            <span className="text-slate-200 font-medium">
              {lang === 'id' ? 'Pesan Bantuan Kontekstual' : 'Contextual Hints'}
            </span>
            <button
              type="button"
              onClick={() => onUpdateSettings({ hintsEnabled: !settings.hintsEnabled })}
              className={`px-3.5 py-1.5 rounded-lg font-semibold cursor-pointer ${
                settings.hintsEnabled
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {settings.hintsEnabled ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Notifications */}
          <div className="flex items-center justify-between">
            <span className="text-slate-200 font-medium">
              {lang === 'id' ? 'Notifikasi (Mode Real Time)' : 'Notifications (Real Time)'}
            </span>
            <button
              type="button"
              onClick={() =>
                onUpdateSettings({ notificationsEnabled: !settings.notificationsEnabled })
              }
              className={`px-3.5 py-1.5 rounded-lg font-semibold cursor-pointer ${
                settings.notificationsEnabled
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {settings.notificationsEnabled ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ActivityLogModal: React.FC<
  BaseProps & { entries: GameState['activityLog'] }
> = ({ entries, lang, onClose }) => (
  <div className="fixed inset-0 z-40 bg-slate-950/80 flex items-center justify-center p-4">
    <div className="w-full max-w-lg max-h-[82vh] bg-slate-900 border border-sky-300/25 rounded-2xl flex flex-col overflow-hidden shadow-2xl">
      <div className="px-5 py-3.5 bg-slate-800/80 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-sky-300" />
          <h2 className="text-lg font-bold text-white">
            {lang === 'id' ? 'Log Aktivitas (30 Terakhir)' : 'Activity Log (Last 30)'}
          </h2>
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
      <div className="p-4 overflow-y-auto laguna-scroll space-y-2">
        {entries.map((e) => (
          <div
            key={e.id}
            className="rounded-lg bg-slate-800/60 border border-white/5 px-3 py-2 text-xs flex items-start justify-between gap-3"
          >
            <span className="text-slate-200">{lang === 'id' ? e.messageId : e.messageEn}</span>
            <span className="text-[10px] text-slate-400 shrink-0 tabular-nums">
              {new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const HelpModal: React.FC<BaseProps> = ({ lang, onClose }) => (
  <div className="fixed inset-0 z-50 bg-slate-950/80 flex items-center justify-center p-4">
    <div className="w-full max-w-lg bg-slate-900 border border-sky-300/25 rounded-2xl overflow-hidden shadow-2xl">
      <div className="px-5 py-3.5 bg-slate-800/80 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-emerald-300" />
          <h2 className="text-lg font-bold text-white">{UI_TEXT.help[lang]}</h2>
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
      <div className="p-5 space-y-3 text-xs text-slate-200 leading-relaxed">
        <p>
          <strong>{lang === 'id' ? 'Tujuan:' : 'Goal:'}</strong>{' '}
          {lang === 'id'
            ? 'Kelola toko ikan hias tropis, temukan 30 spesies di Findex lewat kawin silang, dan kumpulkan 7 Ikan Ajaib Laguna.'
            : 'Run your tropical fish shop, discover all 30 species in Findex via breeding, and collect all 7 Magic Laguna Fish.'}
        </p>
        <p>
          <strong>{lang === 'id' ? 'Kontrol:' : 'Controls:'}</strong>{' '}
          {lang === 'id'
            ? 'Ketuk ikan di tank untuk melihat info & aksi (maks 2 ikan untuk kawin). Ketuk air saat menebar telur atau pakan.'
            : 'Click fish in the tank for details & actions (up to 2 fish for breeding). Click water to drop roe or feed.'}
        </p>
        <p>
          <strong>{lang === 'id' ? 'Tips Cepat:' : 'Quick Tips:'}</strong>{' '}
          {lang === 'id'
            ? 'Tandai ikan Remaja+ sebagai Siap Jual lalu buka Toko untuk bernegosiasi. Tingkatkan Riset Environment sebelum membiakkan spesies bernilai tinggi agar tidak menjadi Hibrida Rapuh.'
            : 'Mark Teen+ fish For Sale and open the Store to negotiate. Upgrade Environment Research before breeding high-value species so they do not become Fragile Hybrids.'}
        </p>
      </div>
    </div>
  </div>
);

export const AboutModal: React.FC<BaseProps> = ({ lang, onClose }) => (
  <div className="fixed inset-0 z-50 bg-slate-950/80 flex items-center justify-center p-4">
    <div className="w-full max-w-md bg-slate-900 border border-sky-300/25 rounded-2xl overflow-hidden shadow-2xl">
      <div className="px-5 py-3.5 bg-slate-800/80 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Info className="w-5 h-5 text-sky-300" />
          <h2 className="text-lg font-bold text-white">{UI_TEXT.about[lang]}</h2>
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
      <div className="p-5 space-y-2.5 text-xs text-slate-300 leading-relaxed">
        <div className="text-base font-bold text-white">Laguna Fish</div>
        <p>
          {lang === 'id'
            ? 'Simulasi akuarium tropis dan toko ikan hias lokal bergaya semi-realistis. Seluruh progres tersimpan aman secara lokal.'
            : 'Semi-realistic tropical aquarium and ornamental fish shop simulation. All progress saves locally.'}
        </p>
        <p className="text-slate-400">
          {lang === 'id' ? 'Dukungan:' : 'Support:'} support@lagunafish.local
        </p>
      </div>
    </div>
  </div>
);

export const OfflineSummaryModal: React.FC<
  BaseProps & { summary: OfflineSummary }
> = ({ summary, lang, onClose }) => {
  const mins = Math.round(summary.elapsedMs / 60_000);
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-sky-300/30 rounded-2xl p-6 shadow-2xl">
        <h2 className="text-lg font-bold text-white mb-1">
          {lang === 'id' ? 'Selama Kamu Pergi' : 'While You Were Away'}
        </h2>
        <p className="text-xs text-sky-200/80 mb-4">
          {lang === 'id' ? `Waktu berlalu: ${mins} menit` : `Time elapsed: ${mins} minutes`}
        </p>
        <div className="space-y-2 text-xs bg-slate-800/60 rounded-xl p-4 border border-white/10">
          <div className="flex justify-between">
            <span className="text-slate-300">{lang === 'id' ? 'Ikan tumbuh fase' : 'Fish grew'}</span>
            <span className="font-bold text-emerald-300 tabular-nums">{summary.fishGrown}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-300">{lang === 'id' ? 'Bayi lahir' : 'Fry born'}</span>
            <span className="font-bold text-sky-300 tabular-nums">{summary.fishBorn}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-300">{lang === 'id' ? 'Ikan sakit' : 'Fish got sick'}</span>
            <span className="font-bold text-amber-300 tabular-nums">{summary.fishSick}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-300">{lang === 'id' ? 'Ikan mati' : 'Fish died'}</span>
            <span className="font-bold text-rose-400 tabular-nums">{summary.fishDied}</span>
          </div>
          {summary.researchCompleted && (
            <div className="pt-1 text-emerald-400 font-semibold">
              {lang === 'id' ? 'Riset selesai:' : 'Research completed:'} {summary.researchCompleted}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs cursor-pointer"
        >
          {lang === 'id' ? 'Kembali ke Akuarium' : 'Return to Aquarium'}
        </button>
      </div>
    </div>
  );
};
