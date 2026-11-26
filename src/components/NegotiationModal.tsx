import React from 'react';
import { Heart, TrendingDown, TrendingUp, Check, X } from 'lucide-react';
import { splitSpeciesKey } from '../game/rules';
import {
  formatMoney,
  formatSpeciesName,
  RARITY_COLORS,
  RARITY_NAMES,
  STAGE_NAMES,
} from '../game/strings';
import { Fish, Language, NegotiationState } from '../game/types';
import { BuyerArtwork } from './BuyerArtwork';
import { FishPortrait } from './FishPortrait';

interface NegotiationModalProps {
  neg: NegotiationState;
  fish: Fish | undefined;
  lang: Language;
  onAction: (action: 'OFFER' | 'ACCEPT_COUNTER' | 'LOWER_2' | 'RAISE_1') => void;
  onClose: () => void;
}

const DIALOGUE_MAP: Record<string, { id: string; en: string }> = {
  greeting: {
    id: 'Wah, ikannya cantik! Berapa harganya?',
    en: 'Wow, what a lovely fish! How much are you asking?',
  },
  good_price: {
    id: 'Wah, harga bagus nih! Saya berminat.',
    en: 'Oh, great price! I am really interested.',
  },
  very_expensive: {
    id: 'Mahal banget! Bisa kurang nggak?',
    en: 'Way too expensive! Can you lower the price?',
  },
  rare_interest: {
    id: 'Ikan apa ini, unik banget! Boleh lihat lebih dekat?',
    en: 'What an unusual, rare fish! Let me take a closer look.',
  },
  counter_offer: {
    id: 'Bang, murahin dong… gimana kalau segini aja?',
    en: 'Can you lower it a bit? How about this offer?',
  },
  deal: {
    id: 'Oke, DEAL! Aku beli ikan ini!',
    en: 'Okay, DEAL! I will buy this fish!',
  },
  walked_away: {
    id: 'Wah kemahalan, maaf saya cari di tempat lain dulu ya.',
    en: 'Too pricey for me, sorry I will look elsewhere.',
  },
  no_fish: {
    id: 'Lho, ikannya sudah tidak ada?',
    en: 'Oh, the fish is no longer available?',
  },
};

const TRAIT_LABELS: Record<string, { id: string; en: string }> = {
  HEMAT: { id: 'Hemat', en: 'Frugal' },
  KOLEKTOR: { id: 'Kolektor', en: 'Collector' },
  ANAK_KECIL: { id: 'Anak Kecil', en: 'Kid' },
  PENGHOBI: { id: 'Penghobi', en: 'Hobbyist' },
  BURU_BURU: { id: 'Buru-buru', en: 'Impatient' },
};

