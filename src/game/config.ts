import {
  BodyPart,
  DecorId,
  EggType,
  Fin,
  Rarity,
  ResearchPath,
  SpeciesKey,
  Stage,
  StaffId,
  StoreUpgradeId,
  SupplyItemId,
  TankUpgradeId,
} from './types';

export const GameConfig = {
  START_MONEY: 50_000,
  USD_RATE: 15_000,

  TANK_CAPACITY: 21,
  ISOLATION_CAPACITY: 2,
  TANK_PRICES: {
    1: 0,
    2: 800_000,
    3: 1_200_000,
    4: 1_500_000,
  } as Record<number, number>,

  RARITY_PCT: {
    [Rarity.COMMON]: 0.04,
    [Rarity.UNCOMMON]: 0.06,
    [Rarity.RARE]: 0.09,
    [Rarity.EPIC]: 0.12,
    [Rarity.LEGEND]: 0.18,
    [Rarity.MYTHIC]: 0.22,
    [Rarity.HOLY]: 0.45,
  } as Record<Rarity, number>,

  PHASE_MULT: {
    [Stage.BABY]: 0,
    [Stage.CHILD]: 0,
    [Stage.TEEN]: 0.4,
    [Stage.ADULT]: 1.0,
    [Stage.OLD]: 1.8,
  } as Record<Stage, number>,

  MARKUP_MIN: 1,
  MARKUP_MAX: 10,
  MARKUP_DEFAULT: 5,

  // Stage durations in ms
  GROW_FAST_MS: {
    [Stage.BABY]: 30_000,  // Baby -> Child = 30s
    [Stage.CHILD]: 30_000, // Child -> Teen = 30s (Total Baby -> Teen = 60s)
    [Stage.TEEN]: 120_000, // Teen -> Adult = 120s
    [Stage.ADULT]: 360_000,// Adult -> Old = 360s (Total 9 min)
    [Stage.OLD]: Infinity,
  } as Record<Stage, number>,

  GROW_REAL_MS: {
    [Stage.BABY]: 30 * 60_000,       // 30m
    [Stage.CHILD]: 30 * 60_000,      // 30m (Total Baby -> Teen = 1h)
    [Stage.TEEN]: 3 * 3600_000,      // 3h
    [Stage.ADULT]: 24 * 3600_000,    // 24h
    [Stage.OLD]: Infinity,
  } as Record<Stage, number>,

  OFFLINE_CAP_MS: 7 * 24 * 3600_000, // 7 days

  // Health & Hunger timing
  FED_EMPTY_FAST_MS: 10 * 60_000,        // 10 min
  FED_EMPTY_REAL_MS: 12 * 3600_000,      // 12 hours
  STARVE_HEALTH_FAST_MS: 120_000,        // 120s
  STARVE_HEALTH_REAL_MS: 3 * 3600_000,   // 3 hours
  DEATH_DELAY_FAST_MS: 80_000,           // 80s
  DEATH_DELAY_REAL_MS: 80 * 60_000,      // 80 min
  SICK_CHANCE_PER_MIN_FAST: 0.01,        // 1% per min
  SICK_CHANCE_PER_HR_REAL: 0.01,         // 1% per hour
  CONTAGION_PER_MIN_FAST: 0.05,          // 5% per min per sick fish
  CONTAGION_PER_HR_REAL: 0.05,           // 5% per hour per sick fish
  RECOVER_RATE_FAST_MS: 10_000,          // +1% per 10s
  RECOVER_RATE_REAL_MS: 10 * 60_000,     // +1% per 10m

  // Breeding
  PREGNANCY_CHANCE: 0.30,
  PREGNANCY_CHANCE_FERTILE_PLANT: 0.40,
  BIRTH_COUNT_MIN: 2,
  BIRTH_COUNT_MAX: 4,
  BIRTH_COUNT_ABSOLUTE_MAX: 5,
  GESTATION_FAST_MS: 60_000,             // 60s
  GESTATION_REAL_MS: 3600_000,           // 1 hour
  BREED_COOLDOWN_FAST_MS: 20_000,        // 20s
  BREED_COOLDOWN_REAL_MS: 10 * 60_000,   // 10m

  RARITY_WEIGHTS_BREEDING: [
    { rarity: Rarity.COMMON, weight: 55 },
    { rarity: Rarity.UNCOMMON, weight: 25 },
    { rarity: Rarity.RARE, weight: 12 },
    { rarity: Rarity.EPIC, weight: 5 },
    { rarity: Rarity.LEGEND, weight: 2 },
    { rarity: Rarity.MYTHIC, weight: 0.9 },
    { rarity: Rarity.HOLY, weight: 0.1 },
  ],

  RARITY_WEIGHTS_MUTATION: [
    { rarity: Rarity.UNCOMMON, weight: 25 },
    { rarity: Rarity.RARE, weight: 12 },
    { rarity: Rarity.EPIC, weight: 5 },
    { rarity: Rarity.LEGEND, weight: 2 },
    { rarity: Rarity.MYTHIC, weight: 0.9 },
    { rarity: Rarity.HOLY, weight: 0.1 },
  ],

  // Buyers & Store
  BUYER_INTERVAL_MS: 12_000,
  QUEUE_MAX: 3,
  SALE_DURATION_MS: 30_000,
  SALE_COOLDOWN_MS: 120_000,
  SALE_BONUS_POP: 25,
  SALE_BONUS_DEAL: 0.10,
  SALE_EXTRA_QUEUE: 2,

  // Eggs
  EGGS: {
    COMMON: { price: 5_000, mutationChance: 0.01, reqEnvLevel: 0 },
    PREMIUM: { price: 15_000, mutationChance: 0.02, reqEnvLevel: 1 },
    EXCLUSIVE: { price: 40_000, mutationChance: 0.03, reqEnvLevel: 2 },
  } as Record<EggType, { price: number; mutationChance: number; reqEnvLevel: number }>,

  // Research
  RESEARCH_COST: {
    FOOD: [300_000, 600_000, 900_000],
    ENVIRONMENT: [400_000, 800_000, 1_200_000],
    ADVERTISING: [500_000, 1_000_000, 1_500_000],
  } as Record<ResearchPath, [number, number, number]>,

  RESEARCH_FAST_MS: [60_000, 120_000, 180_000] as [number, number, number],
  RESEARCH_REAL_MS: [3600_000, 3 * 3600_000, 6 * 3600_000] as [number, number, number],

  FOOD_REDUCTION: [0, 0.20, 0.35, 0.50] as [number, number, number, number],
  ADV_POPULARITY: [0, 10, 20, 30] as [number, number, number, number],

  // Supplies
  SUPPLIES: {
    MED_FUNGUS: { price: 3_000, doses: 3 },
    MED_ICH: { price: 3_000, doses: 3 },
    VITAMIN: { price: 2_500, doses: 3 },
    INSTAGROW: { price: 8_000, doses: 3 },
    INSTABIRTH: { price: 10_000, doses: 1 },
    DISCOVERY_POTION: { price: 15_000, doses: 1 },
    FEED_REGULAR: { price: 1_000, doses: 1 },
    FEED_PREMIUM: { price: 2_500, doses: 1 },
  } as Record<SupplyItemId, { price: number; doses: number }>,

  FEED_MAX_STOCK: 99,

  // Tank Upgrades & Laguna Plants
  TANK_UPGRADES: {
    CLEANING_SNAIL: { price: 4_000, isPlant: false },
    TEMP_REGULATOR: { price: 5_000, isPlant: false },
    AERATION: { price: 16_000, isPlant: false },
    AUTO_FEEDER: { price: 20_000, isPlant: false },
    POWER_FILTER: { price: 25_000, isPlant: false },
    GOLDEN_SEAHORSE: { price: 50_000, isPlant: false },
    PLANT_NUTRITION: { price: 35_000, isPlant: true },
    PLANT_INCUBATION: { price: 40_000, isPlant: true },
    PLANT_MEDICINE: { price: 45_000, isPlant: true },
    PLANT_FERTILE: { price: 55_000, isPlant: true },
  } as Record<TankUpgradeId, { price: number; isPlant: boolean }>,

  // Decorations
  DECORATIONS: {
    ROCK: 5_000,
    SHELL: 10_000,
    CORAL: 25_000,
    ANCHOR: 30_000,
    PAGODA: 40_000,
    DIVER: 45_000,
    PILLAR: 50_000,
    LANTERN: 60_000,
    SHIPWRECK: 80_000,
  } as Record<DecorId, number>,

  // Store Upgrades
  STORE_UPGRADES: {
    MERCH_RACK: 60_000,
    SIGNBOARD: 75_000,
    SEATING_AREA: 90_000,
    PILLAR_TERRAIN: 110_000,
  } as Record<StoreUpgradeId, number>,

  // Staff
  STAFF: {
    SINTA: 150_000,
    MAYA: 175_000,
    BAMBANG: 200_000,
  } as Record<StaffId, number>,

  // Status banner visibility duration
  STATUS_BANNER_MS: 3_000,
};

