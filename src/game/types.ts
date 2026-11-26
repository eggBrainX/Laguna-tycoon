export type Language = 'id' | 'en';
export type TimeMode = 'fast' | 'real';
export type MusicTrack = 'akuatik' | 'samudra' | 'ceria' | 'ajaib';

export enum BodyPart {
  DISCUS = 'DISCUS',
  TETRA = 'TETRA',
  ANGELFISH = 'ANGELFISH',
  GUPPY = 'GUPPY',
  KOI = 'KOI',
  BETTA = 'BETTA',
}

export enum Fin {
  ROUND = 'ROUND',
  FAN = 'FAN',
  SPIKY = 'SPIKY',
  LONG = 'LONG',
  TWIN = 'TWIN',
}

export enum Rarity {
  COMMON = 'COMMON',
  UNCOMMON = 'UNCOMMON',
  RARE = 'RARE',
  EPIC = 'EPIC',
  LEGEND = 'LEGEND',
  MYTHIC = 'MYTHIC',
  HOLY = 'HOLY',
}

export enum Stage {
  BABY = 'BABY',
  CHILD = 'CHILD',
  TEEN = 'TEEN',
  ADULT = 'ADULT',
  OLD = 'OLD',
}

export type SickType = 'FUNGUS' | 'ICH'; // Fungus = Jamur, Ich = Bintik Putih
export type EggType = 'COMMON' | 'PREMIUM' | 'EXCLUSIVE';
export type FeedType = 'REGULAR' | 'PREMIUM';

export type ResearchPath = 'FOOD' | 'ENVIRONMENT' | 'ADVERTISING';

export type SupplyItemId =
  | 'MED_FUNGUS'
  | 'MED_ICH'
  | 'VITAMIN'
  | 'INSTAGROW'
  | 'INSTABIRTH'
  | 'DISCOVERY_POTION'
  | 'FEED_REGULAR'
  | 'FEED_PREMIUM';

export type TankUpgradeId =
  | 'CLEANING_SNAIL'
  | 'TEMP_REGULATOR'
  | 'AERATION'
  | 'AUTO_FEEDER'
  | 'POWER_FILTER'
  | 'GOLDEN_SEAHORSE'
  | 'PLANT_NUTRITION'
  | 'PLANT_INCUBATION'
  | 'PLANT_MEDICINE'
  | 'PLANT_FERTILE';

export type DecorId =
  | 'ROCK'
  | 'SHELL'
  | 'CORAL'
  | 'ANCHOR'
  | 'PAGODA'
  | 'DIVER'
  | 'PILLAR'
  | 'LANTERN'
  | 'SHIPWRECK';

export type StoreUpgradeId =
  | 'MERCH_RACK'
  | 'SIGNBOARD'
  | 'SEATING_AREA'
  | 'PILLAR_TERRAIN';

export type StaffId = 'SINTA' | 'BAMBANG' | 'MAYA';

export type SpeciesKey = `${BodyPart}_${Fin}`;

export type BuyerAgeGroup = 'ANAK' | 'REMAJA' | 'DEWASA' | 'LANSIA';
export type BuyerOutfit = 'SD' | 'REMAJA' | 'BATIK' | 'DASTER' | 'LANSIA' | 'ADAT';
export type BuyerTrait = 'HEMAT' | 'KOLEKTOR' | 'ANAK_KECIL' | 'PENGHOBI' | 'BURU_BURU';

export interface Fish {
  id: string;
  body: BodyPart;
  fin: Fin;
  rarity: Rarity;
  stage: Stage;
  stageStartedAt: number; // real epoch ms
  stageElapsedMs: number; // accumulated active ms in current stage (handles fast vs real seamlessly)
  fed: number; // 0..100
  health: number; // 0..100
  healthZeroSince: number | null; // elapsed ms at health 0
  sick: SickType | null;
  pregnantUntil: number | null; // remaining gestation ms when pregnant (or timestamp target)
  pregnantRemainingMs: number | null; // remaining ms in current mode
  pregnantMateBody: BodyPart | null;
  pregnantMateFin: Fin | null;
  pregnantMateSpecies: SpeciesKey | null;
  pregnantDiscoveryPotion: boolean;
  markup: number | null; // 1..10 override, null = species default
  isMagic: boolean;
  magicId: number | null; // 1..7 if first magic specimen
  fragile: boolean;
  generation: number; // 0 = egg, 1+ = bred
  parentASpecies: SpeciesKey | null;
  parentBSpecies: SpeciesKey | null;
  bornAt: number;
  tank: number; // 1..4
  inIsolation: boolean;
  forSale: boolean;
  statusBannerUntil: number; // epoch ms until HEALTHY/SICK/PREGNANT temporary badge hides
}

