import { GameState, GlobalSettings, SaveSlotSummary } from './types';

const SETTINGS_KEY = 'laguna_fish_global_settings_v2';
const SLOT_KEY_PREFIX = 'laguna_fish_slot_v2_';

export const DEFAULT_SETTINGS: GlobalSettings = {
  languageSelected: false,
  language: 'id',
  timeMode: 'fast',
  soundEnabled: true,
  musicEnabled: false,
  musicTrack: 'akuatik',
  hintsEnabled: true,
  notificationsEnabled: false,
};

export function loadGlobalSettings(): GlobalSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveGlobalSettings(settings: GlobalSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Ignore storage quota errors
  }
}

export function loadSlot(slotIndex: number): GameState | null {
  try {
    const raw = localStorage.getItem(`${SLOT_KEY_PREFIX}${slotIndex}`);
    if (!raw) return null;
    return JSON.parse(raw) as GameState;
  } catch {
    return null;
  }
}

export function saveSlot(state: GameState): void {
  try {
    localStorage.setItem(`${SLOT_KEY_PREFIX}${state.slotIndex}`, JSON.stringify(state));
  } catch {
    // Ignore storage quota errors
  }
}

export function deleteSlot(slotIndex: number): void {
  try {
    localStorage.removeItem(`${SLOT_KEY_PREFIX}${slotIndex}`);
  } catch {
    // Ignore
  }
}

export function listSlotSummaries(): SaveSlotSummary[] {
  return [0, 1, 2, 3].map((slotIndex) => {
    const s = loadSlot(slotIndex);
    if (!s) {
      return { slotIndex, empty: true };
    }
    return {
      slotIndex,
      empty: false,
      money: s.money,
      fishCount: s.fish.length,
      speciesCount: Object.keys(s.discovered).length,
      magicCount: Object.keys(s.magicFound).length,
      lastSavedAt: s.lastSavedAt,
    };
  });
}
