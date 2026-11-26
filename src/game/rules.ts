import {
  ALL_BODIES,
  ALL_FINS,
  ALL_SPECIES,
  GameConfig,
  MAGIC_FISH_LIST,
  MAGIC_SPECIES_SET,
  makeSpeciesKey,
  SPECIES_BASE_VALUES,
} from './config';
import {
  BUYER_NAMES_BY_GROUP,
  formatSpeciesName,
} from './strings';
import {
  ActivityEntry,
  BodyPart,
  Buyer,
  BuyerAgeGroup,
  BuyerOutfit,
  BuyerTrait,
  EggType,
  FeedType,
  Fin,
  Fish,
  GameState,
  NegotiationState,
  OfflineSummary,
  Rarity,
  ResearchPath,
  SpeciesKey,
  Stage,
  TankUpgradeId,
  TimeMode,
} from './types';

export type Rng = () => number;

let idSeq = 0;
export function genId(prefix = 'id'): string {
  idSeq += 1;
  return `${prefix}_${Date.now().toString(36)}_${idSeq.toString(36)}_${Math.floor(Math.random() * 1e5).toString(36)}`;
}

export function roundTo500(value: number): number {
  return Math.round(value / 500) * 500;
}

export function getSpeciesResistanceK(species: SpeciesKey): number {
  const base = SPECIES_BASE_VALUES[species];
  if (base < 1_500_000) return 0;
  if (base <= 2_750_000) return 1;
  if (base <= 4_000_000) return 2;
  return 3;
}

export function isFragileForEnv(species: SpeciesKey, envLevel: number): boolean {
  return envLevel < getSpeciesResistanceK(species);
}

export function getTankMagicAuraIds(state: GameState, tank: number, inIsolation = false): Set<number> {
  const set = new Set<number>();
  if (inIsolation) return set;
  for (const f of state.fish) {
    if (!f.inIsolation && f.tank === tank && f.isMagic && f.magicId !== null) {
      set.add(f.magicId);
    }
  }
  return set;
}

export function hasGlobalMagic7(state: GameState): boolean {
  return Boolean(state.magicFound[7]);
}

export function calculateFishPrice(fish: Fish, state: GameState): number {
  const phaseMult = GameConfig.PHASE_MULT[fish.stage];
  if (phaseMult <= 0) return 0;

  const species = makeSpeciesKey(fish.body, fish.fin);
  const base = SPECIES_BASE_VALUES[species];
  const rarityPct = GameConfig.RARITY_PCT[fish.rarity];
  const markup = fish.markup ?? state.speciesMarkup[species] ?? GameConfig.MARKUP_DEFAULT;

  const tankUpgrades = state.tankUpgrades[fish.tank] ?? [];
  const goldenSeahorseBonus = !fish.inIsolation && tankUpgrades.includes('GOLDEN_SEAHORSE') ? 0.05 : 0;
  const magicGoldBonus = hasGlobalMagic7(state) ? 0.10 : 0;

  const raw =
    base *
    rarityPct *
    phaseMult *
    (1 + markup / 100) *
    (1 + goldenSeahorseBonus) *
    (1 + magicGoldBonus);

  return roundTo500(raw);
}

export function calculateFairFishPrice(fish: Fish): number {
  const phaseMult = GameConfig.PHASE_MULT[fish.stage];
  if (phaseMult <= 0) return 0;
  const species = makeSpeciesKey(fish.body, fish.fin);
  const base = SPECIES_BASE_VALUES[species];
  const rarityPct = GameConfig.RARITY_PCT[fish.rarity];
  return roundTo500(base * rarityPct * phaseMult * (1 + GameConfig.MARKUP_DEFAULT / 100));
}

export function isFishSellable(fish: Fish): boolean {
  if (fish.stage === Stage.BABY || fish.stage === Stage.CHILD) return false;
  if (fish.sick !== null) return false;
  if (fish.inIsolation) return false;
  if (fish.isMagic) return false;
  if (!fish.forSale) return false;
  return true;
}

export function getEggSpeciesPool(eggType: EggType): SpeciesKey[] {
  const maxK = eggType === 'COMMON' ? 0 : eggType === 'PREMIUM' ? 1 : 2;
  return ALL_SPECIES.filter((sp) => {
    if (MAGIC_SPECIES_SET.has(sp)) return false; // Magic fish never hatch from store eggs
    return getSpeciesResistanceK(sp) <= maxK;
  });
}

function pickWeightedRarity(
  weights: { rarity: Rarity; weight: number }[],
  rng: Rng
): Rarity {
  const total = weights.reduce((s, w) => s + w.weight, 0);
  let r = rng() * total;
  for (const w of weights) {
    r -= w.weight;
    if (r <= 0) return w.rarity;
  }
  return weights[weights.length - 1].rarity;
}

export function rollEggRarity(eggType: EggType, rng: Rng = Math.random): Rarity {
  const p = GameConfig.EGGS[eggType].mutationChance;
  if (rng() >= p) return Rarity.COMMON;
  return pickWeightedRarity(GameConfig.RARITY_WEIGHTS_MUTATION, rng);
}

export function rollBreedingRarity(rng: Rng = Math.random, minRare = false): Rarity {
  const rolled = pickWeightedRarity(GameConfig.RARITY_WEIGHTS_BREEDING, rng);
  if (!minRare) return rolled;
  if (rolled === Rarity.COMMON || rolled === Rarity.UNCOMMON) {
    return Rarity.RARE;
  }
  return rolled;
}

export function splitSpeciesKey(sp: SpeciesKey): { body: BodyPart; fin: Fin } {
  const [body, fin] = sp.split('_') as [BodyPart, Fin];
  return { body, fin };
}

export function getTankFishCount(state: GameState, tank: number): number {
  return state.fish.filter((f) => !f.inIsolation && f.tank === tank).length;
}

export function getIsolationFishCount(state: GameState): number {
  return state.fish.filter((f) => f.inIsolation).length;
}

export function createFish(params: {
  body: BodyPart;
  fin: Fin;
  rarity: Rarity;
  stage: Stage;
  tank: number;
  now: number;
  envLevel: number;
  generation?: number;
  parentASpecies?: SpeciesKey | null;
  parentBSpecies?: SpeciesKey | null;
  inIsolation?: boolean;
  isMagic?: boolean;
  magicId?: number | null;
}): Fish {
  const sp = makeSpeciesKey(params.body, params.fin);
  return {
    id: genId('fish'),
    body: params.body,
    fin: params.fin,
    rarity: params.rarity,
    stage: params.stage,
    stageStartedAt: params.now,
    stageElapsedMs: 0,
    fed: 90,
    health: 100,
    healthZeroSince: null,
    sick: null,
    pregnantUntil: null,
    pregnantRemainingMs: null,
    pregnantMateBody: null,
    pregnantMateFin: null,
    pregnantMateSpecies: null,
    pregnantDiscoveryPotion: false,
    markup: null,
    isMagic: Boolean(params.isMagic),
    magicId: params.magicId ?? null,
    fragile: isFragileForEnv(sp, params.envLevel),
    generation: params.generation ?? 0,
    parentASpecies: params.parentASpecies ?? null,
    parentBSpecies: params.parentBSpecies ?? null,
    bornAt: params.now,
    tank: params.tank,
    inIsolation: Boolean(params.inIsolation),
    forSale: false,
    statusBannerUntil: params.now + GameConfig.STATUS_BANNER_MS,
  };
}

