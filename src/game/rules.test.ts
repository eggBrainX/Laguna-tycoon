import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ALL_SPECIES,
  GameConfig,
  MAGIC_SPECIES_SET,
  makeSpeciesKey,
} from './config';
import {
  applySupplyToFish,
  attemptBreeding,
  calculateFishPrice,
  calculatePopularity,
  completeSale,
  createFish,
  createInitialGameState,
  getBuyerIntervalMs,
  getEggSpeciesPool,
  getSpeciesResistanceK,
  giveBirth,
  hatchEggs,
  isFishSellable,
  startNegotiation,
  stepNegotiation,
  tickSimulation,
} from './rules';
import { BodyPart, Fin, Rarity, Stage } from './types';

test('§6.1 Exact price formula examples match specification', () => {
  const state = createInitialGameState(0, 1000, () => 0.5, true);

  // Example 1: Guppy Round, Common, Adult, markup 5% -> Rp21.000
  const f1 = createFish({
    body: BodyPart.GUPPY,
    fin: Fin.ROUND,
    rarity: Rarity.COMMON,
    stage: Stage.ADULT,
    tank: 1,
    now: 1000,
    envLevel: 0,
  });
  f1.markup = 5;
  assert.equal(calculateFishPrice(f1, state), 21_000);

  // Example 2: Betta Fan, Rare, Adult, markup 5% -> Rp378.000
  const f2 = createFish({
    body: BodyPart.BETTA,
    fin: Fin.FAN,
    rarity: Rarity.RARE,
    stage: Stage.ADULT,
    tank: 1,
    now: 1000,
    envLevel: 2,
  });
  f2.markup = 5;
  assert.equal(calculateFishPrice(f2, state), 378_000);

  // Example 3: Discus Long, Epic, Teen, markup 5% -> 181.440 -> Rp181.500
  const f3 = createFish({
    body: BodyPart.DISCUS,
    fin: Fin.LONG,
    rarity: Rarity.EPIC,
    stage: Stage.TEEN,
    tank: 1,
    now: 1000,
    envLevel: 2,
  });
  f3.markup = 5;
  assert.equal(calculateFishPrice(f3, state), 181_500);

  // Example 4: Koi Fan, Holy, Old, markup 10% -> Rp4.455.000
  const f4 = createFish({
    body: BodyPart.KOI,
    fin: Fin.FAN,
    rarity: Rarity.HOLY,
    stage: Stage.OLD,
    tank: 1,
    now: 1000,
    envLevel: 3,
  });
  f4.markup = 10;
  assert.equal(calculateFishPrice(f4, state), 4_455_000);
});

test('§5.4 Egg pools exclude all 7 Magic Fish and respect K resistance levels', () => {
  const commonPool = getEggSpeciesPool('COMMON');
  const premiumPool = getEggSpeciesPool('PREMIUM');
  const exclusivePool = getEggSpeciesPool('EXCLUSIVE');

  assert.equal(commonPool.length, 9);
  for (const sp of [...commonPool, ...premiumPool, ...exclusivePool]) {
    assert.equal(MAGIC_SPECIES_SET.has(sp), false, `${sp} must not appear in eggs`);
  }
  for (const sp of commonPool) {
    assert.equal(getSpeciesResistanceK(sp), 0);
  }
  for (const sp of premiumPool) {
    assert.ok(getSpeciesResistanceK(sp) <= 1);
  }
  for (const sp of exclusivePool) {
    assert.ok(getSpeciesResistanceK(sp) <= 2);
  }
  // K3 species like KOI_TWIN are only obtainable via breeding
  assert.equal(getSpeciesResistanceK('KOI_TWIN'), 3);
  assert.equal(exclusivePool.includes('KOI_TWIN'), false);
});