export const BODY_PALETTE: Record<
  BodyPart,
  { main: string; mainLight: string; mainDark: string; motif: string; motifLight: string }
> = {
  [BodyPart.DISCUS]: {
    main: '#F97316',
    mainLight: '#FDBA74',
    mainDark: '#C2410C',
    motif: '#2563EB',
    motifLight: '#60A5FA',
  },
  [BodyPart.TETRA]: {
    main: '#FACC15',
    mainLight: '#FEF08A',
    mainDark: '#CA8A04',
    motif: '#DC2626',
    motifLight: '#F87171',
  },
  [BodyPart.ANGELFISH]: {
    main: '#C4B5FD',
    mainLight: '#EDE9FE',
    mainDark: '#8B5CF6',
    motif: '#4C1D95',
    motifLight: '#6D28D9',
  },
  [BodyPart.GUPPY]: {
    main: '#22C55E',
    mainLight: '#86EFAC',
    mainDark: '#15803D',
    motif: '#FDE047',
    motifLight: '#FEF9C3',
  },
  [BodyPart.KOI]: {
    main: '#F8FAFC',
    mainLight: '#FFFFFF',
    mainDark: '#CBD5E1',
    motif: '#DC2626',
    motifLight: '#EF4444',
  },
  [BodyPart.BETTA]: {
    main: '#EF4444',
    mainLight: '#FCA5A5',
    mainDark: '#B91C1C',
    motif: '#581C87',
    motifLight: '#7E22CE',
  },
};