export function addActivity(
  state: GameState,
  type: ActivityEntry['type'],
  messageId: string,
  messageEn: string,
  now: number
): ActivityEntry[] {
  const entry: ActivityEntry = {
    id: genId('act'),
    timestamp: now,
    type,
    messageId,
    messageEn,
  };
  return [entry, ...state.activityLog].slice(0, 30);
}

export function createStarterGiftFish(state: GameState, now: number, rng: Rng = Math.random): Fish[] {
  const k0Pool = getEggSpeciesPool('COMMON');
  const starters: Fish[] = [];
  for (let i = 0; i < 3; i++) {
    const sp = k0Pool[Math.floor(rng() * k0Pool.length)];
    const { body, fin } = splitSpeciesKey(sp);
    starters.push(
      createFish({
        body,
        fin,
        rarity: Rarity.COMMON,
        stage: Stage.TEEN,
        tank: 1,
        now,
        envLevel: state.research.ENVIRONMENT,
        generation: 0,
      })
    );
  }
  return starters;
}

export function createInitialGameState(
  slotIndex: number,
  now = Date.now(),
  rng: Rng = Math.random,
  skipTutorial = false
): GameState {
  const baseState: GameState = {
    slotIndex,
    money: GameConfig.START_MONEY,
    fish: [],
    tanksOwned: [1],
    activeTank: 1,
    discovered: {} as Record<SpeciesKey, any>,
    speciesMarkup: {},
    magicFound: {},
    epilogueShown: false,
    research: {
      FOOD: 0,
      ENVIRONMENT: 0,
      ADVERTISING: 0,
    },
    activeResearch: null,
    inventory: {
      MED_FUNGUS: 0,
      MED_ICH: 0,
      VITAMIN: 0,
      INSTAGROW: 0,
      INSTABIRTH: 0,
      DISCOVERY_POTION: 0,
      FEED_REGULAR: 3, // Start with 3 portions so new player can test feeding right away if desired
      FEED_PREMIUM: 0,
    },
    tankUpgrades: { 1: [], 2: [], 3: [], 4: [] },
    decorations: [],
    storeUpgrades: [],
    staff: [],
    buyers: [],
    nextBuyerInMs: 4_000,
    saleEvent: {
      active: false,
      startedAt: 0,
      endsAt: 0,
      cooldownUntil: 0,
      buyersArrived: 0,
      fishSold: 0,
      revenue: 0,
      popularityHistory: [],
    },
    breedingCooldowns: {},
    discoveryPotionActive: false,
    stats: {
      fishSold: 0,
      totalRevenue: 0,
      totalSpent: 0,
      highestSalePrice: 0,
      fishCured: 0,
      fishDied: 0,
      fishDiscarded: 0,
      fishBred: 0,
      feedGiven: 0,
      playTimeMs: 0,
    },
    activityLog: [
      {
        id: genId('act'),
        timestamp: now,
        type: 'info',
        messageId: 'Toko Laguna Fish dibuka! Selamat datang.',
        messageEn: 'Laguna Fish shop opened! Welcome.',
      },
    ],
    tutorialStep: skipTutorial ? 4 : 0,
    hintsShown: [],
    lastSavedAt: now,
    createdAt: now,
  };

  // Starter gift: if tutorial skipped, grant 3 Common Teen K0 fish immediately (otherwise granted when tutorial finishes)
  if (skipTutorial) {
    const gift = createStarterGiftFish(baseState, now, rng);
    baseState.fish.push(...gift);
    for (const f of gift) {
      const sp = makeSpeciesKey(f.body, f.fin);
      if (!baseState.discovered[sp]) {
        baseState.discovered[sp] = {
          species: sp,
          discoveredAt: now,
          method: 'starter',
        };
      }
    }
  }

  return baseState;
}

export interface HatchResult {
  ok: boolean;
  errorKey?: 'no_money' | 'env_locked' | 'tank_full';
  state: GameState;
  hatchedCount: number;
  waterDiedCount: number;
  fragileBorn: boolean;
}

export function hatchEggs(
  state: GameState,
  eggType: EggType,
  tank: number,
  now = Date.now(),
  rng: Rng = Math.random
): HatchResult {
  const eggCfg = GameConfig.EGGS[eggType];
  if (state.research.ENVIRONMENT < eggCfg.reqEnvLevel) {
    return { ok: false, errorKey: 'env_locked', state, hatchedCount: 0, waterDiedCount: 0, fragileBorn: false };
  }
  if (state.money < eggCfg.price) {
    return { ok: false, errorKey: 'no_money', state, hatchedCount: 0, waterDiedCount: 0, fragileBorn: false };
  }
  const currentCount = getTankFishCount(state, tank);
  if (currentCount >= GameConfig.TANK_CAPACITY) {
    return { ok: false, errorKey: 'tank_full', state, hatchedCount: 0, waterDiedCount: 0, fragileBorn: false };
  }

  const tankUpgrades = state.tankUpgrades[tank] ?? [];
  const hasIncubationPlant = tankUpgrades.includes('PLANT_INCUBATION');
  const minHatch = hasIncubationPlant ? 3 : 2;
  const maxHatch = 5;
  const rolledCount = minHatch + Math.floor(rng() * (maxHatch - minHatch + 1));
  const availableSlots = GameConfig.TANK_CAPACITY - currentCount;
  const actualToSpawn = Math.min(rolledCount, availableSlots);

  const pool = getEggSpeciesPool(eggType);
  const envLevel = state.research.ENVIRONMENT;
  const newFish: Fish[] = [];
  const discovered = { ...state.discovered };
  let waterDiedCount = 0;
  let fragileBorn = false;

  for (let i = 0; i < actualToSpawn; i++) {
    const sp = pool[Math.floor(rng() * pool.length)];
    const { body, fin } = splitSpeciesKey(sp);
    const rarity = rollEggRarity(eggType, rng);
    const k = getSpeciesResistanceK(sp);
    const missingEnv = Math.max(0, k - envLevel);

    if (missingEnv > 0) {
      let deathChance = missingEnv * 0.25;
      if (hasIncubationPlant) deathChance *= 0.5;
      if (rng() < deathChance) {
        waterDiedCount += 1;
        continue;
      }
      fragileBorn = true;
    }

    const fish = createFish({
      body,
      fin,
      rarity,
      stage: Stage.BABY,
      tank,
      now,
      envLevel,
      generation: 0,
    });
    newFish.push(fish);

    if (!discovered[sp]) {
      discovered[sp] = {
        species: sp,
        discoveredAt: now,
        method: 'egg',
      };
    }
  }

  let nextLog = addActivity(
    state,
    'birth',
    `Menetaskan ${newFish.length} bayi dari Telur ${eggType} di Tank ${tank}.`,
    `Hatched ${newFish.length} fry from ${eggType} Roe in Tank ${tank}.`,
    now
  );

  if (waterDiedCount > 0) {
    nextLog = [
      {
        id: genId('act'),
        timestamp: now,
        type: 'death' as const,
        messageId: `${waterDiedCount} bayi mati saat menetas karena air kurang cocok (tingkatkan Riset Environment).`,
        messageEn: `${waterDiedCount} fry died at hatch due to water quality (upgrade Environment Research).`,
      },
      ...nextLog,
    ].slice(0, 30);
  }

  const nextState: GameState = {
    ...state,
    money: state.money - eggCfg.price,
    fish: [...state.fish, ...newFish],
    discovered,
    stats: {
      ...state.stats,
      totalSpent: state.stats.totalSpent + eggCfg.price,
      fishDied: state.stats.fishDied + waterDiedCount,
    },
    activityLog: nextLog,
  };

  return {
    ok: true,
    state: nextState,
    hatchedCount: newFish.length,
    waterDiedCount,
    fragileBorn,
  };
}

