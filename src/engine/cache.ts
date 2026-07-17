const STORAGE_KEY = "memory-warden-save";

export interface GameSave {
  currentLevel: number;
  score: number;
  tutorialDone: boolean;
  completedLevels: number[];
  timestamp: number;
}

const defaultSave: GameSave = {
  currentLevel: 0,
  score: 0,
  tutorialDone: false,
  completedLevels: [],
  timestamp: Date.now(),
};

export function loadSave(): GameSave {
  if (typeof window === "undefined") return defaultSave;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultSave;
    const parsed = JSON.parse(raw) as GameSave;
    return { ...defaultSave, ...parsed };
  } catch {
    return defaultSave;
  }
}

export function saveProgress(data: Partial<GameSave>): GameSave {
  const current = loadSave();
  const updated: GameSave = {
    ...current,
    ...data,
    timestamp: Date.now(),
  };
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }
  return updated;
}

export function markLevelCompleted(levelIdx: number): GameSave {
  const current = loadSave();
  const completed = new Set(current.completedLevels);
  completed.add(levelIdx);
  return saveProgress({
    completedLevels: Array.from(completed).sort((a, b) => a - b),
  });
}

export function clearSave(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
  }
}