test('§8.1 Fish sell eligibility rules', () => {
  const baby = createFish({
    body: BodyPart.GUPPY,
    fin: Fin.ROUND,
    rarity: Rarity.COMMON,
    stage: Stage.BABY,
    tank: 1,
    now: 1000,
    envLevel: 0,
  });
  baby.forSale = true;
  assert.equal(isFishSellable(baby), false);

  const teen = { ...baby, stage: Stage.TEEN };
  assert.equal(isFishSellable(teen), true);

  const sickTeen = { ...teen, sick: 'FUNGUS' as const };
  assert.equal(isFishSellable(sickTeen), false);

  const isolatedTeen = { ...teen, inIsolation: true };
  assert.equal(isFishSellable(isolatedTeen), false);

  const magicAdult = { ...teen, stage: Stage.ADULT, isMagic: true, magicId: 1 };
  assert.equal(isFishSellable(magicAdult), false);
});

test('§4.3 Tank full rejects eggs and eats excess newborn fry', () => {
  let state = createInitialGameState(0, 1000, () => 0.1, true);
  state.money = 500_000;
  // Fill tank 1 to 20 fish (1 slot remaining)
  state.fish = [];
  for (let i = 0; i < 20; i++) {
    state.fish.push(
      createFish({
        body: BodyPart.GUPPY,
        fin: Fin.ROUND,
        rarity: Rarity.COMMON,
        stage: Stage.ADULT,
        tank: 1,
        now: 1000,
        envLevel: 0,
      })
    );
  }

  // Mother pregnant in tank 1 tries to birth 4 babies -> only 1 survives, 3 eaten
  state.fish[0].pregnantRemainingMs = 0;
  state.fish[0].pregnantMateBody = BodyPart.GUPPY;
  state.fish[0].pregnantMateFin = Fin.ROUND;
  const birth = giveBirth(state, state.fish[0].id, 2000, () => 0.99);
  assert.equal(birth.bornCount, 1);
  assert.equal(birth.eatenCount, 3);
  assert.equal(birth.state.fish.filter((f) => f.tank === 1 && !f.inIsolation).length, 21);

  // Now tank 1 has 21 fish -> hatchEggs rejects
  const hatchRes = hatchEggs(birth.state, 'COMMON', 1, 3000, () => 0.5);
  assert.equal(hatchRes.ok, false);
  assert.equal(hatchRes.errorKey, 'tank_full');
});

test('§10 Breeding + Discovery Potion discovers unseen species & Magic Fish', () => {
  let state = createInitialGameState(0, 1000, () => 0.1, true);
  state.fish = [];
  const mother = createFish({
    body: BodyPart.GUPPY,
    fin: Fin.ROUND,
    rarity: Rarity.COMMON,
    stage: Stage.ADULT,
    tank: 1,
    now: 1000,
    envLevel: 3,
  });
  const father = createFish({
    body: BodyPart.KOI,
    fin: Fin.TWIN,
    rarity: Rarity.COMMON,
    stage: Stage.ADULT,
    tank: 1,
    now: 1000,
    envLevel: 3,
  });
  state.fish = [mother, father];
  state.discovered = {
    GUPPY_ROUND: { species: 'GUPPY_ROUND', discoveredAt: 1000, method: 'egg' },
    KOI_TWIN: { species: 'KOI_TWIN', discoveredAt: 1000, method: 'egg' },
  } as any;
  state.discoveryPotionActive = true;

  const breedRes = attemptBreeding(state, mother.id, father.id, 'fast', 1000, () => 0.1);
  assert.equal(breedRes.ok, true);
  assert.equal(breedRes.pregnant, true);

  // Mark remaining species discovered except GUPPY_TWIN (Magic #1)
  for (const sp of ALL_SPECIES) {
    if (sp !== 'GUPPY_TWIN') {
      breedRes.state.discovered[sp] = { species: sp, discoveredAt: 1000, method: 'egg' };
    }
  }

  const birth = giveBirth(breedRes.state, mother.id, 61_000, () => 0.5);
  assert.ok(birth.newSpeciesFound.includes('GUPPY_TWIN'));
  assert.ok(birth.newMagicIds.includes(1));
  const magicBaby = birth.state.fish.find((f) => makeSpeciesKey(f.body, f.fin) === 'GUPPY_TWIN');
  assert.ok(magicBaby);
  assert.equal(magicBaby?.isMagic, true);
});