export function getPairKey(idA: string, idB: string): string {
  return idA < idB ? `${idA}__${idB}` : `${idB}__${idA}`;
}

export interface BreedAttemptResult {
  ok: boolean;
  pregnant: boolean;
  reason?: 'not_adult' | 'already_pregnant' | 'cooldown' | 'sick' | 'invalid';
  state: GameState;
}

export function attemptBreeding(
  state: GameState,
  motherId: string,
  fatherId: string,
  timeMode: TimeMode,
  now = Date.now(),
  rng: Rng = Math.random
): BreedAttemptResult {
  if (motherId === fatherId) {
    return { ok: false, pregnant: false, reason: 'invalid', state };
  }
  const mother = state.fish.find((f) => f.id === motherId);
  const father = state.fish.find((f) => f.id === fatherId);
  if (!mother || !father) {
    return { ok: false, pregnant: false, reason: 'invalid', state };
  }
  if (
    (mother.stage !== Stage.ADULT && mother.stage !== Stage.OLD) ||
    (father.stage !== Stage.ADULT && father.stage !== Stage.OLD)
  ) {
    return { ok: false, pregnant: false, reason: 'not_adult', state };
  }
  if (mother.sick || father.sick) {
    return { ok: false, pregnant: false, reason: 'sick', state };
  }
  if (mother.pregnantRemainingMs !== null) {
    return { ok: false, pregnant: false, reason: 'already_pregnant', state };
  }

  const pairKey = getPairKey(mother.id, father.id);
  if ((state.breedingCooldowns[pairKey] ?? 0) > 0) {
    return { ok: false, pregnant: false, reason: 'cooldown', state };
  }

  const motherTankUpgrades = state.tankUpgrades[mother.tank] ?? [];
  const hasFertilePlant = !mother.inIsolation && motherTankUpgrades.includes('PLANT_FERTILE');
  const chance = hasFertilePlant
    ? GameConfig.PREGNANCY_CHANCE_FERTILE_PLANT
    : GameConfig.PREGNANCY_CHANCE;

  const success = rng() < chance;
  if (!success) {
    const cdMs =
      timeMode === 'fast' ? GameConfig.BREED_COOLDOWN_FAST_MS : GameConfig.BREED_COOLDOWN_REAL_MS;
    return {
      ok: true,
      pregnant: false,
      state: {
        ...state,
        breedingCooldowns: {
          ...state.breedingCooldowns,
          [pairKey]: cdMs,
        },
        activityLog: addActivity(
          state,
          'info',
          `Perjodohan belum cocok — coba lagi sebentar lagi.`,
          `Breeding attempt didn't take — try again shortly.`,
          now
        ),
      },
    };
  }

  const gestationMs =
    timeMode === 'fast' ? GameConfig.GESTATION_FAST_MS : GameConfig.GESTATION_REAL_MS;
  const fatherSpecies = makeSpeciesKey(father.body, father.fin);
  const useDiscoveryPotion = state.discoveryPotionActive;

  const updatedFish = state.fish.map((f) =>
    f.id === mother.id
      ? {
          ...f,
          pregnantUntil: now + gestationMs,
          pregnantRemainingMs: gestationMs,
          pregnantMateBody: father.body,
          pregnantMateFin: father.fin,
          pregnantMateSpecies: fatherSpecies,
          pregnantDiscoveryPotion: useDiscoveryPotion,
          statusBannerUntil: now + GameConfig.STATUS_BANNER_MS,
        }
      : f
  );

  return {
    ok: true,
    pregnant: true,
    state: {
      ...state,
      fish: updatedFish,
      discoveryPotionActive: false,
      activityLog: addActivity(
        state,
        'info',
        `${formatSpeciesName(mother.body, mother.fin, 'id')} sedang hamil!`,
        `${formatSpeciesName(mother.body, mother.fin, 'en')} is now pregnant!`,
        now
      ),
    },
  };
}

export interface BirthOutcome {
  state: GameState;
  bornCount: number;
  eatenCount: number;
  waterDiedCount: number;
  newSpeciesFound: SpeciesKey[];
  newMagicIds: number[];
  fragileBorn: boolean;
}

