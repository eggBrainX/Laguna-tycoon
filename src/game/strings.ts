import { GameConfig } from './config';
import {
  BodyPart,
  DecorId,
  Fin,
  Language,
  Rarity,
  ResearchPath,
  Stage,
  StaffId,
  StoreUpgradeId,
  SupplyItemId,
  TankUpgradeId,
} from './types';

export function formatMoney(rp: number, lang: Language): string {
  if (lang === 'en') {
    const usd = rp / GameConfig.USD_RATE;
    return `$${usd.toLocaleString('en-US', {
      minimumFractionDigits: usd >= 100 ? 0 : 2,
      maximumFractionDigits: 2,
    })}`;
  }
  return `Rp${Math.round(rp).toLocaleString('id-ID')}`;
}

export const BODY_NAMES: Record<BodyPart, { id: string; en: string }> = {
  [BodyPart.DISCUS]: { id: 'Discus', en: 'Discus' },
  [BodyPart.TETRA]: { id: 'Tetra', en: 'Tetra' },
  [BodyPart.ANGELFISH]: { id: 'Angelfish', en: 'Angelfish' },
  [BodyPart.GUPPY]: { id: 'Guppy', en: 'Guppy' },
  [BodyPart.KOI]: { id: 'Koi', en: 'Koi' },
  [BodyPart.BETTA]: { id: 'Betta', en: 'Betta' },
};

export const FIN_NAMES: Record<Fin, { id: string; en: string }> = {
  [Fin.ROUND]: { id: 'Bulat', en: 'Round' },
  [Fin.FAN]: { id: 'Kipas', en: 'Fan' },
  [Fin.SPIKY]: { id: 'Duri', en: 'Spiky' },
  [Fin.LONG]: { id: 'Panjang', en: 'Long' },
  [Fin.TWIN]: { id: 'Ganda', en: 'Twin' },
};

export function formatSpeciesName(body: BodyPart, fin: Fin, lang: Language): string {
  if (lang === 'en') {
    return `${FIN_NAMES[fin].en} ${BODY_NAMES[body].en}`;
  }
  return `${BODY_NAMES[body].id} ${FIN_NAMES[fin].id}`;
}

export const STAGE_NAMES: Record<Stage, { id: string; en: string }> = {
  [Stage.BABY]: { id: 'Bayi', en: 'Baby' },
  [Stage.CHILD]: { id: 'Anak-anak', en: 'Child' },
  [Stage.TEEN]: { id: 'Remaja', en: 'Teen' },
  [Stage.ADULT]: { id: 'Dewasa', en: 'Adult' },
  [Stage.OLD]: { id: 'Tua', en: 'Old' },
};

export const RARITY_NAMES: Record<Rarity, string> = {
  [Rarity.COMMON]: 'Common',
  [Rarity.UNCOMMON]: 'Uncommon',
  [Rarity.RARE]: 'Rare',
  [Rarity.EPIC]: 'Epic',
  [Rarity.LEGEND]: 'Legend',
  [Rarity.MYTHIC]: 'Mythic',
  [Rarity.HOLY]: 'Holy',
};

export const RARITY_COLORS: Record<Rarity, { text: string; bg: string; border: string }> = {
  [Rarity.COMMON]: { text: '#E2E8F0', bg: 'rgba(100,116,139,0.35)', border: 'rgba(148,163,184,0.4)' },
  [Rarity.UNCOMMON]: { text: '#86EFAC', bg: 'rgba(22,163,74,0.28)', border: 'rgba(74,222,128,0.45)' },
  [Rarity.RARE]: { text: '#7DD3FC', bg: 'rgba(2,132,199,0.32)', border: 'rgba(56,189,248,0.5)' },
  [Rarity.EPIC]: { text: '#D8B4FE', bg: 'rgba(147,51,234,0.32)', border: 'rgba(192,132,252,0.5)' },
  [Rarity.LEGEND]: { text: '#FDE047', bg: 'rgba(202,138,4,0.34)', border: 'rgba(250,204,21,0.55)' },
  [Rarity.MYTHIC]: { text: '#FDA4AF', bg: 'rgba(225,29,72,0.34)', border: 'rgba(251,113,133,0.55)' },
  [Rarity.HOLY]: { text: '#FEF9C3', bg: 'rgba(245,158,11,0.42)', border: 'rgba(253,224,71,0.8)' },
};