export function makeSpeciesKey(body: BodyPart, fin: Fin): SpeciesKey {
  return `${body}_${fin}`;
}

export const SPECIES_BASE_VALUES: Record<SpeciesKey, number> = {
  DISCUS_ROUND: 1_200_000,
  DISCUS_FAN: 1_850_000,
  DISCUS_SPIKY: 2_400_000,
  DISCUS_LONG: 3_600_000, // Magic
  DISCUS_TWIN: 2_900_000,

  TETRA_ROUND: 650_000,
  TETRA_FAN: 900_000,
  TETRA_SPIKY: 3_300_000, // Magic
  TETRA_LONG: 1_450_000,
  TETRA_TWIN: 1_100_000,

  ANGELFISH_ROUND: 1_700_000,
  ANGELFISH_FAN: 2_100_000,
  ANGELFISH_SPIKY: 3_900_000, // Magic
  ANGELFISH_LONG: 2_650_000,
  ANGELFISH_TWIN: 3_100_000,

  GUPPY_ROUND: 500_000,
  GUPPY_FAN: 750_000,
  GUPPY_SPIKY: 1_000_000,
  GUPPY_LONG: 1_300_000,
  GUPPY_TWIN: 3_500_000, // Magic

  KOI_ROUND: 3_800_000, // Magic
  KOI_FAN: 5_000_000, // Magic
  KOI_SPIKY: 2_250_000,
  KOI_LONG: 3_000_000,
  KOI_TWIN: 4_200_000,

  BETTA_ROUND: 1_550_000,
  BETTA_FAN: 4_000_000, // Magic
  BETTA_SPIKY: 2_000_000,
  BETTA_LONG: 2_800_000,
  BETTA_TWIN: 3_400_000,
};