export function giveBirth(
  state: GameState,
  motherId: string,
  now = Date.now(),
  rng: Rng = Math.random
): BirthOutcome {
  const mother = state.fish.find((f) => f.id === motherId);
  if (!mother || mother.pregnantRemainingMs === null) {
    return {
      state,
      bornCount: 0,
      eatenCount: 0,
      waterDiedCount: 0,
      newSpeciesFound: [],
      newMagicIds: [],
      fragileBorn: false,
    };
  }

  const targetTank = mother.tank;
  const magicAuras = getTankMagicAuraIds(state, targetTank, false);
  const tankUpgrades = state.tankUpgrades[targetTank] ?? [];
  const hasFertilePlant = !mother.inIsolation && tankUpgrades.includes('PLANT_FERTILE');
  const hasIncubationPlant = !mother.inIsolation && tankUpgrades.includes('PLANT_INCUBATION');
  const hasMagicFertility = magicAuras.has(1); // Guppy + Twin
  const hasMagicMutation = magicAuras.has(6); // Angelfish + Spiky

  let count =
    GameConfig.BIRTH_COUNT_MIN +
    Math.floor(rng() * (GameConfig.BIRTH_COUNT_MAX - GameConfig.BIRTH_COUNT_MIN + 1));
  if (hasFertilePlant) count += 1;
  if (hasMagicFertility) count += 1;
  count = Math.min(GameConfig.BIRTH_COUNT_ABSOLUTE_MAX, count);

  const currentTankCount = getTankFishCount(state, targetTank);
  const availableSlots = Math.max(0, GameConfig.TANK_CAPACITY - currentTankCount);
  const survivingSlots = Math.min(count, availableSlots);
  const eatenCount = Math.max(0, count - survivingSlots);

  const motherSpecies = makeSpeciesKey(mother.body, mother.fin);
  const mateBody = mother.pregnantMateBody ?? mother.body;
  const mateFin = mother.pregnantMateFin ?? mother.fin;
  const mateSpecies = mother.pregnantMateSpecies ?? motherSpecies;
  const envLevel = state.research.ENVIRONMENT;

  const discovered = { ...state.discovered };
  const magicFound = { ...state.magicFound };
  const newFish: Fish[] = [];
  const newSpeciesFound: SpeciesKey[] = [];
  const newMagicIds: number[] = [];
  let waterDiedCount = 0;
  let fragileBorn = false;

  const undiscoveredList = ALL_SPECIES.filter((s) => !discovered[s]);

  for (let i = 0; i < survivingSlots; i++) {
    let babyBody: BodyPart;
    let babyFin: Fin;
    let forceRarePlus = false;

    if (i === 0 && mother.pregnantDiscoveryPotion) {
      if (undiscoveredList.length > 0) {
        const picked = undiscoveredList[Math.floor(rng() * undiscoveredList.length)];
        const parts = splitSpeciesKey(picked);
        babyBody = parts.body;
        babyFin = parts.fin;
      } else {
        forceRarePlus = true;
        if (rng() < 0.5) {
          babyBody = mother.body;
          babyFin = mateFin;
        } else {
          babyBody = mateBody;
          babyFin = mother.fin;
        }
      }
    } else if (hasMagicMutation && rng() < 0.10) {
      babyBody = ALL_BODIES[Math.floor(rng() * ALL_BODIES.length)];
      babyFin = ALL_FINS[Math.floor(rng() * ALL_FINS.length)];
    } else if (rng() < 0.5) {
      babyBody = mother.body;
      babyFin = mateFin;
    } else {
      babyBody = mateBody;
      babyFin = mother.fin;
    }

    const sp = makeSpeciesKey(babyBody, babyFin);
    const k = getSpeciesResistanceK(sp);
    const missingEnv = Math.max(0, k - envLevel);

    if (missingEnv > 0) {
      let deathChance = missingEnv * 0.25;
      if (hasIncubationPlant) deathChance *= 0.5;
      if (rng() < deathChance) {
        waterDiedCount += 1;
        continue;
      }
      fragileBorn = true;
    }

    const rarity = rollBreedingRarity(rng, forceRarePlus);
    const magicDef = MAGIC_FISH_LIST.find((m) => m.species === sp);
    const isFirstMagic = Boolean(magicDef && !magicFound[magicDef.id]);

    const baby = createFish({
      body: babyBody,
      fin: babyFin,
      rarity,
      stage: Stage.BABY,
      tank: targetTank,
      now,
      envLevel,
      generation: mother.generation + 1,
      parentASpecies: motherSpecies,
      parentBSpecies: mateSpecies,
      isMagic: isFirstMagic,
      magicId: isFirstMagic && magicDef ? magicDef.id : null,
    });
    newFish.push(baby);

    if (!discovered[sp]) {
      discovered[sp] = {
        species: sp,
        discoveredAt: now,
        method: 'breeding',
        parentA: motherSpecies,
        parentB: mateSpecies,
      };
      newSpeciesFound.push(sp);
    }

    if (isFirstMagic && magicDef) {
      magicFound[magicDef.id] = { magicId: magicDef.id, foundAt: now };
      newMagicIds.push(magicDef.id);
    }
  }

  const updatedFish = state.fish.map((f) =>
    f.id === mother.id
      ? {
          ...f,
          pregnantUntil: null,
          pregnantRemainingMs: null,
          pregnantMateBody: null,
          pregnantMateFin: null,
          pregnantMateSpecies: null,
          pregnantDiscoveryPotion: false,
        }
      : f
  );

  let log = state.activityLog;
  if (newFish.length > 0) {
    log = [
      {
        id: genId('act'),
        timestamp: now,
        type: 'birth' as const,
        messageId: `${formatSpeciesName(mother.body, mother.fin, 'id')} melahirkan ${newFish.length} bayi!`,
        messageEn: `${formatSpeciesName(mother.body, mother.fin, 'en')} gave birth to ${newFish.length} fry!`,
      },
      ...log,
    ].slice(0, 30);
  }
  if (eatenCount > 0) {
    log = [
      {
        id: genId('act'),
        timestamp: now,
        type: 'death' as const,
        messageId: `Tank ${targetTank} penuh! ${eatenCount} bayi yang baru lahir dimakan ikan lain.`,
        messageEn: `Tank ${targetTank} full! ${eatenCount} newborn fry were eaten by other fish.`,
      },
      ...log,
    ].slice(0, 30);
  }
  if (waterDiedCount > 0) {
    log = [
      {
        id: genId('act'),
        timestamp: now,
        type: 'death' as const,
        messageId: `${waterDiedCount} bayi mati karena air kurang cocok (tingkatkan Riset Environment).`,
        messageEn: `${waterDiedCount} fry died due to unsuitable water (upgrade Environment Research).`,
      },
      ...log,
    ].slice(0, 30);
  }
  for (const sp of newSpeciesFound) {
    const { body, fin } = splitSpeciesKey(sp);
    log = [
      {
        id: genId('act'),
        timestamp: now,
        type: 'discovery' as const,
        messageId: `Spesies baru ditemukan: ${formatSpeciesName(body, fin, 'id')}!`,
        messageEn: `New species discovered: ${formatSpeciesName(body, fin, 'en')}!`,
      },
      ...log,
    ].slice(0, 30);
  }
  for (const mId of newMagicIds) {
    const m = MAGIC_FISH_LIST.find((x) => x.id === mId);
    if (m) {
      log = [
        {
          id: genId('act'),
          timestamp: now,
          type: 'magic' as const,
          messageId: `Ikan Ajaib ditemukan: ${m.nameId}!`,
          messageEn: `Magic Fish discovered: ${m.nameEn}!`,
        },
        ...log,
      ].slice(0, 30);
    }
  }

  return {
    state: {
      ...state,
      fish: [...updatedFish, ...newFish],
      discovered,
      magicFound,
      stats: {
        ...state.stats,
        fishBred: state.stats.fishBred + newFish.length,
        fishDied: state.stats.fishDied + eatenCount + waterDiedCount,
      },
      activityLog: log,
    },
    bornCount: newFish.length,
    eatenCount,
    waterDiedCount,
    newSpeciesFound,
    newMagicIds,
    fragileBorn,
  };
}

export function calculatePopularity(state: GameState): number {
  let pop = 0;

  // Advertising Lv1/2/3: +10/+20/+30
  pop += GameConfig.ADV_POPULARITY[state.research.ADVERTISING] ?? 0;

  // Each decoration: +3
  pop += state.decorations.length * 3;

  // Each store upgrade: +5
  pop += state.storeUpgrades.length * 5;

  // Sales Sinta: +5
  if (state.staff.includes('SINTA')) pop += 5;

  // Species variety in showcase (forSale && not inIsolation): +1 per 3 unique species (max +10)
  const showcaseFish = state.fish.filter((f) => f.forSale && !f.inIsolation);
  const uniqueSpecies = new Set(showcaseFish.map((f) => makeSpeciesKey(f.body, f.fin)));
  pop += Math.min(10, Math.floor(uniqueSpecies.size / 3));

  // SALE event: +25 temporary
  if (state.saleEvent.active) pop += GameConfig.SALE_BONUS_POP;

  // Sick fish on display: -10 each (max -30)
  const sickDisplayCount = showcaseFish.filter((f) => f.sick !== null).length;
  pop -= Math.min(30, sickDisplayCount * 10);

  // Average asking price > 130% fair value: -15
  const sellableDisplay = showcaseFish.filter((f) => isFishSellable(f));
  if (sellableDisplay.length > 0) {
    let sumAsk = 0;
    let sumFair = 0;
    for (const f of sellableDisplay) {
      sumAsk += calculateFishPrice(f, state);
      sumFair += calculateFairFishPrice(f);
    }
    if (sumFair > 0 && sumAsk / sumFair > 1.30) {
      pop -= 15;
    }
  }

  return Math.max(0, Math.min(100, pop));
}

export function getBuyerIntervalMs(state: GameState): number {
  const pop = calculatePopularity(state);
  return GameConfig.BUYER_INTERVAL_MS / (1 + pop / 100);
}