export const SUPPLY_META: Record<
  SupplyItemId,
  { nameId: string; nameEn: string; descId: string; descEn: string }
> = {
  MED_FUNGUS: {
    nameId: 'Obat Jamur',
    nameEn: 'Fungus Medicine',
    descId: 'Menyembuhkan bercak hijau berbulu (3 dosis)',
    descEn: 'Cures fuzzy green fungus spots (3 doses)',
  },
  MED_ICH: {
    nameId: 'Obat Bintik Putih',
    nameEn: 'Ich Medicine',
    descId: 'Menyembuhkan bintik putih di sirip (3 dosis)',
    descEn: 'Cures white spots on fins (3 doses)',
  },
  VITAMIN: {
    nameId: 'Vitamin',
    nameEn: 'Vitamin',
    descId: 'Health +40 & Fed +20 ikan terpilih (3 dosis)',
    descEn: 'Health +40 & Fed +20 for selected fish (3 doses)',
  },
  INSTAGROW: {
    nameId: 'Instagrow',
    nameEn: 'Instagrow',
    descId: 'Maju 1 fase tumbuh penuh (3 dosis)',
    descEn: 'Advance 1 full growth stage (3 doses)',
  },
  INSTABIRTH: {
    nameId: 'Instabirth',
    nameEn: 'Instabirth',
    descId: 'Ikan hamil langsung melahirkan (1 dosis)',
    descEn: 'Pregnant fish gives birth immediately (1 dose)',
  },
  DISCOVERY_POTION: {
    nameId: 'Discovery Potion',
    nameEn: 'Discovery Potion',
    descId: 'Breeding berikutnya dijamin spesies baru / Rare+ (1 dosis)',
    descEn: 'Next breeding guarantees new species / Rare+ (1 dose)',
  },
  FEED_REGULAR: {
    nameId: 'Pakan Biasa',
    nameEn: 'Regular Feed',
    descId: 'Fed +50% semua ikan di tank (+isolasi)',
    descEn: 'Fed +50% all fish in tank (+isolation)',
  },
  FEED_PREMIUM: {
    nameId: 'Pakan Premium',
    nameEn: 'Premium Feed',
    descId: 'Fed +100% & Health +10 semua ikan di tank',
    descEn: 'Fed +100% & Health +10 all fish in tank',
  },
};

export const TANK_UPGRADE_META: Record<
  TankUpgradeId,
  { nameId: string; nameEn: string; descId: string; descEn: string }
> = {
  CLEANING_SNAIL: {
    nameId: 'Siput Pembersih',
    nameEn: 'Cleaning Snail',
    descId: 'Peluang sakit −10%',
    descEn: 'Sickness chance −10%',
  },
  TEMP_REGULATOR: {
    nameId: 'Pengatur Suhu',
    nameEn: 'Temperature Regulator',
    descId: 'Pemulihan Health +25%',
    descEn: 'Health recovery +25%',
  },
  AERATION: {
    nameId: 'Aerasi Oksigen',
    nameEn: 'Aeration',
    descId: 'Health turun −25% lebih lambat saat lapar/rapuh',
    descEn: 'Health drops 25% slower when hungry/fragile',
  },
  AUTO_FEEDER: {
    nameId: 'Auto-Feeder',
    nameEn: 'Auto-Feeder',
    descId: 'Otomatis beri 1 Pakan Biasa dari stok saat rata-rata Fed < 40%',
    descEn: 'Auto-drops 1 Regular Feed from stock when avg Fed < 40%',
  },
  POWER_FILTER: {
    nameId: 'Power Filter',
    nameEn: 'Power Filter',
    descId: 'Peluang sakit −20% & penularan −50%',
    descEn: 'Sickness chance −20% & contagion −50%',
  },
  GOLDEN_SEAHORSE: {
    nameId: 'Golden Seahorse',
    nameEn: 'Golden Seahorse',
    descId: 'Harga jual ikan dari tank ini +5%',
    descEn: 'Sell price +5% for fish in this tank',
  },
  PLANT_NUTRITION: {
    nameId: 'Tanaman Nutrisi',
    nameEn: 'Nutrition Plant',
    descId: 'Fed turun −25% lebih lambat',
    descEn: 'Hunger drops 25% slower',
  },
  PLANT_INCUBATION: {
    nameId: 'Tanaman Inkubasi',
    nameEn: 'Incubation Plant',
    descId: 'Bayi mati karena air −50%; telur menetas minimal 3',
    descEn: 'Water-stress baby death −50%; eggs hatch at least 3',
  },
  PLANT_MEDICINE: {
    nameId: 'Tanaman Obat',
    nameEn: 'Medicinal Plant',
    descId: 'Peluang sakit −30%',
    descEn: 'Sickness chance −30%',
  },
  PLANT_FERTILE: {
    nameId: 'Tanaman Subur',
    nameEn: 'Fertility Plant',
    descId: 'Peluang hamil 30% → 40%; +1 bayi saat lahir',
    descEn: 'Pregnancy chance 30% → 40%; +1 baby at birth',
  },
};

