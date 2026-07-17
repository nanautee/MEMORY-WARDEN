export interface MemoryBlock {
  id: number;
  address: number;
  size: number;
  isFree: boolean;
  isLeak: boolean;
}

export interface Level {
  id: number;
  name: string;
  description: string;
  story: string;
  hints: string[];
  solution: SolutionStep[];
  objectives: Objective[];
  initialBlocks: InitialBlock[];
  maxMemory: number;
  targetEfficiency?: number;
}

export interface SolutionStep {
  cmd: string;
  explain: string;
}

export interface InitialBlock {
  size: number;
  isFree: boolean;
  isLeak?: boolean;
}

export interface Objective {
  type: "alloc" | "free" | "defrag" | "scan" | "sort" | "free_all_leaks";
  description: string;
  target?: number;
  completed: boolean;
}

export interface GameState {
  currentLevel: number;
  score: number;
  memoryUsed: number;
  memoryTotal: number;
  blocks: MemoryBlock[];
  commandHistory: CommandHistoryEntry[];
  isLevelComplete: boolean;
  gameStarted: boolean;
}

export interface CommandHistoryEntry {
  command: string;
  output: string;
  isError: boolean;
  timestamp: number;
}

export interface CommandResult {
  success: boolean;
  output: string;
  blocks: MemoryBlock[];
  usedMemory: number;
  totalMemory: number;
  levelComplete?: boolean;
}