export function getMaxBuyerQueue(state: GameState): number {
  let maxQ = GameConfig.QUEUE_MAX;
  if (state.storeUpgrades.includes('SIGNBOARD')) maxQ += 1;
  if (state.saleEvent.active) maxQ += GameConfig.SALE_EXTRA_QUEUE;
  return maxQ;
}

export function generateBuyer(state: GameState, now = Date.now(), rng: Rng = Math.random): Buyer {
  const rollAge = rng();
  let ageGroup: BuyerAgeGroup = 'DEWASA';
  if (rollAge < 0.25) ageGroup = 'ANAK';
  else if (rollAge < 0.55) ageGroup = 'REMAJA';
  else if (rollAge < 0.90) ageGroup = 'DEWASA';
  else ageGroup = 'LANSIA';

  let outfit: BuyerOutfit = 'BATIK';
  if (rng() < 0.10) {
    outfit = 'ADAT';
  } else if (ageGroup === 'ANAK') {
    outfit = 'SD';
  } else if (ageGroup === 'REMAJA') {
    outfit = 'REMAJA';
  } else if (ageGroup === 'LANSIA') {
    outfit = 'LANSIA';
  } else {
    outfit = rng() < 0.5 ? 'BATIK' : 'DASTER';
  }

  // Pick trait
  let trait: BuyerTrait;
  if (ageGroup === 'ANAK' && rng() < 0.7) {
    trait = 'ANAK_KECIL';
  } else {
    const traits: BuyerTrait[] = ['HEMAT', 'KOLEKTOR', 'ANAK_KECIL', 'PENGHOBI', 'BURU_BURU'];
    trait = traits[Math.floor(rng() * traits.length)];
  }

  let basePatience = trait === 'BURU_BURU' ? 2 : trait === 'ANAK_KECIL' ? 4 : 3;
  if (state.storeUpgrades.includes('SEATING_AREA')) {
    basePatience += 1;
  }

  // Penghobi seeks 1 discovered species
  let targetSpecies: SpeciesKey | null = null;
  if (trait === 'PENGHOBI') {
    const discoveredKeys = Object.keys(state.discovered) as SpeciesKey[];
    if (discoveredKeys.length > 0) {
      targetSpecies = discoveredKeys[Math.floor(rng() * discoveredKeys.length)];
    }
  }

  // Budget limit for ANAK_KECIL: max 60% of most expensive fair price in display
  const sellable = state.fish.filter((f) => isFishSellable(f));
  let highestFair = 50_000;
  for (const f of sellable) {
    highestFair = Math.max(highestFair, calculateFairFishPrice(f));
  }
  const budgetMax = trait === 'ANAK_KECIL' ? roundTo500(highestFair * 0.60) : Infinity;

  const names = BUYER_NAMES_BY_GROUP[ageGroup];
  const name = names[Math.floor(rng() * names.length)];

  return {
    id: genId('buyer'),
    name,
    ageGroup,
    outfit,
    trait,
    patience: basePatience,
    maxPatience: basePatience,
    targetSpecies,
    budgetMax,
    arrivedAt: now,
  };
}

export function startNegotiation(state: GameState, buyer: Buyer, fish: Fish): NegotiationState {
  const askingPrice = calculateFishPrice(fish, state);
  const fairPrice = calculateFairFishPrice(fish);

  let dialogueKey = 'greeting';
  if (askingPrice <= fairPrice * 0.90) {
    dialogueKey = 'good_price';
  } else if (askingPrice > fairPrice * 1.30) {
    dialogueKey = 'very_expensive';
  } else if (
    fish.rarity === Rarity.EPIC ||
    fish.rarity === Rarity.LEGEND ||
    fish.rarity === Rarity.MYTHIC ||
    fish.rarity === Rarity.HOLY
  ) {
    dialogueKey = 'rare_interest';
  }

  return {
    buyer,
    fishId: fish.id,
    askingPrice,
    fairPrice,
    round: 1,
    patience: buyer.patience,
    maxPatience: buyer.maxPatience,
    counterOffer: null,
    dialogueKey,
    dialogueText: '',
    status: 'ACTIVE',
  };
}

export function getDealProbability(
  state: GameState,
  neg: NegotiationState,
  fish: Fish,
  askingPrice: number
): { dealProb: number; maxWilling: number } {
  const fair = neg.fairPrice;
  const sp = makeSpeciesKey(fish.body, fish.fin);
  const isRare =
    fish.rarity === Rarity.RARE ||
    fish.rarity === Rarity.EPIC ||
    fish.rarity === Rarity.LEGEND ||
    fish.rarity === Rarity.MYTHIC ||
    fish.rarity === Rarity.HOLY;

  let maxWillingMult = 1.08;
  let prob = 0.58;

  if (neg.buyer.trait === 'HEMAT') {
    maxWillingMult = 0.85;
    if (askingPrice > fair) prob -= 0.15;
  } else if (neg.buyer.trait === 'KOLEKTOR') {
    maxWillingMult = isRare ? 1.30 : 1.12;
    if (isRare) prob += 0.20;
  } else if (neg.buyer.trait === 'PENGHOBI') {
    maxWillingMult = neg.buyer.targetSpecies === sp ? 1.25 : 1.05;
    if (neg.buyer.targetSpecies === sp) prob += 0.25;
  } else if (neg.buyer.trait === 'BURU_BURU') {
    maxWillingMult = 1.12;
    if (neg.round === 1) prob += 0.10;
  } else if (neg.buyer.trait === 'ANAK_KECIL') {
    maxWillingMult = 1.02;
  }

  // Decor bonus: +2% per decor, max +10%
  const decorBonus = Math.min(0.10, state.decorations.length * 0.02);
  prob += decorBonus;

  if (state.storeUpgrades.includes('PILLAR_TERRAIN')) prob += 0.05;
  if (state.staff.includes('SINTA')) prob += 0.05;
  if (state.saleEvent.active) prob += GameConfig.SALE_BONUS_DEAL;

  // Price ratio adjustment
  const ratio = fair > 0 ? askingPrice / fair : 1;
  if (ratio <= 0.90) prob += 0.20;
  else if (ratio <= 1.0) prob += 0.08;
  else if (ratio > 1.15) prob -= (ratio - 1.15) * 0.8;

  let maxWilling = roundTo500(fair * maxWillingMult);
  if (neg.buyer.trait === 'ANAK_KECIL' && Number.isFinite(neg.buyer.budgetMax)) {
    maxWilling = Math.min(maxWilling, neg.buyer.budgetMax);
  }

  return {
    dealProb: Math.max(0.08, Math.min(0.95, prob)),
    maxWilling,
  };
}