export const DECOR_META: Record<DecorId, { nameId: string; nameEn: string }> = {
  ROCK: { nameId: 'Batu Alam', nameEn: 'Natural Rock' },
  SHELL: { nameId: 'Kerang Mutiara', nameEn: 'Pearl Shell' },
  CORAL: { nameId: 'Terumbu Koral', nameEn: 'Coral Reef' },
  ANCHOR: { nameId: 'Jangkar Tua', nameEn: 'Old Anchor' },
  PAGODA: { nameId: 'Pagoda Mini', nameEn: 'Mini Pagoda' },
  DIVER: { nameId: 'Patung Penyelam', nameEn: 'Diver Figurine' },
  PILLAR: { nameId: 'Pilar Tenggelam', nameEn: 'Sunken Pillar' },
  LANTERN: { nameId: 'Lentera Batu', nameEn: 'Stone Lantern' },
  SHIPWRECK: { nameId: 'Kapal Karam', nameEn: 'Sunken Ship' },
};

export const STORE_UPGRADE_META: Record<
  StoreUpgradeId,
  { nameId: string; nameEn: string; descId: string; descEn: string }
> = {
  MERCH_RACK: {
    nameId: 'Rak Merchandise',
    nameEn: 'Merchandise Rack',
    descId: 'Pendapatan jual +3% · Popularitas +5',
    descEn: 'Sale revenue +3% · Popularity +5',
  },
  SIGNBOARD: {
    nameId: 'Papan Nama Toko',
    nameEn: 'Shop Signboard',
    descId: 'Antrean pembeli maks 4 · Popularitas +5',
    descEn: 'Max buyer queue 4 · Popularity +5',
  },
  SEATING_AREA: {
    nameId: 'Area Duduk Nyaman',
    nameEn: 'Seating Area',
    descId: 'Kesabaran pembeli +1 · Popularitas +5',
    descEn: 'Buyer patience +1 · Popularity +5',
  },
  PILLAR_TERRAIN: {
    nameId: 'Pilar & Terrain Etalase',
    nameEn: 'Display Pillar & Terrain',
    descId: 'Peluang DEAL +5% · Popularitas +5',
    descEn: 'DEAL chance +5% · Popularity +5',
  },
};

export const STAFF_META: Record<
  StaffId,
  { nameId: string; nameEn: string; descId: string; descEn: string }
> = {
  SINTA: {
    nameId: 'Sales Sinta',
    nameEn: 'Salesperson Sinta',
    descId: 'Peluang DEAL +5% · Popularitas +5',
    descEn: 'DEAL chance +5% · Popularity +5',
  },
  MAYA: {
    nameId: 'Perawat Ikan Dr. Maya',
    nameEn: 'Fish Vet Dr. Maya',
    descId: 'Peluang sakit seluruh ikan separuhnya (×0,5)',
    descEn: 'Halves sickness chance for all fish (×0.5)',
  },
  BAMBANG: {
    nameId: 'Kasir Bambang',
    nameEn: 'Cashier Bambang',
    descId: 'Pendapatan setelah DEAL +2%',
    descEn: 'Post-DEAL revenue +2%',
  },
};

export const RESEARCH_META: Record<
  ResearchPath,
  { nameId: string; nameEn: string; levelsId: [string, string, string]; levelsEn: [string, string, string] }
