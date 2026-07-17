import { MemoryBlock, CommandResult } from "@/types";

interface WasmModule {
  mem_alloc: (size: number) => number;
  mem_free: (id: number) => number;
  mem_defragment: () => number;
  mem_scan_leaks: () => number;
  mem_get_block_count: () => number;
  mem_get_block: (id: number, out: number) => void;
  mem_get_used: () => number;
  mem_get_total: () => number;
  mem_reset: () => void;
  mem_sort_by_size: () => void;
  mem_inject_leak: (id: number) => void;
}

let wasmModule: WasmModule | null = null;

class JSMemoryEngine {
  private blocks: { id: number; address: number; size: number; is_free: boolean; is_leak: boolean }[] = [];
  private usedMemory = 0;
  private totalMemory = 4096;
  private nextAddress = 0;

  mem_alloc(size: number): number {
    if (size <= 0 || this.usedMemory + size > this.totalMemory) return -1;

    let bestIdx = -1;
    let bestSize = this.totalMemory + 1;
    for (let i = 0; i < this.blocks.length; i++) {
      if (this.blocks[i].is_free && this.blocks[i].size >= size) {
        if (this.blocks[i].size < bestSize) {
          bestSize = this.blocks[i].size;
          bestIdx = i;
        }
      }
    }

    if (bestIdx !== -1) {
      const b = this.blocks[bestIdx];
      if (b.size > size) {
        this.blocks.splice(bestIdx + 1, 0, {
          id: bestIdx + 1,
          address: b.address + size,
          size: b.size - size,
          is_free: true,
          is_leak: false,
        });
        this.reindex();
      }
      b.size = size;
      b.is_free = false;
      b.is_leak = false;
      this.usedMemory += size;
      return b.id;
    }

    this.blocks.push({
      id: this.blocks.length,
      address: this.nextAddress,
      size,
      is_free: false,
      is_leak: false,
    });
    this.nextAddress += size;
    this.usedMemory += size;
    return this.blocks.length - 1;
  }

  mem_free(id: number): number {
    if (id < 0 || id >= this.blocks.length) return -1;
    if (this.blocks[id].is_free) return -1;
    this.blocks[id].is_free = true;
    this.blocks[id].is_leak = false;
    this.usedMemory -= this.blocks[id].size;
    return 0;
  }

  mem_defragment(): number {
    let merged = 0;
    for (let i = 0; i < this.blocks.length - 1; i++) {
      if (this.blocks[i].is_free && this.blocks[i + 1].is_free) {
        this.blocks[i].size += this.blocks[i + 1].size;
        this.blocks.splice(i + 1, 1);
        this.reindex();
        merged++;
        i--;
      }
    }
    return merged;
  }

  mem_scan_leaks(): number {
    return this.blocks.filter((b) => b.is_leak).length;
  }

  mem_inject_leak(id: number): void {
    if (id >= 0 && id < this.blocks.length) {
      this.blocks[id].is_leak = true;
    }
  }

  mem_get_block_count(): number {
    return this.blocks.length;
  }

  mem_get_used(): number {
    return this.usedMemory;
  }

  mem_get_total(): number {
    return this.totalMemory;
  }

  mem_reset(): void {
    this.blocks = [];
    this.usedMemory = 0;
    this.nextAddress = 0;
  }

  mem_sort_by_size(): void {
    this.blocks.sort((a, b) => a.size - b.size);
    this.reindex();
  }

  mem_get_blocks(): MemoryBlock[] {
    return this.blocks.map((b) => ({
      id: b.id,
      address: b.address,
      size: b.size,
      isFree: b.is_free,
      isLeak: b.is_leak,
    }));
  }

  setTotalMemory(total: number): void {
    this.totalMemory = total;
  }

  private reindex(): void {
    this.blocks.forEach((b, i) => (b.id = i));
  }
}

const jsEngine = new JSMemoryEngine();

export async function loadWasm(): Promise<boolean> {
  try {
    const response = await fetch("/wasm/memory_warden.wasm");
    if (!response.ok) return false;
    // Wasm loading would go here if compiled
    return false;
  } catch {
    return false;
  }
}

export function getBlocks(): MemoryBlock[] {
  if (wasmModule) {
    const count = wasmModule.mem_get_block_count();
    const blocks: MemoryBlock[] = [];
    for (let i = 0; i < count; i++) {
      // Would read from Wasm memory
    }
    return blocks;
  }
  return jsEngine.mem_get_blocks();
}

export function alloc(size: number): number {
  if (wasmModule) return wasmModule.mem_alloc(size);
  return jsEngine.mem_alloc(size);
}

export function free(id: number): number {
  if (wasmModule) return wasmModule.mem_free(id);
  return jsEngine.mem_free(id);
}

export function defragment(): number {
  if (wasmModule) return wasmModule.mem_defragment();
  return jsEngine.mem_defragment();
}

export function scanLeaks(): number {
  if (wasmModule) return wasmModule.mem_scan_leaks();
  return jsEngine.mem_scan_leaks();
}

export function injectLeak(id: number): void {
  if (wasmModule) wasmModule.mem_inject_leak(id);
  else jsEngine.mem_inject_leak(id);
}

export function getUsedMemory(): number {
  if (wasmModule) return wasmModule.mem_get_used();
  return jsEngine.mem_get_used();
}

export function getTotalMemory(): number {
  if (wasmModule) return wasmModule.mem_get_total();
  return jsEngine.mem_get_total();
}

export function resetMemory(): void {
  if (wasmModule) wasmModule.mem_reset();
  else jsEngine.mem_reset();
}

export function sortBySize(): void {
  if (wasmModule) wasmModule.mem_sort_by_size();
  else jsEngine.mem_sort_by_size();
}

export function setTotalMemory(total: number): void {
  if (wasmModule) wasmModule.mem_reset();
  jsEngine.setTotalMemory(total);
}
