import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AboutModal,
  ActivityLogModal,
  EpilogueModal,
  FindexModal,
  HelpModal,
  MagicTrophyModal,
  OfflineSummaryModal,
  PedigreeModal,
  SettingsModal,
  StatsModal,
} from './components/EncyclopediaModals';
import { NegotiationModal } from './components/NegotiationModal';
import {
  EggsModal,
  FeedModal,
  ResearchModal,
  SuppliesModal,
  TankUpgradesModal,
} from './components/ShopModals';
import { StoreModal } from './components/StoreModal';
import { PendingDrop } from './components/TankCanvas';
import { ActiveModalType, TankScreen } from './components/TankScreen';
import { TitleMenu } from './components/TitleMenu';
import { audioEngine } from './game/audio';
import { GameConfig, makeSpeciesKey } from './game/config';
import {
  addActivity,
  applySupplyToFish,
  attemptBreeding,
  calculatePopularity,
  completeSale,
  createInitialGameState,
  createStarterGiftFish,
  feedTank,
  getIsolationFishCount,
  getTankFishCount,
  hatchEggs,
  startNegotiation,
  stepNegotiation,
  tickSimulation,
} from './game/rules';
import {
  deleteSlot,
  listSlotSummaries,
  loadGlobalSettings,
  loadSlot,
  saveGlobalSettings,
  saveSlot,
} from './game/storage';
import {
  DecorId,
  EggType,
  FeedType,
  GameState,
  GlobalSettings,
  Language,
  NegotiationState,
  OfflineSummary,
  ResearchPath,
  SaveSlotSummary,
  SpeciesKey,
  StaffId,
  Stage,
  StoreUpgradeId,
  SupplyItemId,
  TankUpgradeId,
} from './game/types';