export const NegotiationModal: React.FC<NegotiationModalProps> = ({
  neg,
  fish,
  lang,
  onAction,
  onClose,
}) => {
  const dialogue = DIALOGUE_MAP[neg.dialogueKey]?.[lang] ?? DIALOGUE_MAP.greeting[lang];
  const traitLabel = TRAIT_LABELS[neg.buyer.trait]?.[lang] ?? neg.buyer.trait;
  const targetParts = neg.buyer.targetSpecies ? splitSpeciesKey(neg.buyer.targetSpecies) : null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-slate-900 border border-sky-300/25 rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-slate-800/80 border-b border-white/10">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-white">
              {lang === 'id' ? 'Negosiasi Penjualan' : 'Sales Negotiation'}
            </h2>
            <span className="text-xs text-sky-200/80">
              {neg.buyer.name} · {traitLabel} · {lang === 'id' ? `Ronde ${neg.round}` : `Round ${neg.round}`}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div
              className="flex items-center gap-1"
              aria-label={`${lang === 'id' ? 'Kesabaran' : 'Patience'}: ${neg.patience}/${neg.maxPatience}`}
            >
              {Array.from({ length: neg.maxPatience }).map((_, i) => (
                <Heart
                  key={i}
                  className={`w-4 h-4 ${
                    i < neg.patience ? 'text-rose-400 fill-rose-400' : 'text-slate-600'
                  }`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={lang === 'id' ? 'Tutup negosiasi' : 'Close negotiation'}
              className="p-1.5 rounded-lg bg-slate-700/70 hover:bg-slate-600 text-slate-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Face-to-Face Scene */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-gradient-to-b from-[#0A2E46] to-[#061A29]">
          {/* Left: Indonesian Buyer + Speech Bubble */}
          <div className="flex flex-col items-center justify-between gap-3">
            <div className="relative bg-white text-slate-900 rounded-2xl px-4 py-3 shadow-lg w-full">
              <p className="text-sm font-semibold leading-snug">{dialogue}</p>
              {neg.counterOffer !== null && neg.status === 'ACTIVE' && (
                <p className="mt-1.5 text-xs font-bold text-amber-700 tabular-nums">
                  {lang === 'id' ? 'Tawaran pembeli: ' : 'Buyer offers: '}
                  {formatMoney(neg.counterOffer, lang)}
                </p>
              )}
              {targetParts && (
                <div className="mt-2 pt-2 border-t border-slate-200 flex items-center gap-2 text-xs text-slate-600">
                  <span>{lang === 'id' ? 'Cari:' : 'Seeking:'}</span>
                  <FishPortrait body={targetParts.body} fin={targetParts.fin} silhouette width={46} height={28} />
                  <span className="font-medium">
                    {formatSpeciesName(targetParts.body, targetParts.fin, lang)}
                  </span>
                </div>
              )}
            </div>
            <BuyerArtwork outfit={neg.buyer.outfit} size={145} />
          </div>

          {/* Right: Display Aquarium + Fish Price Tag */}
          <div className="flex flex-col justify-between bg-slate-950/60 border border-sky-400/25 rounded-2xl p-4">
            <div className="flex items-center justify-between text-xs text-sky-200/80 mb-2">
              <span>{lang === 'id' ? 'Akuarium Pajangan' : 'Display Aquarium'}</span>
              {fish && (
                <span style={{ color: RARITY_COLORS[fish.rarity].text }} className="font-semibold">
                  {RARITY_NAMES[fish.rarity]} · {STAGE_NAMES[fish.stage][lang]}
                </span>
              )}
            </div>

            <div className="my-auto py-4 flex flex-col items-center justify-center rounded-xl bg-gradient-to-b from-sky-900/50 to-slate-900/70 border border-sky-300/15">
              {fish ? (
                <>
                  <FishPortrait
                    body={fish.body}
                    fin={fish.fin}
                    stage={fish.stage}
                    width={165}
                    height={100}
                  />
                  <div className="mt-2 text-sm font-bold text-white">
                    {formatSpeciesName(fish.body, fish.fin, lang)}
                  </div>
                </>
              ) : (
                <div className="text-xs text-slate-400">—</div>
              )}
            </div>

            <div className="mt-4 space-y-1.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 text-xs">
                  {lang === 'id' ? 'Harga Minta Kamu' : 'Your Asking Price'}
                </span>
                <span className="text-lg font-extrabold text-amber-300 tabular-nums">
                  {formatMoney(neg.askingPrice, lang)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>{lang === 'id' ? 'Harga Wajar' : 'Fair Value'}</span>
                <span className="tabular-nums">{formatMoney(neg.fairPrice, lang)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="px-6 py-4 bg-slate-900 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
          {neg.status === 'ACTIVE' ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => onAction('LOWER_2')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-white/10 text-xs font-semibold text-sky-200 cursor-pointer"
                >
                  <TrendingDown className="w-4 h-4" />
                  <span>{lang === 'id' ? 'Turun 2%' : 'Lower 2%'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onAction('RAISE_1')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-white/10 text-xs font-semibold text-amber-200 cursor-pointer"
                >
                  <TrendingUp className="w-4 h-4" />
                  <span>{lang === 'id' ? 'Naik 1%' : 'Raise 1%'}</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {neg.counterOffer !== null && (
                  <button
                    type="button"
                    onClick={() => onAction('ACCEPT_COUNTER')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>
                      {lang === 'id' ? 'Terima ' : 'Accept '}
                      {formatMoney(neg.counterOffer, lang)}
                    </span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onAction('OFFER')}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold cursor-pointer"
                >
                  <span>
                    {neg.counterOffer !== null
                      ? lang === 'id'
                        ? 'Tahan Harga'
                        : 'Hold Price'
                      : lang === 'id'
                        ? 'Tawarkan Harga'
                        : 'Offer Price'}
                  </span>
                </button>
              </div>
            </>
          ) : (
            <div className="w-full flex items-center justify-between">
              <div className="text-sm font-bold">
                {neg.status === 'DEAL' ? (
                  <span className="text-emerald-400">
                    {lang === 'id'
                      ? `DEAL! Pendapatan masuk: ${formatMoney(neg.finalRevenue ?? neg.askingPrice, lang)}`
                      : `DEAL! Earned: ${formatMoney(neg.finalRevenue ?? neg.askingPrice, lang)}`}
                  </span>
                ) : (
                  <span className="text-rose-400">
                    {lang === 'id' ? 'Pembeli pergi tanpa membeli.' : 'Buyer left without buying.'}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold cursor-pointer"
              >
                {lang === 'id' ? 'Selesai' : 'Done'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