export interface MagicFishDef {
  id: number;
  body: BodyPart;
  fin: Fin;
  species: SpeciesKey;
  nameId: string;
  nameEn: string;
  effectId: string;
  effectEn: string;
  color: string;
}

export const MAGIC_FISH_LIST: MagicFishDef[] = [
  {
    id: 1,
    body: BodyPart.GUPPY,
    fin: Fin.TWIN,
    species: 'GUPPY_TWIN',
    nameId: 'Ikan Ajaib Kesuburan',
    nameEn: 'Magic Fish of Fertility',
    effectId: 'Kelahiran +1 bayi di tank ini (maks 5)',
    effectEn: '+1 baby at birth in this tank (max 5)',
    color: '#FBBF24',
  },
  {
    id: 2,
    body: BodyPart.KOI,
    fin: Fin.ROUND,
    species: 'KOI_ROUND',
    nameId: 'Ikan Ajaib Pangan',
    nameEn: 'Magic Fish of Sustenance',
    effectId: 'Fed turun 40% lebih lambat di tank ini',
    effectEn: 'Hunger drops 40% slower in this tank',
    color: '#FB923C',
  },
  {
    id: 3,
    body: BodyPart.BETTA,
    fin: Fin.FAN,
    species: 'BETTA_FAN',
    nameId: 'Ikan Ajaib Penyembuh',
    nameEn: 'Magic Fish of Healing',
    effectId: 'Peluang obat berhasil +25% & sembuh sendiri 1%/menit',
    effectEn: '+25% medicine success & 1%/min self-cure',
    color: '#34D399',
  },
  {
    id: 4,
    body: BodyPart.DISCUS,
    fin: Fin.LONG,
    species: 'DISCUS_LONG',
    nameId: 'Ikan Ajaib Pertumbuhan',
    nameEn: 'Magic Fish of Growth',
    effectId: 'Fase tumbuh Bayi→Dewasa 30% lebih cepat di tank ini',
    effectEn: 'Baby→Adult growth 30% faster in this tank',
    color: '#38BDF8',
  },
  {
    id: 5,
    body: BodyPart.TETRA,
    fin: Fin.SPIKY,
    species: 'TETRA_SPIKY',
    nameId: 'Ikan Ajaib Kesehatan',
    nameEn: 'Magic Fish of Vitality',
    effectId: 'Peluang sakit −40% & pemulihan Health +50%',
    effectEn: '−40% sickness chance & +50% health recovery',
    color: '#A78BFA',
  },
  {
    id: 6,
    body: BodyPart.ANGELFISH,
    fin: Fin.SPIKY,
    species: 'ANGELFISH_SPIKY',
    nameId: 'Ikan Ajaib Mutasi',
    nameEn: 'Magic Fish of Mutation',
    effectId: '10% bayi lahir di tank ini mengalami mutasi spesies acak',
    effectEn: '10% chance newborn mutates into random species',
    color: '#F472B6',
  },
  {
    id: 7,
    body: BodyPart.KOI,
    fin: Fin.FAN,
    species: 'KOI_FAN',
    nameId: 'Ikan Ajaib Emas Laguna',
    nameEn: 'Golden Laguna Magic Fish',
    effectId: 'Harga jual semua ikan di toko +10%',
    effectEn: '+10% sell price for all fish in store',
    color: '#FDE047',
  },
];

export const MAGIC_SPECIES_SET = new Set<SpeciesKey>(
  MAGIC_FISH_LIST.map((m) => m.species)
);

export const ALL_BODIES: BodyPart[] = [
  BodyPart.DISCUS,
  BodyPart.TETRA,
  BodyPart.ANGELFISH,
  BodyPart.GUPPY,
  BodyPart.KOI,
  BodyPart.BETTA,
];

export const ALL_FINS: Fin[] = [
  Fin.ROUND,
  Fin.FAN,
  Fin.SPIKY,
  Fin.LONG,
  Fin.TWIN,
];

export const ALL_SPECIES: SpeciesKey[] = ALL_BODIES.flatMap((b) =>
  ALL_FINS.map((f) => makeSpeciesKey(b, f))
);