export function stepNegotiation(
  state: GameState,
  neg: NegotiationState,
  action: 'OFFER' | 'ACCEPT_COUNTER' | 'LOWER_2' | 'RAISE_1',
  rng: Rng = Math.random
): NegotiationState {
  if (neg.status !== 'ACTIVE') return neg;
  const fish = state.fish.find((f) => f.id === neg.fishId);
  if (!fish) return { ...neg, status: 'FAILED', dialogueKey: 'no_fish' };

  if (action === 'ACCEPT_COUNTER' && neg.counterOffer !== null) {
    return {
      ...neg,
      askingPrice: neg.counterOffer,
      status: 'DEAL',
      dialogueKey: 'deal',
    };
  }

  let nextAsking = neg.askingPrice;
  if (action === 'LOWER_2') {
    nextAsking = Math.max(500, roundTo500(neg.askingPrice * 0.98));
  } else if (action === 'RAISE_1') {
    nextAsking = roundTo500(neg.askingPrice * 1.01);
  }

  const { dealProb, maxWilling } = getDealProbability(state, neg, fish, nextAsking);

  // Deal if price <= maxWilling AND random roll succeeds
  if (nextAsking <= maxWilling && rng() < dealProb) {
    return {
      ...neg,
      askingPrice: nextAsking,
      status: 'DEAL',
      dialogueKey: 'deal',
    };
  }

  // Otherwise patience drops
  let patienceLoss = 1;
  if (nextAsking > neg.fairPrice * 1.30) {
    patienceLoss += 1;
  }
  const nextPatience = neg.patience - patienceLoss;

  if (nextPatience <= 0) {
    return {
      ...neg,
      askingPrice: nextAsking,
      patience: 0,
      status: 'FAILED',
      dialogueKey: 'walked_away',
    };
  }

  // Generate counter offer (82–95% of asking price, floor 45% fair price, below asking price)
  const pct = 0.82 + rng() * 0.13;
  const floor = Math.max(500, roundTo500(neg.fairPrice * 0.45));
  let counter = roundTo500(nextAsking * pct);
  if (neg.buyer.trait === 'ANAK_KECIL' && Number.isFinite(neg.buyer.budgetMax)) {
    counter = Math.min(counter, neg.buyer.budgetMax);
  }
  counter = Math.max(floor, Math.min(Math.max(500, nextAsking - 500), counter));

  const dialogueKey = nextAsking > neg.fairPrice * 1.30 ? 'very_expensive' : 'counter_offer';

  return {
    ...neg,
    askingPrice: nextAsking,
    round: neg.round + 1,
    patience: nextPatience,
    counterOffer: counter,
    dialogueKey,
  };
}

export function completeSale(
  state: GameState,
  fishId: string,
  buyerId: string,
  agreedPrice: number,
  now = Date.now()
): { state: GameState; finalRevenue: number } {
  const fish = state.fish.find((f) => f.id === fishId);
  if (!fish) return { state, finalRevenue: 0 };

  let bonusMult = 1;
  if (state.storeUpgrades.includes('MERCH_RACK')) bonusMult += 0.03;
  if (state.staff.includes('BAMBANG')) bonusMult += 0.02;
  const finalRevenue = roundTo500(agreedPrice * bonusMult);

  const nextSaleEvent = state.saleEvent.active
    ? {
        ...state.saleEvent,
        fishSold: state.saleEvent.fishSold + 1,
        revenue: state.saleEvent.revenue + finalRevenue,
      }
    : state.saleEvent;

  return {
    finalRevenue,
    state: {
      ...state,
      money: state.money + finalRevenue,
      fish: state.fish.filter((f) => f.id !== fishId),
      buyers: state.buyers.filter((b) => b.id !== buyerId),
      saleEvent: nextSaleEvent,
      stats: {
        ...state.stats,
        fishSold: state.stats.fishSold + 1,
        totalRevenue: state.stats.totalRevenue + finalRevenue,
        highestSalePrice: Math.max(state.stats.highestSalePrice, finalRevenue),
      },
      activityLog: addActivity(
        state,
        'sale',
        `Terjual ${formatSpeciesName(fish.body, fish.fin, 'id')} (${fish.rarity}) seharga Rp${finalRevenue.toLocaleString('id-ID')}.`,
        `Sold ${formatSpeciesName(fish.body, fish.fin, 'en')} (${fish.rarity}) for Rp${finalRevenue.toLocaleString('id-ID')}.`,
        now
      ),
    },
  };
}

export function feedTank(
  state: GameState,
  tank: number,
  feedType: FeedType,
  now = Date.now()
): { ok: boolean; state: GameState } {
  const itemKey = feedType === 'REGULAR' ? 'FEED_REGULAR' : 'FEED_PREMIUM';
  if ((state.inventory[itemKey] ?? 0) <= 0) {
    return { ok: false, state };
  }

  const fedGain = feedType === 'REGULAR' ? 50 : 100;
  const healthGain = feedType === 'PREMIUM' ? 10 : 0;

  // Feeding feeds all fish in active tank AND Isolation Tank (§4.2)
  const updatedFish = state.fish.map((f) => {
    if (f.tank === tank || f.inIsolation) {
      const nextHealth = Math.min(100, f.health + healthGain);
      return {
        ...f,
        fed: Math.min(100, f.fed + fedGain),
        health: nextHealth,
        healthZeroSince: nextHealth > 0 ? null : f.healthZeroSince,
      };
    }
    return f;
  });

  return {
    ok: true,
    state: {
      ...state,
      fish: updatedFish,
      inventory: {
        ...state.inventory,
        [itemKey]: state.inventory[itemKey] - 1,
      },
      stats: {
        ...state.stats,
        feedGiven: state.stats.feedGiven + 1,
      },
      activityLog: addActivity(
        state,
        'info',
        `Memberi ${feedType === 'REGULAR' ? 'Pakan Biasa' : 'Pakan Premium'} di Tank ${tank}.`,
        `Fed Tank ${tank} with ${feedType === 'REGULAR' ? 'Regular Feed' : 'Premium Feed'}.`,
        now
      ),
    },
  };
}

export function applySupplyToFish(
  state: GameState,
  fishId: string,
  item: 'MED_FUNGUS' | 'MED_ICH' | 'VITAMIN' | 'INSTAGROW' | 'INSTABIRTH',
  now = Date.now(),
  rng: Rng = Math.random
): {
  ok: boolean;
  reason?: string;
  state: GameState;
  birthOutcome?: BirthOutcome;
} {
  if ((state.inventory[item] ?? 0) <= 0) {
    return { ok: false, reason: 'no_stock', state };
  }
  const fish = state.fish.find((f) => f.id === fishId);
  if (!fish) return { ok: false, reason: 'no_fish', state };

  if (item === 'MED_FUNGUS' || item === 'MED_ICH') {
    const needed = item === 'MED_FUNGUS' ? 'FUNGUS' : 'ICH';
    if (fish.sick === null) {
      return { ok: false, reason: 'not_sick', state };
    }
    if (fish.sick !== needed) {
      // Wrong medicine -> toast "Obat tidak cocok", dose NOT consumed (§11.1)
      return { ok: false, reason: 'wrong_medicine', state };
    }
    const updatedFish = state.fish.map((f) =>
      f.id === fishId
        ? {
            ...f,
            sick: null,
            health: Math.min(100, f.health + 15),
            healthZeroSince: null,
            statusBannerUntil: now + GameConfig.STATUS_BANNER_MS,
          }
        : f
    );
    return {
      ok: true,
      state: {
        ...state,
        fish: updatedFish,
        inventory: { ...state.inventory, [item]: state.inventory[item] - 1 },
        stats: { ...state.stats, fishCured: state.stats.fishCured + 1 },
        activityLog: addActivity(
          state,
          'cure',
          `${formatSpeciesName(fish.body, fish.fin, 'id')} sembuh dari sakit!`,
          `${formatSpeciesName(fish.body, fish.fin, 'en')} was cured!`,
          now
        ),
      },
    };
  }

  if (item === 'VITAMIN') {
    const updatedFish = state.fish.map((f) =>
      f.id === fishId
        ? {
            ...f,
            health: Math.min(100, f.health + 40),
            fed: Math.min(100, f.fed + 20),
            healthZeroSince: null,
          }
        : f
    );
    return {
      ok: true,
      state: {
        ...state,
        fish: updatedFish,
        inventory: { ...state.inventory, VITAMIN: state.inventory.VITAMIN - 1 },
      },
    };
  }

  if (item === 'INSTAGROW') {
    const nextStageMap: Record<Stage, Stage | null> = {
      [Stage.BABY]: Stage.CHILD,
      [Stage.CHILD]: Stage.TEEN,
      [Stage.TEEN]: Stage.ADULT,
      [Stage.ADULT]: Stage.OLD,
      [Stage.OLD]: null,
    };
    const nextStage = nextStageMap[fish.stage];
    if (!nextStage) return { ok: false, reason: 'max_stage', state };

    const updatedFish = state.fish.map((f) =>
      f.id === fishId
        ? {
            ...f,
            stage: nextStage,
            stageStartedAt: now,
            stageElapsedMs: 0,
            statusBannerUntil: now + GameConfig.STATUS_BANNER_MS,
          }
        : f
    );
    return {
      ok: true,
      state: {
        ...state,
        fish: updatedFish,
        inventory: { ...state.inventory, INSTAGROW: state.inventory.INSTAGROW - 1 },
      },
    };
  }

  if (item === 'INSTABIRTH') {
    if (fish.pregnantRemainingMs === null) {
      return { ok: false, reason: 'not_pregnant', state };
    }
    const birth = giveBirth(state, fishId, now, rng);
    return {
      ok: true,
      birthOutcome: birth,
      state: {
        ...birth.state,
        inventory: {
          ...birth.state.inventory,
          INSTABIRTH: birth.state.inventory.INSTABIRTH - 1,
        },
      },
    };
  }

  return { ok: false, state };
}