export default function App() {
  const [settings, setSettings] = useState<GlobalSettings>(() => loadGlobalSettings());
  const [screen, setScreen] = useState<'TITLE' | 'SLOTS' | 'PLAYING'>('TITLE');
  const [slots, setSlots] = useState<SaveSlotSummary[]>(() => listSlotSummaries());
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [activeModal, setActiveModal] = useState<ActiveModalType>(null);
  const [titleOverlay, setTitleOverlay] = useState<
    null | 'TROPHY' | 'STATS' | 'SETTINGS' | 'HELP' | 'ABOUT'
  >(null);

  const [selectedFishIds, setSelectedFishIds] = useState<string[]>([]);
  const [pendingDrop, setPendingDrop] = useState<PendingDrop>(null);
  const [negotiation, setNegotiation] = useState<NegotiationState | null>(null);
  const [activeHintKey, setActiveHintKey] = useState<string | null>(null);
  const [offlineSummary, setOfflineSummary] = useState<OfflineSummary | null>(null);
  const [showEpilogue, setShowEpilogue] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [nowTick, setNowTick] = useState<number>(() => Date.now());

  const toastTimerRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(Date.now());
  const gameStateRef = useRef<GameState | null>(null);
  gameStateRef.current = gameState;

  const lang = settings.language;

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    if (toastTimerRef.current !== null) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToastMessage(null), 3200);
  }, []);

  const triggerHint = useCallback(
    (state: GameState, key: string): GameState => {
      if (!settings.hintsEnabled) return state;
      if (state.hintsShown.includes(key)) return state;
      setActiveHintKey(key);
      return { ...state, hintsShown: [...state.hintsShown, key] };
    },
    [settings.hintsEnabled]
  );

  // Sync body dataset.state
  useEffect(() => {
    document.body.dataset.state = screen === 'PLAYING' ? 'playing' : 'title';
  }, [screen]);

  // Support ?autostart=1
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      const updatedSettings = { ...settings, languageSelected: true };
      setSettings(updatedSettings);
      saveGlobalSettings(updatedSettings);
      const existing = loadSlot(0);
      const loaded = existing ?? createInitialGameState(0, Date.now(), Math.random, true);
      saveSlot(loaded);
      setGameState(loaded);
      lastTickRef.current = Date.now();
      setScreen('PLAYING');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Music sync
  useEffect(() => {
    if (settings.musicEnabled && screen === 'PLAYING') {
      audioEngine.startMusic(settings.musicTrack);
    } else {
      audioEngine.stopMusic();
    }
    return () => audioEngine.stopMusic();
  }, [settings.musicEnabled, settings.musicTrack, screen]);

  // Autosave whenever gameState changes
  useEffect(() => {
    if (gameState) {
      saveSlot(gameState);
    }
  }, [gameState]);

  // Save on tab hide/close
  useEffect(() => {
    const flush = () => {
      if (gameStateRef.current) {
        saveSlot({ ...gameStateRef.current, lastSavedAt: Date.now() });
      }
    };
    window.addEventListener('beforeunload', flush);
    return () => window.removeEventListener('beforeunload', flush);
  }, []);

  // 1 Hz real-timestamp game simulation tick
  useEffect(() => {
    if (screen !== 'PLAYING') return;
    lastTickRef.current = Date.now();

    const interval = window.setInterval(() => {
      const now = Date.now();
      const dt = now - lastTickRef.current;
      lastTickRef.current = now;
      setNowTick(now);

      setGameState((prev) => {
        if (!prev) return prev;
        const prevBuyers = prev.buyers.length;
        const prevResearch = prev.activeResearch;
        const prevMagicCount = Object.keys(prev.magicFound).length;

        const { state: next, summary } = tickSimulation(prev, dt, settings.timeMode, now);

        let withHints = next;
        if (summary.researchCompleted && prevResearch) {
          audioEngine.playSfx('discovery', settings.soundEnabled);
          withHints = triggerHint(withHints, 'first_research_done');
        }
        if (withHints.buyers.length > prevBuyers && prevBuyers === 0) {
          withHints = triggerHint(withHints, 'first_buyer');
        }
        if (withHints.fish.some((f) => f.fed < 50)) {
          withHints = triggerHint(withHints, 'first_hungry');
        }
        if (withHints.fish.some((f) => f.sick !== null)) {
          withHints = triggerHint(withHints, 'first_sick');
        }
        if (withHints.fish.some((f) => f.stage === Stage.ADULT)) {
          withHints = triggerHint(withHints, 'first_adult');
        }
        if (withHints.fish.some((f) => f.fragile)) {
          withHints = triggerHint(withHints, 'first_fragile');
        }
        const nextMagicCount = Object.keys(withHints.magicFound).length;
        if (nextMagicCount > prevMagicCount) {
          audioEngine.playSfx('magic', settings.soundEnabled);
          withHints = triggerHint(withHints, 'first_magic');
          if (nextMagicCount === 7 && !withHints.epilogueShown) {
            withHints = { ...withHints, epilogueShown: true };
            setShowEpilogue(true);
          }
        }
        return withHints;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [screen, settings.timeMode, settings.soundEnabled, triggerHint]);

  const updateSettings = (patch: Partial<GlobalSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveGlobalSettings(next);
      return next;
    });
  };

  const handleStartSlot = (slotIndex: number, isNew: boolean) => {
    const now = Date.now();
    let loaded: GameState;
    if (isNew) {
      loaded = createInitialGameState(slotIndex, now, Math.random, false);
      loaded = triggerHint(loaded, 'first_tank');
      saveSlot(loaded);
    } else {
      const existing = loadSlot(slotIndex);
      loaded = existing ?? createInitialGameState(slotIndex, now, Math.random, false);
      // Real Time offline progression
      if (settings.timeMode === 'real' && existing) {
        const offlineMs = Math.max(0, now - existing.lastSavedAt);
        if (offlineMs >= 30_000) {
          const { state: progressed, summary } = tickSimulation(
            existing,
            offlineMs,
            'real',
            now
          );
          loaded = progressed;
          setOfflineSummary(summary);
        }
      }
    }
    setGameState(loaded);
    setSelectedFishIds([]);
    setPendingDrop(null);
    setNegotiation(null);
    setActiveModal(null);
    lastTickRef.current = now;
    setScreen('PLAYING');
    setSlots(listSlotSummaries());
  };

  const handleDeleteSlot = (slotIndex: number) => {
    deleteSlot(slotIndex);
    setSlots(listSlotSummaries());
  };

  const handleSelectFish = (fishId: string) => {
    audioEngine.playSfx('click', settings.soundEnabled);
    const now = Date.now();
    setGameState((prev) =>
      prev
        ? {
            ...prev,
            fish: prev.fish.map((f) =>
              f.id === fishId
                ? { ...f, statusBannerUntil: now + GameConfig.STATUS_BANNER_MS }
                : f
            ),
          }
        : prev
    );

    setSelectedFishIds((prev) => {
      if (prev.includes(fishId)) {
        return prev.filter((id) => id !== fishId);
      }
      if (prev.length >= 2) {
        return [prev[1], fishId];
      }
      return [...prev, fishId];
    });
  };

  const handleDropAtWater = () => {
    if (!pendingDrop || !gameState) return;
    const now = Date.now();

    if (pendingDrop.kind === 'egg') {
      const res = hatchEggs(gameState, pendingDrop.eggType, gameState.activeTank, now);
      if (!res.ok) {
        audioEngine.playSfx('error', settings.soundEnabled);
        if (res.errorKey === 'tank_full') {
          showToast(
            lang === 'id'
              ? 'Tank penuh — jual ikan atau beli tank baru'
              : 'Tank full — sell fish or buy a new tank'
          );
          setGameState((p) => (p ? triggerHint(p, 'first_tank_full') : p));
        } else if (res.errorKey === 'no_money') {
          showToast(lang === 'id' ? 'Uang tidak cukup' : 'Not enough coins');
        } else {
          showToast(lang === 'id' ? 'Butuh riset Environment lebih tinggi' : 'Needs higher Environment research');
        }
        setPendingDrop(null);
        return;
      }

      audioEngine.playSfx('hatch', settings.soundEnabled);
      let next = triggerHint(res.state, 'first_egg');
      if (res.fragileBorn) next = triggerHint(next, 'first_fragile');
      if (res.waterDiedCount > 0) next = triggerHint(next, 'first_water_death');
      setGameState(next);
      showToast(
        lang === 'id'
          ? `Menetas ${res.hatchedCount} bayi ikan!`
          : `Hatched ${res.hatchedCount} baby fish!`
      );
      setPendingDrop(null);
    } else if (pendingDrop.kind === 'feed') {
      const res = feedTank(gameState, gameState.activeTank, pendingDrop.feedType, now);
      if (!res.ok) {
        audioEngine.playSfx('error', settings.soundEnabled);
        showToast(lang === 'id' ? 'Stok pakan habis' : 'Out of feed stock');
        setPendingDrop(null);
        return;
      }
      audioEngine.playSfx('bubble', settings.soundEnabled);
      setGameState(res.state);
      // Keep drop armed if more stock remains, or clear after one drop for clean UX
      setPendingDrop(null);
    }
  };

  const handleBuyTank = (tankNum: number) => {
    if (!gameState) return;
    const price = GameConfig.TANK_PRICES[tankNum];
    if (gameState.tanksOwned.includes(tankNum) || gameState.money < price) {
      audioEngine.playSfx('error', settings.soundEnabled);
      return;
    }
    audioEngine.playSfx('buy', settings.soundEnabled);
    setGameState({
      ...gameState,
      money: gameState.money - price,
      tanksOwned: [...gameState.tanksOwned, tankNum].sort(),
      activeTank: tankNum,
      stats: { ...gameState.stats, totalSpent: gameState.stats.totalSpent + price },
      activityLog: addActivity(
        gameState,
        'info',
        `Membeli Tank ${tankNum}!`,
        `Purchased Tank ${tankNum}!`,
        Date.now()
      ),
    });
  };

  const handleQuickBreed = () => {
    if (!gameState || selectedFishIds.length !== 2) return;
    const res = attemptBreeding(
      gameState,
      selectedFishIds[0],
      selectedFishIds[1],
      settings.timeMode,
      Date.now()
    );
    if (!res.ok) {
      audioEngine.playSfx('error', settings.soundEnabled);
      const msg =
        res.reason === 'cooldown'
          ? lang === 'id'
            ? 'Pasangan ini masih cooldown'
            : 'This pair is on cooldown'
          : res.reason === 'already_pregnant'
            ? lang === 'id'
              ? 'Induk sedang hamil'
              : 'Fish is already pregnant'
            : lang === 'id'
              ? 'Pilih 2 ikan Dewasa sehat'
              : 'Select 2 healthy Adult fish';
      showToast(msg);
      return;
    }

    if (res.pregnant) {
      audioEngine.playSfx('discovery', settings.soundEnabled);
      setGameState(triggerHint(res.state, 'first_pregnant'));
      showToast(lang === 'id' ? 'Perjodohan berhasil — ikan hamil!' : 'Breeding succeeded — pregnant!');
    } else {
      audioEngine.playSfx('bubble', settings.soundEnabled);
      setGameState(res.state);
      showToast(lang === 'id' ? 'Belum cocok, coba lagi sebentar lagi.' : 'Did not take, try again shortly.');
    }
  };

  const handleClassicBreed = (isolatedMotherId: string, tankFatherId: string) => {
    if (!gameState) return;
    const res = attemptBreeding(
      gameState,
      isolatedMotherId,
      tankFatherId,
      settings.timeMode,
      Date.now()
    );
    if (!res.ok) {
      audioEngine.playSfx('error', settings.soundEnabled);
      showToast(
        res.reason === 'cooldown'
          ? lang === 'id'
            ? 'Pasangan ini masih cooldown'
            : 'This pair is on cooldown'
          : lang === 'id'
            ? 'Gagal menjodohkan pasangan'
            : 'Could not pair fish'
      );
      return;
    }
    if (res.pregnant) {
      audioEngine.playSfx('discovery', settings.soundEnabled);
      setGameState(triggerHint(res.state, 'first_pregnant'));
      showToast(lang === 'id' ? 'Ikan di Isolasi kini hamil!' : 'Isolated fish is now pregnant!');
    } else {
      audioEngine.playSfx('bubble', settings.soundEnabled);
      setGameState(res.state);
      showToast(lang === 'id' ? 'Belum cocok, coba lagi nanti.' : 'Not compatible yet, try again later.');
    }
  };

  const handleToggleIsolation = (fishId: string) => {
    if (!gameState) return;
    const fish = gameState.fish.find((f) => f.id === fishId);
    if (!fish) return;
    const now = Date.now();

    if (!fish.inIsolation) {
      if (getIsolationFishCount(gameState) >= GameConfig.ISOLATION_CAPACITY) {
        audioEngine.playSfx('error', settings.soundEnabled);
        showToast(lang === 'id' ? 'Tank Isolasi penuh (maks 2)' : 'Isolation Tank full (max 2)');
        return;
      }
      audioEngine.playSfx('bubble', settings.soundEnabled);
      let next: GameState = {
        ...gameState,
        fish: gameState.fish.map((f) =>
          f.id === fishId
            ? {
                ...f,
                inIsolation: true,
                forSale: false,
                statusBannerUntil: now + GameConfig.STATUS_BANNER_MS,
              }
            : f
        ),
      };
      next = triggerHint(next, 'first_isolation');
      setGameState(next);
    } else {
      if (getTankFishCount(gameState, fish.tank) >= GameConfig.TANK_CAPACITY) {
        audioEngine.playSfx('error', settings.soundEnabled);
        showToast(
          lang === 'id'
            ? `Tank ${fish.tank} penuh (21/21)`
            : `Tank ${fish.tank} is full (21/21)`
        );
        return;
      }
      audioEngine.playSfx('bubble', settings.soundEnabled);
      setGameState({
        ...gameState,
        fish: gameState.fish.map((f) =>
          f.id === fishId
            ? { ...f, inIsolation: false, statusBannerUntil: now + GameConfig.STATUS_BANNER_MS }
            : f
        ),
      });
    }
  };

  const handleMoveFishTank = (fishId: string, targetTank: number) => {
    if (!gameState) return;
    if (getTankFishCount(gameState, targetTank) >= GameConfig.TANK_CAPACITY) {
      audioEngine.playSfx('error', settings.soundEnabled);
      showToast(
        lang === 'id' ? `Tank ${targetTank} penuh!` : `Tank ${targetTank} is full!`
      );
      return;
    }
    audioEngine.playSfx('bubble', settings.soundEnabled);
    const now = Date.now();
    setGameState({
      ...gameState,
      fish: gameState.fish.map((f) =>
        f.id === fishId
          ? {
              ...f,
              tank: targetTank,
              inIsolation: false,
              statusBannerUntil: now + GameConfig.STATUS_BANNER_MS,
            }
          : f
      ),
    });
  };

  const handleUseSupplyOnFish = (
    fishId: string,
    item: 'MED_FUNGUS' | 'MED_ICH' | 'VITAMIN' | 'INSTAGROW' | 'INSTABIRTH'
  ) => {
    if (!gameState) return;
    const res = applySupplyToFish(gameState, fishId, item, Date.now());
    if (!res.ok) {
      audioEngine.playSfx('error', settings.soundEnabled);
      if (res.reason === 'wrong_medicine') {
        showToast(lang === 'id' ? 'Obat tidak cocok!' : 'Wrong medicine!');
      } else if (res.reason === 'not_sick') {
        showToast(lang === 'id' ? 'Ikan tidak sedang sakit' : 'Fish is not sick');
      } else if (res.reason === 'not_pregnant') {
        showToast(lang === 'id' ? 'Ikan tidak sedang hamil' : 'Fish is not pregnant');
      } else {
        showToast(lang === 'id' ? 'Tidak bisa dipakai sekarang' : 'Cannot apply right now');
      }
      return;
    }

    audioEngine.playSfx('cure', settings.soundEnabled);
    let next = res.state;
    if (res.birthOutcome && res.birthOutcome.newMagicIds.length > 0) {
      audioEngine.playSfx('magic', settings.soundEnabled);
      next = triggerHint(next, 'first_magic');
      if (Object.keys(next.magicFound).length === 7 && !next.epilogueShown) {
        next = { ...next, epilogueShown: true };
        setShowEpilogue(true);
      }
    }
    setGameState(next);
  };

  const handleAdvanceTutorial = () => {
    if (!gameState) return;
    const nextStep = gameState.tutorialStep + 1;
    let next: GameState = { ...gameState, tutorialStep: nextStep };
    if (nextStep === 4) {
      const gift = createStarterGiftFish(next, Date.now());
      const discovered = { ...next.discovered };
      for (const f of gift) {
        const sp = makeSpeciesKey(f.body, f.fin);
        if (!discovered[sp]) {
          discovered[sp] = { species: sp, discoveredAt: Date.now(), method: 'starter' };
        }
      }
      next = {
        ...next,
        fish: [...next.fish, ...gift],
        discovered,
        activityLog: addActivity(
          next,
          'info',
          'Menerima hadiah awal: 3 ikan Remaja gratis!',
          'Received starter gift: 3 free Teen fish!',
          Date.now()
        ),
      };
      audioEngine.playSfx('hatch', settings.soundEnabled);
    }
    setGameState(next);
  };

  const handleSkipTutorial = () => {
    if (!gameState) return;
    const gift = createStarterGiftFish(gameState, Date.now());
    const discovered = { ...gameState.discovered };
    for (const f of gift) {
      const sp = makeSpeciesKey(f.body, f.fin);
      if (!discovered[sp]) {
        discovered[sp] = { species: sp, discoveredAt: Date.now(), method: 'starter' };
      }
    }
    setGameState({
      ...gameState,
      tutorialStep: 4,
      fish: [...gameState.fish, ...gift],
      discovered,
    });
  };

  // RENDER TITLE / SLOTS
  if (screen !== 'PLAYING' || !gameState) {
    const latestSlot = loadSlot(0);
    return (
      <>
        <TitleMenu
          settings={settings}
          slots={slots}
          mode={screen === 'SLOTS' ? 'SLOTS' : 'TITLE'}
          onSelectLanguage={(l: Language) =>
            updateSettings({ language: l, languageSelected: true })
          }
          onGoToSlots={() => {
            setSlots(listSlotSummaries());
            setScreen('SLOTS');
          }}
          onBackToTitle={() => setScreen('TITLE')}
          onStartSlot={handleStartSlot}
          onDeleteSlot={handleDeleteSlot}
          onOpenOverlay={(ov) => setTitleOverlay(ov)}
        />

        {titleOverlay === 'TROPHY' && (
          <MagicTrophyModal
            magicFound={latestSlot?.magicFound ?? {}}
            lang={lang}
            onClose={() => setTitleOverlay(null)}
          />
        )}
        {titleOverlay === 'STATS' && (
          <StatsModal state={latestSlot} lang={lang} onClose={() => setTitleOverlay(null)} />
        )}
        {titleOverlay === 'SETTINGS' && (
          <SettingsModal
            settings={settings}
            lang={lang}
            onClose={() => setTitleOverlay(null)}
            onUpdateSettings={updateSettings}
          />
        )}
        {titleOverlay === 'HELP' && (
          <HelpModal lang={lang} onClose={() => setTitleOverlay(null)} />
        )}
        {titleOverlay === 'ABOUT' && (
          <AboutModal lang={lang} onClose={() => setTitleOverlay(null)} />
        )}
      </>
    );
  }

  const primaryFish = gameState.fish.find(
    (f) => f.id === selectedFishIds[selectedFishIds.length - 1]
  );

  return (
    <>
      <TankScreen
        state={gameState}
        settings={settings}
        selectedFishIds={selectedFishIds}
        pendingDrop={pendingDrop}
        activeHintKey={activeHintKey}
        toastMessage={toastMessage}
        onSelectFish={handleSelectFish}
        onClearSelection={() => setSelectedFishIds([])}
        onSelectTank={(t) => {
          setGameState({ ...gameState, activeTank: t });
          setSelectedFishIds([]);
        }}
        onBuyTank={handleBuyTank}
        onDropAtWater={handleDropAtWater}
        onCancelPendingDrop={() => setPendingDrop(null)}
        onOpenModal={(m) => setActiveModal(m)}
        onBackToMenu={() => {
          saveSlot(gameState);
          setSlots(listSlotSummaries());
          setScreen('TITLE');
        }}
        onQuickBreed={handleQuickBreed}
        onClassicBreedWithIsolated={handleClassicBreed}
        onToggleForSale={(fishId) =>
          setGameState({
            ...gameState,
            fish: gameState.fish.map((f) =>
              f.id === fishId ? { ...f, forSale: !f.forSale } : f
            ),
          })
        }
        onSetFishMarkup={(fishId, markup) =>
          setGameState({
            ...gameState,
            fish: gameState.fish.map((f) => (f.id === fishId ? { ...f, markup } : f)),
          })
        }
        onMoveFishTank={handleMoveFishTank}
        onToggleIsolation={handleToggleIsolation}
        onUseSupplyOnFish={handleUseSupplyOnFish}
        onDiscardFish={(fishId) => {
          setSelectedFishIds((prev) => prev.filter((x) => x !== fishId));
          setGameState({
            ...gameState,
            fish: gameState.fish.filter((f) => f.id !== fishId),
            stats: {
              ...gameState.stats,
              fishDiscarded: gameState.stats.fishDiscarded + 1,
            },
          });
        }}
        onAdvanceTutorial={handleAdvanceTutorial}
        onSkipTutorial={handleSkipTutorial}
        onDismissHint={() => setActiveHintKey(null)}
        onShowToast={showToast}
      />

      {/* MODALS */}
      {activeModal === 'EGGS' && (
        <EggsModal
          state={gameState}
          lang={lang}
          onClose={() => setActiveModal(null)}
          onSelectEggToDrop={(eggType: EggType) => {
            setPendingDrop({ kind: 'egg', eggType });
            setActiveModal(null);
          }}
        />
      )}

      {activeModal === 'FEED' && (
        <FeedModal
          state={gameState}
          lang={lang}
          onClose={() => setActiveModal(null)}
          onBuyFeed={(feedType: FeedType) => {
            const key: SupplyItemId = feedType === 'REGULAR' ? 'FEED_REGULAR' : 'FEED_PREMIUM';
            const price = GameConfig.SUPPLIES[key].price;
            if (gameState.money < price || (gameState.inventory[key] ?? 0) >= 99) return;
            audioEngine.playSfx('buy', settings.soundEnabled);
            setGameState({
              ...gameState,
              money: gameState.money - price,
              inventory: {
                ...gameState.inventory,
                [key]: (gameState.inventory[key] ?? 0) + 1,
              },
              stats: { ...gameState.stats, totalSpent: gameState.stats.totalSpent + price },
            });
          }}
          onArmFeed={(feedType: FeedType) => {
            setPendingDrop({ kind: 'feed', feedType });
            setActiveModal(null);
          }}
        />
      )}

      {activeModal === 'SUPPLIES' && (
        <SuppliesModal
          state={gameState}
          lang={lang}
          onClose={() => setActiveModal(null)}
          onBuySupply={(item: SupplyItemId) => {
            const cfg = GameConfig.SUPPLIES[item];
            if (gameState.money < cfg.price) return;
            audioEngine.playSfx('buy', settings.soundEnabled);
            setGameState({
              ...gameState,
              money: gameState.money - cfg.price,
              inventory: {
                ...gameState.inventory,
                [item]: (gameState.inventory[item] ?? 0) + cfg.doses,
              },
              stats: { ...gameState.stats, totalSpent: gameState.stats.totalSpent + cfg.price },
            });
          }}
          onActivateDiscoveryPotion={() => {
            if ((gameState.inventory.DISCOVERY_POTION ?? 0) <= 0 || gameState.discoveryPotionActive)
              return;
            audioEngine.playSfx('discovery', settings.soundEnabled);
            setGameState({
              ...gameState,
              inventory: {
                ...gameState.inventory,
                DISCOVERY_POTION: gameState.inventory.DISCOVERY_POTION - 1,
              },
              discoveryPotionActive: true,
            });
            showToast(
              lang === 'id'
                ? 'Discovery Potion aktif untuk kehamilan berikutnya!'
                : 'Discovery Potion armed for next breeding!'
            );
          }}
        />
      )}

      {activeModal === 'RESEARCH' && (
        <ResearchModal
          state={gameState}
          timeMode={settings.timeMode}
          lang={lang}
          onClose={() => setActiveModal(null)}
          onStartResearch={(path: ResearchPath) => {
            const curLv = gameState.research[path];
            if (curLv >= 3 || gameState.activeResearch) return;
            const cost = GameConfig.RESEARCH_COST[path][curLv];
            if (gameState.money < cost) return;
            const durMs =
              settings.timeMode === 'fast'
                ? GameConfig.RESEARCH_FAST_MS[curLv]
                : GameConfig.RESEARCH_REAL_MS[curLv];
            audioEngine.playSfx('buy', settings.soundEnabled);
            setGameState({
              ...gameState,
              money: gameState.money - cost,
              activeResearch: {
                path,
                targetLevel: curLv + 1,
                remainingMs: durMs,
                totalMs: durMs,
              },
              stats: { ...gameState.stats, totalSpent: gameState.stats.totalSpent + cost },
            });
          }}
        />
      )}

      {activeModal === 'TANK_UPGRADES' && (
        <TankUpgradesModal
          state={gameState}
          lang={lang}
          onClose={() => setActiveModal(null)}
          onBuyTankUpgrade={(id: TankUpgradeId) => {
            const price = GameConfig.TANK_UPGRADES[id].price;
            const curUps = gameState.tankUpgrades[gameState.activeTank] ?? [];
            if (curUps.includes(id) || gameState.money < price) return;
            audioEngine.playSfx('buy', settings.soundEnabled);
            setGameState({
              ...gameState,
              money: gameState.money - price,
              tankUpgrades: {
                ...gameState.tankUpgrades,
                [gameState.activeTank]: [...curUps, id],
              },
              stats: { ...gameState.stats, totalSpent: gameState.stats.totalSpent + price },
            });
          }}
        />
      )}

      {activeModal === 'STORE' && (
        <StoreModal
          state={gameState}
          lang={lang}
          now={nowTick}
          onClose={() => setActiveModal(null)}
          onStartNegotiation={(buyerId, fishId) => {
            const buyer = gameState.buyers.find((b) => b.id === buyerId);
            const fish = gameState.fish.find((f) => f.id === fishId);
            if (!buyer || !fish) return;
            setNegotiation(startNegotiation(gameState, buyer, fish));
          }}
          onBuyDecor={(id: DecorId) => {
            const price = GameConfig.DECORATIONS[id];
            if (gameState.decorations.includes(id) || gameState.money < price) return;
            audioEngine.playSfx('buy', settings.soundEnabled);
            setGameState({
              ...gameState,
              money: gameState.money - price,
              decorations: [...gameState.decorations, id],
              stats: { ...gameState.stats, totalSpent: gameState.stats.totalSpent + price },
            });
          }}
          onBuyStoreUpgrade={(id: StoreUpgradeId) => {
            const price = GameConfig.STORE_UPGRADES[id];
            if (gameState.storeUpgrades.includes(id) || gameState.money < price) return;
            audioEngine.playSfx('buy', settings.soundEnabled);
            setGameState({
              ...gameState,
              money: gameState.money - price,
              storeUpgrades: [...gameState.storeUpgrades, id],
              stats: { ...gameState.stats, totalSpent: gameState.stats.totalSpent + price },
            });
          }}
          onHireStaff={(id: StaffId) => {
            const price = GameConfig.STAFF[id];
            if (gameState.staff.includes(id) || gameState.money < price) return;
            audioEngine.playSfx('buy', settings.soundEnabled);
            setGameState({
              ...gameState,
              money: gameState.money - price,
              staff: [...gameState.staff, id],
              stats: { ...gameState.stats, totalSpent: gameState.stats.totalSpent + price },
            });
          }}
          onStartSale={() => {
            const now = Date.now();
            if (gameState.saleEvent.active || gameState.saleEvent.cooldownUntil > now) return;
            audioEngine.playSfx('discovery', settings.soundEnabled);
            const nextPop = calculatePopularity({
              ...gameState,
              saleEvent: { ...gameState.saleEvent, active: true },
            });
            setGameState({
              ...gameState,
              saleEvent: {
                active: true,
                startedAt: now,
                endsAt: now + GameConfig.SALE_DURATION_MS,
                cooldownUntil: now + GameConfig.SALE_DURATION_MS + GameConfig.SALE_COOLDOWN_MS,
                buyersArrived: 0,
                fishSold: 0,
                revenue: 0,
                popularityHistory: [{ timeSec: 0, pop: nextPop }],
              },
            });
          }}
          onStopSale={() => {
            const now = Date.now();
            setGameState({
              ...gameState,
              saleEvent: {
                ...gameState.saleEvent,
                active: false,
                endsAt: now,
                cooldownUntil: now + GameConfig.SALE_COOLDOWN_MS,
              },
            });
          }}
        />
      )}

      {negotiation && (
        <NegotiationModal
          neg={negotiation}
          fish={gameState.fish.find((f) => f.id === negotiation.fishId)}
          lang={lang}
          onAction={(action) => {
            const nextNeg = stepNegotiation(gameState, negotiation, action);
            if (nextNeg.status === 'DEAL') {
              audioEngine.playSfx('deal', settings.soundEnabled);
              const { state: nextState, finalRevenue } = completeSale(
                gameState,
                nextNeg.fishId,
                nextNeg.buyer.id,
                nextNeg.askingPrice,
                Date.now()
              );
              setGameState(nextState);
              setSelectedFishIds((ids) => ids.filter((id) => id !== nextNeg.fishId));
              setNegotiation({ ...nextNeg, finalRevenue });
            } else if (nextNeg.status === 'FAILED') {
              audioEngine.playSfx('error', settings.soundEnabled);
              setGameState({
                ...gameState,
                buyers: gameState.buyers.filter((b) => b.id !== nextNeg.buyer.id),
              });
              setNegotiation(nextNeg);
            } else {
              audioEngine.playSfx('click', settings.soundEnabled);
              setNegotiation(nextNeg);
            }
          }}
          onClose={() => setNegotiation(null)}
        />
      )}

      {activeModal === 'FINDEX' && (
        <FindexModal
          state={gameState}
          lang={lang}
          onClose={() => setActiveModal(null)}
          onChangeSpeciesMarkup={(sp: SpeciesKey, markup: number) =>
            setGameState({
              ...gameState,
              speciesMarkup: { ...gameState.speciesMarkup, [sp]: markup },
            })
          }
        />
      )}

      {activeModal === 'PEDIGREE' && primaryFish && (
        <PedigreeModal
          fish={primaryFish}
          lang={lang}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'MAGIC' && (
        <MagicTrophyModal
          magicFound={gameState.magicFound}
          lang={lang}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'STATS' && (
        <StatsModal
          state={gameState}
          lang={lang}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'SETTINGS' && (
        <SettingsModal
          settings={settings}
          lang={lang}
          onClose={() => setActiveModal(null)}
          onUpdateSettings={updateSettings}
        />
      )}

      {activeModal === 'LOG' && (
        <ActivityLogModal
          entries={gameState.activityLog}
          lang={lang}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'HELP' && (
        <HelpModal lang={lang} onClose={() => setActiveModal(null)} />
      )}

      {activeModal === 'ABOUT' && (
        <AboutModal lang={lang} onClose={() => setActiveModal(null)} />
      )}

      {offlineSummary && (
        <OfflineSummaryModal
          summary={offlineSummary}
          lang={lang}
          onClose={() => setOfflineSummary(null)}
        />
      )}

      {showEpilogue && (
        <EpilogueModal lang={lang} onClose={() => setShowEpilogue(false)} />
      )}
    </>
  );
}