> = {
  FOOD: {
    nameId: 'Riset Nutrisi & Pakan',
    nameEn: 'Food & Nutrition Research',
    levelsId: [
      'Lapar & sakit −20%',
      'Lapar & sakit −35%',
      'Lapar & sakit −50%',
    ],
    levelsEn: [
      'Hunger & sickness −20%',
      'Hunger & sickness −35%',
      'Hunger & sickness −50%',
    ],
  },
  ENVIRONMENT: {
    nameId: 'Riset Kualitas Air',
    nameEn: 'Environment Research',
    levelsId: [
      'Toleransi K1 & buka Telur Premium',
      'Toleransi K2 & buka Telur Exclusive',
      'Toleransi K3 (semua spesies nyaman)',
    ],
    levelsEn: [
      'K1 tolerance & unlocks Premium Roe',
      'K2 tolerance & unlocks Exclusive Roe',
      'K3 tolerance (all species comfortable)',
    ],
  },
  ADVERTISING: {
    nameId: 'Riset Promosi Toko',
    nameEn: 'Advertising Research',
    levelsId: [
      'Popularitas toko +10',
      'Popularitas toko +20',
      'Popularitas toko +30',
    ],
    levelsEn: [
      'Store Popularity +10',
      'Store Popularity +20',
      'Store Popularity +30',
    ],
  },
};

export const HINT_MESSAGES: Record<string, { titleId: string; titleEn: string; bodyId: string; bodyEn: string }> = {
  first_tank: {
    titleId: 'Selamat Datang di Laguna Fish',
    titleEn: 'Welcome to Laguna Fish',
    bodyId: 'Bar atas menampilkan koin, tank 1–4, & riset. Tombol bawah untuk memberi makan, membeli telur, perlengkapan, riset, toko, & kawin.',
    bodyEn: 'Top bar shows coins, tanks 1–4, & research. Bottom dock lets you feed, buy roe, supplies, research, open store, & breed.',
  },
  first_egg: {
    titleId: 'Telur & Bayi Ikan',
    titleEn: 'Roe & Newborn Fry',
    bodyId: 'Ketuk permukaan air untuk menjatuhkan telur atau pakan. Bayi lahir putih polos; warnanya muncul saat fase Anak-anak.',
    bodyEn: 'Click the water surface to drop roe or feed. Babies hatch translucent white and reveal their colors at Child stage.',
  },
  first_hungry: {
    titleId: 'Ikan Mulai Lapar',
    titleEn: 'Fish Getting Hungry',
    bodyId: 'Fed turun di bawah 50%! Buka tombol Makan lalu ketuk air agar ikan tidak kelaparan dan Health-nya turun.',
    bodyEn: 'Fed dropped below 50%! Open Feed and click the water so your fish stay healthy.',
  },
  first_sick: {
    titleId: 'Ikan Terkena Penyakit',
    titleEn: 'Fish Caught an Illness',
    bodyId: 'Kenali gejalanya (bercak hijau = Jamur, titik putih = Bintik Putih) lalu beli obat yang tepat di Supplies. Bisa dikarantina di Isolasi!',
    bodyEn: 'Check symptoms (green fuzz = Fungus, white spots = Ich) and buy the matching medicine in Supplies. You can also isolate sick fish!',
  },
  first_adult: {
    titleId: 'Ikan Mencapai Dewasa',
    titleEn: 'Fish Reached Adulthood',
    bodyId: 'Ikan Dewasa sudah bisa dijual dengan harga penuh di Toko atau dikawinkan dengan ikan Dewasa lain untuk menemukan spesies baru!',
    bodyEn: 'Adult fish sell at full value in the Store or can breed with another Adult to discover new species!',
  },
  first_isolation: {
    titleId: 'Tank Isolasi',
    titleEn: 'Isolation Tank',
    bodyId: 'Tank Isolasi muat 2 ikan: bagus untuk mengkarantina ikan sakit agar tidak menular, atau menjodohkan pasangan klasik.',
    bodyEn: 'The Isolation Tank holds 2 fish: great for quarantining sick fish or setting up classic breeding pairs.',
  },
  first_pregnant: {
    titleId: 'Ikan Sedang Hamil',
    titleEn: 'Fish is Pregnant',
    bodyId: 'Ikan bertanda butir telur akan melahirkan 2–4 bayi setelah masa hamil selesai, atau gunakan Instabirth untuk melahirkan langsung.',
    bodyEn: 'Fish with the egg icon will birth 2–4 fry after gestation, or use Instabirth for immediate birth.',
  },
  first_tank_full: {
    titleId: 'Tank Penuh (21/21)',
    titleEn: 'Tank Full (21/21)',
    bodyId: 'Kapasitas tank maksimal 21 ikan. Jual beberapa ikan di Toko atau beli Tank baru di bar atas.',
    bodyEn: 'Max capacity is 21 fish. Sell fish at the Store or purchase an additional tank in the top bar.',
  },
  first_fragile: {
    titleId: 'Hibrida Rapuh Terdeteksi',
    titleEn: 'Fragile Hybrid Detected',
    bodyId: 'Spesies ini rapuh untuk kondisi air tankmu — tingkatkan riset Environment agar Health tidak turun 2× lebih cepat.',
    bodyEn: 'This species is fragile for your current water quality — upgrade Environment research so Health does not drop 2× faster.',
  },
  first_water_death: {
    titleId: 'Bayi Gugur Akibat Kondisi Air',
    titleEn: 'Fry Lost to Water Quality',
    bodyId: 'Beberapa bayi gagal bertahan karena level Environment kurang tinggi. Tingkatkan riset Environment atau pasang Tanaman Inkubasi.',
    bodyEn: 'Some fry could not survive low Environment level. Upgrade Environment research or plant an Incubation Plant.',
  },
  first_buyer: {
    titleId: 'Pembeli Pertama Datang!',
    titleEn: 'First Customer Arrived!',
    bodyId: 'Buka layar Store/Toko, pilih pembeli dan ikan siap jual untuk memulai adegan negosiasi tatap muka.',
    bodyEn: 'Open the Store screen, pick a customer and a ready-to-sell fish to enter face-to-face negotiation.',
  },
  first_research_done: {
    titleId: 'Riset Selesai!',
    titleEn: 'Research Complete!',
    bodyId: 'Efek riset baru kini aktif untuk seluruh akuarium dan tokomu.',
    bodyEn: 'Your new research bonus is now active across your tanks and store.',
  },
  first_magic: {
    titleId: 'Ikan Ajaib Laguna Ditemukan!',
    titleEn: 'Magic Laguna Fish Discovered!',
    bodyId: 'Ikan Ajaib memancarkan aura pasif di tank tempatnya berada dan menyala di ruang Trofi. Kumpulkan ketujuhnya untuk memulihkan Laguna!',
    bodyEn: 'Magic Fish grant a passive aura to their tank and light up the Trophy Room. Collect all 7 to restore Laguna!',
  },
};