export function tickSimulation(
  prevState: GameState,
  elapsedMs: number,
  timeMode: TimeMode,
  now = Date.now(),
  rng: Rng = Math.random
): { state: GameState; summary: OfflineSummary } {
  const dt = Math.max(0, Math.min(elapsedMs, GameConfig.OFFLINE_CAP_MS));
  let state = prevState;

  const summary: OfflineSummary = {
    elapsedMs: dt,
    fishGrown: 0,
    fishBorn: 0,
    fishSick: 0,
    fishDied: 0,
    researchCompleted: null,
  };

  if (dt <= 0) return { state, summary };

  // 1. Research progression
  let research = { ...state.research };
  let activeResearch = state.activeResearch ? { ...state.activeResearch } : null;
  let log = state.activityLog;

  if (activeResearch) {
    activeResearch.remainingMs -= dt;
    if (activeResearch.remainingMs <= 0) {
      const donePath = activeResearch.path;
      research[donePath] = activeResearch.targetLevel;
      summary.researchCompleted = donePath;
      activeResearch = null;
      log = [
        {
          id: genId('act'),
          timestamp: now,
          type: 'research' as const,
          messageId: `Riset ${donePath} Lv${research[donePath]} selesai!`,
          messageEn: `${donePath} Research Lv${research[donePath]} complete!`,
        },
        ...log,
      ].slice(0, 30);

      // Update fragile flags if ENVIRONMENT leveled up
      if (donePath === 'ENVIRONMENT') {
        state = {
          ...state,
          fish: state.fish.map((f) => ({
            ...f,
            fragile: isFragileForEnv(makeSpeciesKey(f.body, f.fin), research.ENVIRONMENT),
          })),
        };
      }
    }
  }

  // 2. Breeding cooldowns
  const nextCooldowns: Record<string, number> = {};
  for (const [k, rem] of Object.entries(state.breedingCooldowns)) {
    const v = rem - dt;
    if (v > 0) nextCooldowns[k] = v;
  }

  // 3. Fish simulation (growth, hunger, health, sickness, pregnancy)
  const stageDurations = timeMode === 'fast' ? GameConfig.GROW_FAST_MS : GameConfig.GROW_REAL_MS;
  const fedEmptyMs = timeMode === 'fast' ? GameConfig.FED_EMPTY_FAST_MS : GameConfig.FED_EMPTY_REAL_MS;
  const starveHealthMs =
    timeMode === 'fast' ? GameConfig.STARVE_HEALTH_FAST_MS : GameConfig.STARVE_HEALTH_REAL_MS;
  const deathDelayMs =
    timeMode === 'fast' ? GameConfig.DEATH_DELAY_FAST_MS : GameConfig.DEATH_DELAY_REAL_MS;
  const recoverIntervalMs =
    timeMode === 'fast' ? GameConfig.RECOVER_RATE_FAST_MS : GameConfig.RECOVER_RATE_REAL_MS;

  const foodResearchMult = 1 - (GameConfig.FOOD_REDUCTION[research.FOOD] ?? 0);
  const mayaMult = state.staff.includes('MAYA') ? 0.5 : 1;

  // Count sick fish per tank for contagion
  const sickByTank: Record<number, number> = {};
  for (const f of state.fish) {
    if (!f.inIsolation && f.sick !== null) {
      sickByTank[f.tank] = (sickByTank[f.tank] ?? 0) + 1;
    }
  }

  const survivingFish: Fish[] = [];
  const mothersReadyToBirth: string[] = [];

  for (const f of state.fish) {
    const tankUpgrades = state.tankUpgrades[f.tank] ?? [];
    const magicAuras = getTankMagicAuraIds(state, f.tank, f.inIsolation);
    const hasPlantNutrition = !f.inIsolation && tankUpgrades.includes('PLANT_NUTRITION');
    const hasPlantMed = !f.inIsolation && tankUpgrades.includes('PLANT_MEDICINE');
    const hasSnail = !f.inIsolation && tankUpgrades.includes('CLEANING_SNAIL');
    const hasPowerFilter = !f.inIsolation && tankUpgrades.includes('POWER_FILTER');
    const hasTempReg = !f.inIsolation && tankUpgrades.includes('TEMP_REGULATOR');
    const hasAeration = !f.inIsolation && tankUpgrades.includes('AERATION');

    const hasMagicFood = magicAuras.has(2);
    const hasMagicHealer = magicAuras.has(3);
    const hasMagicGrowth = magicAuras.has(4);
    const hasMagicVitality = magicAuras.has(5);

    // Growth
    let stage = f.stage;
    let stageElapsedMs = f.stageElapsedMs + dt * (hasMagicGrowth && (f.stage === Stage.BABY || f.stage === Stage.CHILD || f.stage === Stage.TEEN) ? 1 / 0.7 : 1);
    let stageChanged = false;
    const order: Stage[] = [Stage.BABY, Stage.CHILD, Stage.TEEN, Stage.ADULT, Stage.OLD];
    let idx = order.indexOf(stage);
    while (idx < order.length - 1) {
      const req = stageDurations[stage];
      if (stageElapsedMs >= req) {
        stageElapsedMs -= req;
        idx += 1;
        stage = order[idx];
        stageChanged = true;
        summary.fishGrown += 1;
      } else {
        break;
      }
    }

    // Hunger
    let hungerRateMult = foodResearchMult;
    if (hasPlantNutrition) hungerRateMult *= 0.75;
    if (hasMagicFood) hungerRateMult *= 0.60;
    const fedDrop = (100 / fedEmptyMs) * dt * hungerRateMult;
    let fed = Math.max(0, f.fed - fedDrop);

    // Health
    let health = f.health;
    let sick = f.sick;

    // Self-heal from Magic Healer (1% per min in fast, 1% per hr in real)
    if (sick !== null && hasMagicHealer) {
      const selfCureRate = timeMode === 'fast' ? 0.01 * (dt / 60_000) : 0.01 * (dt / 3_600_000);
      if (rng() < Math.min(0.95, selfCureRate)) {
        sick = null;
      }
    }

    // Random sickness & contagion
    if (sick === null) {
      let sickMult = foodResearchMult * mayaMult;
      if (hasSnail) sickMult *= 0.9;
      if (hasPowerFilter) sickMult *= 0.8;
      if (hasPlantMed) sickMult *= 0.7;
      if (hasMagicVitality) sickMult *= 0.6;

      const baseSickProb =
        timeMode === 'fast'
          ? GameConfig.SICK_CHANCE_PER_MIN_FAST * (dt / 60_000)
          : GameConfig.SICK_CHANCE_PER_HR_REAL * (dt / 3_600_000);

      let contagionProb = 0;
      if (!f.inIsolation) {
        const sickNeighbors = sickByTank[f.tank] ?? 0;
        if (sickNeighbors > 0) {
          const baseContagion =
            timeMode === 'fast'
              ? GameConfig.CONTAGION_PER_MIN_FAST * (dt / 60_000)
              : GameConfig.CONTAGION_PER_HR_REAL * (dt / 3_600_000);
          contagionProb = baseContagion * sickNeighbors * (hasPowerFilter ? 0.5 : 1);
        }
      }

      const totalSickProb = Math.min(0.95, baseSickProb * sickMult + contagionProb);
      if (rng() < totalSickProb) {
        sick = rng() < 0.5 ? 'FUNGUS' : 'ICH';
        summary.fishSick += 1;
      }
    }

    // Health drop or recovery
    let healthDrainRate = 0;
    if (fed <= 0) {
      healthDrainRate += 100 / starveHealthMs;
    }
    if (sick !== null) {
      healthDrainRate += (100 / starveHealthMs) * 0.65;
    }
    if (f.fragile) {
      healthDrainRate = (healthDrainRate > 0 ? healthDrainRate * 2 : (100 / starveHealthMs) * 0.35);
    }
    if (hasAeration && healthDrainRate > 0) {
      healthDrainRate *= 0.75;
    }

    if (healthDrainRate > 0) {
      health = Math.max(0, health - healthDrainRate * dt);
    } else if (fed > 50 && sick === null && health < 100) {
      let recMult = 1;
      if (hasTempReg) recMult *= 1.25;
      if (hasMagicVitality) recMult *= 1.50;
      health = Math.min(100, health + (dt / recoverIntervalMs) * recMult);
    }

    // Death delay when health <= 0
    let healthZeroSince = f.healthZeroSince;
    if (health <= 0) {
      if (healthZeroSince === null) {
        healthZeroSince = 0;
      } else {
        healthZeroSince += dt;
      }
      if (healthZeroSince >= deathDelayMs) {
        summary.fishDied += 1;
        const causeId = sick ? 'sakit' : f.fragile ? 'air tidak cocok' : 'kelaparan';
        const causeEn = sick ? 'sickness' : f.fragile ? 'unsuitable water' : 'starvation';
        log = [
          {
            id: genId('act'),
            timestamp: now,
            type: 'death' as const,
            messageId: `${formatSpeciesName(f.body, f.fin, 'id')} mati karena ${causeId}.`,
            messageEn: `${formatSpeciesName(f.body, f.fin, 'en')} died from ${causeEn}.`,
          },
          ...log,
        ].slice(0, 30);
        continue; // fish removed
      }
    } else {
      healthZeroSince = null;
    }

    // Pregnancy
    let pregnantRemainingMs = f.pregnantRemainingMs;
    if (pregnantRemainingMs !== null) {
      pregnantRemainingMs -= dt;
      if (pregnantRemainingMs <= 0) {
        pregnantRemainingMs = 0;
        mothersReadyToBirth.push(f.id);
      }
    }

    survivingFish.push({
      ...f,
      stage,
      stageElapsedMs,
      fed,
      health,
      healthZeroSince,
      sick,
      pregnantRemainingMs,
      statusBannerUntil: stageChanged ? now + GameConfig.STATUS_BANNER_MS : f.statusBannerUntil,
    });
  }

  let nextState: GameState = {
    ...state,
    fish: survivingFish,
    research,
    activeResearch,
    breedingCooldowns: nextCooldowns,
    stats: {
      ...state.stats,
      fishDied: state.stats.fishDied + summary.fishDied,
      playTimeMs: state.stats.playTimeMs + (dt <= 5000 ? dt : 0),
    },
    activityLog: log,
    lastSavedAt: now,
  };

  // Process births
  for (const mId of mothersReadyToBirth) {
    const birth = giveBirth(nextState, mId, now, rng);
    nextState = birth.state;
    summary.fishBorn += birth.bornCount;
    summary.fishDied += birth.eatenCount + birth.waterDiedCount;
  }

  // 4. Auto-Feeder check per owned tank (when avg Fed < 40% and stock > 0)
  for (const tankId of nextState.tanksOwned) {
    const ups = nextState.tankUpgrades[tankId] ?? [];
    if (ups.includes('AUTO_FEEDER') && (nextState.inventory.FEED_REGULAR ?? 0) > 0) {
      const tankFish = nextState.fish.filter((f) => !f.inIsolation && f.tank === tankId);
      if (tankFish.length > 0) {
        const avgFed = tankFish.reduce((s, f) => s + f.fed, 0) / tankFish.length;
        if (avgFed < 40) {
          const fedRes = feedTank(nextState, tankId, 'REGULAR', now);
          if (fedRes.ok) nextState = fedRes.state;
        }
      }
    }
  }

  // 5. SALE event & Buyer arrivals (only during active short ticks <= 60s)
  if (dt <= 60_000) {
    let saleEvent = { ...nextState.saleEvent };
    if (saleEvent.active) {
      if (now >= saleEvent.endsAt) {
        saleEvent.active = false;
      } else {
        const sec = Math.floor((now - saleEvent.startedAt) / 1000);
        const lastSec =
          saleEvent.popularityHistory.length > 0
            ? saleEvent.popularityHistory[saleEvent.popularityHistory.length - 1].timeSec
            : -1;
        if (sec > lastSec) {
          saleEvent.popularityHistory = [
            ...saleEvent.popularityHistory,
            { timeSec: sec, pop: calculatePopularity(nextState) },
          ];
        }
      }
    }
    nextState = { ...nextState, saleEvent };

    const maxQ = getMaxBuyerQueue(nextState);
    let nextBuyerInMs = nextState.nextBuyerInMs - dt;
    let buyers = [...nextState.buyers];

    if (nextBuyerInMs <= 0) {
      if (buyers.length < maxQ) {
        const buyer = generateBuyer(nextState, now, rng);
        buyers.push(buyer);
        if (nextState.saleEvent.active) {
          nextState = {
            ...nextState,
            saleEvent: {
              ...nextState.saleEvent,
              buyersArrived: nextState.saleEvent.buyersArrived + 1,
            },
          };
        }
      }
      nextBuyerInMs = getBuyerIntervalMs(nextState);
    }
    nextState = { ...nextState, buyers, nextBuyerInMs };
  }

  return { state: nextState, summary };
}