test('§11 & §12 Medicine mismatch does not consume dose; matching medicine cures', () => {
  let state = createInitialGameState(0, 1000, () => 0.1, true);
  const f = state.fish[0];
  f.sick = 'FUNGUS';
  state.inventory.MED_ICH = 3;
  state.inventory.MED_FUNGUS = 3;

  const wrongRes = applySupplyToFish(state, f.id, 'MED_ICH', 2000);
  assert.equal(wrongRes.ok, false);
  assert.equal(wrongRes.reason, 'wrong_medicine');
  assert.equal(wrongRes.state.inventory.MED_ICH, 3); // Dose NOT consumed

  const rightRes = applySupplyToFish(wrongRes.state, f.id, 'MED_FUNGUS', 2000);
  assert.equal(rightRes.ok, true);
  assert.equal(rightRes.state.inventory.MED_FUNGUS, 2);
  assert.equal(rightRes.state.fish[0].sick, null);
});

test('§8.3 Store Popularity & Buyer interval math', () => {
  let state = createInitialGameState(0, 1000, () => 0.1, true);
  assert.equal(calculatePopularity(state), 0);
  assert.equal(getBuyerIntervalMs(state), 12_000);

  state.research.ADVERTISING = 3; // +30
  state.decorations = ['ROCK', 'SHELL']; // +6
  state.staff = ['SINTA']; // +5
  state.saleEvent.active = true; // +25
  assert.equal(calculatePopularity(state), 66);
});

test('§8 Negotiation DEAL & Revenue bonuses (Rak Merchandise +3%, Bambang +2%)', () => {
  let state = createInitialGameState(0, 1000, () => 0.1, true);
  const f = state.fish[0];
  f.forSale = true;
  state.storeUpgrades = ['MERCH_RACK'];
  state.staff = ['BAMBANG'];

  const buyer = {
    id: 'b1',
    name: 'Pak Budi',
    ageGroup: 'DEWASA' as const,
    outfit: 'BATIK' as const,
    trait: 'KOLEKTOR' as const,
    patience: 3,
    maxPatience: 3,
    targetSpecies: null,
    budgetMax: Infinity,
    arrivedAt: 1000,
  };
  state.buyers = [buyer];

  const neg = startNegotiation(state, buyer, f);
  const stepped = stepNegotiation(state, neg, 'OFFER', () => 0.01);
  assert.equal(stepped.status, 'DEAL');

  const sale = completeSale(state, f.id, buyer.id, stepped.askingPrice, 2000);
  assert.equal(sale.state.fish.some((x) => x.id === f.id), false);
  assert.ok(sale.finalRevenue >= stepped.askingPrice);
});

test('§7 Fast Mode growth timing & Real Time offline progression', () => {
  let state = createInitialGameState(0, 1000, () => 0.5, true);
  const baby = createFish({
    body: BodyPart.GUPPY,
    fin: Fin.ROUND,
    rarity: Rarity.COMMON,
    stage: Stage.BABY,
    tank: 1,
    now: 1000,
    envLevel: 0,
  });
  state.fish = [baby];

  // Fast mode: 60s grows Baby -> Child (30s) -> Teen (30s)
  const res1 = tickSimulation(state, GameConfig.GROW_FAST_MS[Stage.BABY] + GameConfig.GROW_FAST_MS[Stage.CHILD], 'fast', 61_000, () => 0.99);
  assert.equal(res1.state.fish[0].stage, Stage.TEEN);

  // Real mode: 3h grows Teen -> Adult
  const res2 = tickSimulation(res1.state, GameConfig.GROW_REAL_MS[Stage.TEEN], 'real', 61_000 + GameConfig.GROW_REAL_MS[Stage.TEEN], () => 0.99);
  assert.equal(res2.state.fish[0].stage, Stage.ADULT);
});