export const TUTORIAL_STEPS = [
  {
    titleId: '1/4 — Beli & Tetaskan Telur',
    titleEn: '1/4 — Buy & Hatch Roe',
    bodyId: 'Kamu memulai dengan Rp50.000. Buka menu Telur untuk membeli roe pertamamu, lalu ketuk permukaan air tank untuk menetaskannya.',
    bodyEn: 'You start with $3.33 (Rp50,000). Open Roe to buy your first fish eggs, then tap the water surface to hatch them.',
  },
  {
    titleId: '2/4 — Beri Makan & Rawat',
    titleEn: '2/4 — Feed & Care',
    bodyId: 'Buka menu Makan untuk membeli pakan, lalu ketuk air di atas ikan. Jangan biarkan Fed mencapai 0 agar Health tidak turun.',
    bodyEn: 'Open Feed to stock fish food, then tap the water above your fish. Keep Fed above 0 so Health stays strong.',
  },
  {
    titleId: '3/4 — Jual lewat Negosiasi',
    titleEn: '3/4 — Sell via Negotiation',
    bodyId: 'Ikan Remaja ke atas bisa ditandai Siap Jual. Buka Store/Toko dan bernegosiasilah dengan pembeli lokal untuk mendapat DEAL terbaik!',
    bodyEn: 'Teen+ fish can be marked Ready for Sale. Open Store and negotiate face-to-face with local buyers for the best DEAL!',
  },
  {
    titleId: '4/4 — Kawinkan & Pulihkan Laguna',
    titleEn: '4/4 — Breed & Restore Laguna',
    bodyId: 'Kawinkan 2 ikan Dewasa untuk menemukan 30 spesies di Findex dan mengumpulkan 7 Ikan Ajaib Laguna. Kami juga memberimu 3 ikan Remaja awal!',
    bodyEn: 'Breed 2 Adult fish to unlock all 30 species in Findex and collect the 7 Magic Fish. You also receive 3 starter Teen fish!',
  },
];

