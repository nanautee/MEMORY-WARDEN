import { GameState, MemoryBlock, Level, CommandHistoryEntry } from "@/types";
import * as Engine from "./wasm-loader";

const initialState: GameState = {
  currentLevel: 0,
  score: 0,
  memoryUsed: 0,
  memoryTotal: 4096,
  blocks: [],
  commandHistory: [],
  isLevelComplete: false,
  gameStarted: false,
};

let state: GameState = { ...initialState };

export function getState(): GameState {
  return { ...state, blocks: Engine.getBlocks(), memoryUsed: Engine.getUsedMemory() };
}

export function startGame(): void {
  state.gameStarted = true;
  state.currentLevel = 0;
  state.score = 0;
  loadLevel(0);
}

export function loadLevel(levelIndex: number): void {
  Engine.resetMemory();
  state.currentLevel = levelIndex;
  state.isLevelComplete = false;
  state.commandHistory = [];
}

export function setupLevel(level: Level): void {
  Engine.resetMemory();
  Engine.setTotalMemory(level.maxMemory);

  for (const block of level.初始Blocks) {
    const id = Engine.alloc(block.size);
    if (block.isFree && id >= 0) {
      Engine.free(id);
    }
    if (block.isLeak && id >= 0) {
      Engine.injectLeak(id);
    }
  }
}

export function addHistory(entry: CommandHistoryEntry): void {
  state.commandHistory.push(entry);
}

export function setLevelComplete(complete: boolean): void {
  state.isLevelComplete = complete;
}

export function addScore(points: number): void {
  state.score += points;
}

export function nextLevel(): void {
  state.currentLevel++;
}

export function getHistory(): CommandHistoryEntry[] {
  return [...state.commandHistory];
}