export interface DiscoveredEntry {
  species: SpeciesKey;
  discoveredAt: number;
  method: 'egg' | 'breeding' | 'starter';
  parentA?: SpeciesKey | null;
  parentB?: SpeciesKey | null;
}

export interface MagicFoundEntry {
  magicId: number;
  foundAt: number;
}

export interface Buyer {
  id: string;
  name: string;
  ageGroup: BuyerAgeGroup;
  outfit: BuyerOutfit;
  trait: BuyerTrait;
  patience: number;
  maxPatience: number;
  targetSpecies: SpeciesKey | null; // for PENGHOBI
  budgetMax: number; // calculated limit for ANAK_KECIL or general cap
  arrivedAt: number;
}

export interface NegotiationState {
  buyer: Buyer;
  fishId: string;
  askingPrice: number;
  fairPrice: number;
  round: number;
  patience: number;
  maxPatience: number;
  counterOffer: number | null;
  dialogueKey: string;
  dialogueText: string;
  status: 'ACTIVE' | 'DEAL' | 'FAILED';
  finalRevenue?: number;
}

export interface SaleEventState {
  active: boolean;
  startedAt: number;
  endsAt: number;
  cooldownUntil: number;
  buyersArrived: number;
  fishSold: number;
  revenue: number;
  popularityHistory: { timeSec: number; pop: number }[];
}

export interface Stats {
  fishSold: number;
  totalRevenue: number;
  totalSpent: number;
  highestSalePrice: number;
  fishCured: number;
  fishDied: number;
  fishDiscarded: number;
  fishBred: number;
  feedGiven: number;
  playTimeMs: number;
}

export interface ActivityEntry {
  id: string;
  timestamp: number;
  type: 'sale' | 'birth' | 'death' | 'cure' | 'research' | 'discovery' | 'magic' | 'info';
  messageId: string;
  messageEn: string;
}

export interface OfflineSummary {
  elapsedMs: number;
  fishGrown: number;
  fishBorn: number;
  fishSick: number;
  fishDied: number;
  researchCompleted: ResearchPath | null;
}

export interface ActiveResearch {
  path: ResearchPath;
  targetLevel: number; // 1..3
  remainingMs: number;
  totalMs: number;
}

export interface GameState {
  slotIndex: number;
  money: number;
  fish: Fish[];
  tanksOwned: number[]; // e.g. [1] initially
  activeTank: number; // 1..4
  discovered: Record<SpeciesKey, DiscoveredEntry>;
  speciesMarkup: Partial<Record<SpeciesKey, number>>; // default 5
  magicFound: Record<number, MagicFoundEntry>;
  epilogueShown: boolean;
  research: Record<ResearchPath, number>; // 0..3
  activeResearch: ActiveResearch | null;
  inventory: Record<SupplyItemId, number>; // doses remaining (or portions for feed)
  tankUpgrades: Record<number, TankUpgradeId[]>; // per tank 1..4
  decorations: DecorId[];
  storeUpgrades: StoreUpgradeId[];
  staff: StaffId[];
  buyers: Buyer[];
  nextBuyerInMs: number;
  saleEvent: SaleEventState;
  breedingCooldowns: Record<string, number>; // pairKey -> remaining cooldown ms
  discoveryPotionActive: boolean;
  stats: Stats;
  activityLog: ActivityEntry[];
  tutorialStep: number; // 0..3, 4 = done
  hintsShown: string[];
  lastSavedAt: number;
  createdAt: number;
}

export interface GlobalSettings {
  languageSelected: boolean;
  language: Language;
  timeMode: TimeMode;
  soundEnabled: boolean;
  musicEnabled: boolean;
  musicTrack: MusicTrack;
  hintsEnabled: boolean;
  notificationsEnabled: boolean;
}

export interface SaveSlotSummary {
  slotIndex: number;
  empty: boolean;
  money?: number;
  fishCount?: number;
  speciesCount?: number;
  magicCount?: number;
  lastSavedAt?: number;
}