export const BUYER_NAMES_BY_GROUP = {
  ANAK: ['Bintang', 'Nayla', 'Raka', 'Diva', 'Farhan', 'Caca'],
  REMAJA: ['Rizky', 'Salsa', 'Dimas', 'Putri', 'Bagas', 'Nadia'],
  DEWASA: ['Pak Budi', 'Bu Sari', 'Mas Andi', 'Mbak Dewi', 'Pak Hendra', 'Bu Rina'],
  LANSIA: ['Mbah Darmo', 'Eyang Siti', 'Opa Jaya', 'Nenek Ani', 'Kakek Hasan'],
};

export const TRAIT_LABELS: Record<string, { id: string; en: string }> = {
  HEMAT: { id: 'Hemat', en: 'Frugal' },
  KOLEKTOR: { id: 'Kolektor', en: 'Collector' },
  ANAK_KECIL: { id: 'Anak Kecil', en: 'Kid' },
  PENGHOBI: { id: 'Penghobi', en: 'Hobbyist' },
  BURU_BURU: { id: 'Buru-buru', en: 'Impatient' },
};

export const UI_TEXT = {
  gameTitle: { id: 'LAGUNA FISH', en: 'LAGUNA FISH' },
  subtitle: {
    id: 'Simulasi Akuarium Tropis & Toko Ikan Hias',
    en: 'Tropical Aquarium & Ornamental Fish Shop',
  },
  chooseLang: { id: 'Pilih Bahasa & Mata Uang', en: 'Choose Language & Currency' },
  newGame: { id: 'Permainan Baru', en: 'New Game' },
  continueGame: { id: 'Lanjutkan', en: 'Continue' },
  trophy: { id: 'Trofi', en: 'Trophies' },
  stats: { id: 'Statistik', en: 'Statistics' },
  options: { id: 'Opsi', en: 'Options' },
  help: { id: 'Bantuan', en: 'Help' },
  about: { id: 'Tentang', en: 'About' },
  exit: { id: 'Keluar', en: 'Exit' },
  back: { id: 'Kembali', en: 'Back' },
  close: { id: 'Tutup', en: 'Close' },
  confirm: { id: 'Ya, Lanjutkan', en: 'Yes, Confirm' },
  cancel: { id: 'Batal', en: 'Cancel' },
  deleteSlot: { id: 'Hapus', en: 'Delete' },
  emptySlot: { id: 'Slot Kosong', en: 'Empty Slot' },
  selectSlot: { id: 'Pilih Slot Toko', en: 'Select Shop Slot' },
  tank: { id: 'Tank', en: 'Tank' },
  isolation: { id: 'Tank Isolasi', en: 'Isolation Tank' },
  feed: { id: 'Makan', en: 'Feed' },
  eggs: { id: 'Telur', en: 'Eggs' },
  supplies: { id: 'Perlengkapan', en: 'Supplies' },
  research: { id: 'Riset', en: 'Research' },
  magicFish: { id: 'Ikan Ajaib', en: 'Magic Fish' },
  species: { id: 'Spesies', en: 'Findex' },
  store: { id: 'Toko', en: 'Store' },
  breeding: { id: 'Kawinkan', en: 'Breed' },
  log: { id: 'Log', en: 'Log' },
  settings: { id: 'Pengaturan', en: 'Settings' },
  fastMode: { id: 'Mode Cepat', en: 'Fast Mode' },
  realMode: { id: 'Mode Real Time', en: 'Real Time' },
  healthy: { id: 'SEHAT', en: 'HEALTHY' },
  sickFungus: { id: 'SAKIT: JAMUR', en: 'SICK: FUNGUS' },
  sickIch: { id: 'SAKIT: BINTIK PUTIH', en: 'SICK: ICH' },
  pregnant: { id: 'HAMIL', en: 'PREGNANT' },
  fragileHybrid: { id: 'Hibrida Rapuh', en: 'Fragile Hybrid' },
  magicAura: { id: 'Ikan Ajaib', en: 'Magic Fish' },
  readyForSale: { id: 'Siap Jual', en: 'For Sale' },
  tooYoung: { id: 'Terlalu Muda', en: 'Too Young' },
  popularity: { id: 'Popularitas Toko', en: 'Store Popularity' },
  saleEvent: { id: 'EVENT SALE', en: 'SALE EVENT' },
  stopSale: { id: 'STOP SALE', en: 'STOP SALE' },
};
