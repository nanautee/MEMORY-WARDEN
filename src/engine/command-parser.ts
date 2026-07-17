import { CommandResult, Level } from "@/types";
import * as Engine from "./wasm-loader";

export function parseCommand(input: string, level?: Level): CommandResult {
  const parts = input.trim().toLowerCase().split(/\s+/);
  const cmd = parts[0];
  const arg = parts[1] ? parseInt(parts[1]) : undefined;

  switch (cmd) {
    case "alloc":
    case "malloc":
      return handleAlloc(arg);
    case "free":
      return handleFree(arg);
    case "defrag":
    case "defragment":
      return handleDefrag();
    case "scan":
    case "leaks":
      return handleScan();
    case "sort":
      return handleSort();
    case "info":
    case "status":
      return handleInfo();
    case "help":
      return handleHelp();
    case "reset":
      return handleReset();
    case "blocks":
      return handleBlocks();
    default:
      return {
        success: false,
        output: `Unknown command: "${cmd}". Type "help" for available commands.`,
        blocks: Engine.getBlocks(),
        usedMemory: Engine.getUsedMemory(),
        totalMemory: Engine.getTotalMemory(),
      };
  }
}

function handleAlloc(size?: number): CommandResult {
  if (size === undefined || isNaN(size) || size <= 0) {
    return {
      success: false,
      output: "Usage: alloc <size_in_bytes>\n  Example: alloc 256",
      blocks: Engine.getBlocks(),
      usedMemory: Engine.getUsedMemory(),
      totalMemory: Engine.getTotalMemory(),
    };
  }

  const id = Engine.alloc(size);
  if (id === -1) {
    return {
      success: false,
      output: `ERROR: Cannot allocate ${size} bytes. Not enough memory or too many blocks.`,
      blocks: Engine.getBlocks(),
      usedMemory: Engine.getUsedMemory(),
      totalMemory: Engine.getTotalMemory(),
    };
  }

  return {
    success: true,
    output: `Allocated ${size} bytes at block #${id} [addr: 0x${(id * 256).toString(16).toUpperCase().padStart(4, "0")}]`,
    blocks: Engine.getBlocks(),
    usedMemory: Engine.getUsedMemory(),
    totalMemory: Engine.getTotalMemory(),
  };
}

function handleFree(id?: number): CommandResult {
  if (id === undefined || isNaN(id)) {
    return {
      success: false,
      output: "Usage: free <block_id>\n  Use 'blocks' to list all block IDs.",
      blocks: Engine.getBlocks(),
      usedMemory: Engine.getUsedMemory(),
      totalMemory: Engine.getTotalMemory(),
    };
  }

  const result = Engine.free(id);
  if (result === -1) {
    return {
      success: false,
      output: `ERROR: Cannot free block #${id}. Invalid ID or already free.`,
      blocks: Engine.getBlocks(),
      usedMemory: Engine.getUsedMemory(),
      totalMemory: Engine.getTotalMemory(),
    };
  }

  return {
    success: true,
    output: `Freed block #${id}. Memory released.`,
    blocks: Engine.getBlocks(),
    usedMemory: Engine.getUsedMemory(),
    totalMemory: Engine.getTotalMemory(),
  };
}

function handleDefrag(): CommandResult {
  const merged = Engine.defragment();
  return {
    success: true,
    output: `Defragmentation complete. Merged ${merged} adjacent free block(s).`,
    blocks: Engine.getBlocks(),
    usedMemory: Engine.getUsedMemory(),
    totalMemory: Engine.getTotalMemory(),
  };
}

function handleScan(): CommandResult {
  const leaks = Engine.scanLeaks();
  if (leaks === 0) {
    return {
      success: true,
      output: "Scan complete. No memory leaks detected.",
      blocks: Engine.getBlocks(),
      usedMemory: Engine.getUsedMemory(),
      totalMemory: Engine.getTotalMemory(),
    };
  }
  return {
    success: false,
    output: `WARNING: ${leaks} memory leak(s) detected!\n  Use 'blocks' to find leaked blocks, then 'free <id>' to fix.`,
    blocks: Engine.getBlocks(),
    usedMemory: Engine.getUsedMemory(),
    totalMemory: Engine.getTotalMemory(),
  };
}

function handleSort(): CommandResult {
  Engine.sortBySize();
  return {
    success: true,
    output: "Blocks sorted by size (ascending).",
    blocks: Engine.getBlocks(),
    usedMemory: Engine.getUsedMemory(),
    totalMemory: Engine.getTotalMemory(),
  };
}

function handleInfo(): CommandResult {
  const used = Engine.getUsedMemory();
  const total = Engine.getTotalMemory();
  const blocks = Engine.getBlocks();
  const freeBlocks = blocks.filter((b) => b.isFree).length;
  const usedBlocks = blocks.length - freeBlocks;
  const frag = blocks.length > 1 ? Math.round(((blocks.length - 1) / Math.max(1, blocks.length)) * 100) : 0;

  return {
    success: true,
    output: [
      "╔══════════════════════════════════╗",
      "║       MEMORY STATUS              ║",
      "╠══════════════════════════════════╣",
      `║  Used:    ${String(used).padStart(6)} / ${String(total).padStart(6)} bytes  ║`,
      `║  Blocks:  ${String(usedBlocks).padStart(3)} used / ${String(freeBlocks).padStart(3)} free        ║`,
      `║  Usage:   ${String(Math.round((used / total) * 100)).padStart(3)}%                       ║`,
      `║  Frag:    ~${String(frag).padStart(3)}%                       ║`,
      "╚══════════════════════════════════╝",
    ].join("\n"),
    blocks,
    usedMemory: used,
    totalMemory: total,
  };
}

function handleHelp(): CommandResult {
  return {
    success: true,
    output: [
      "╔══════════════════════════════════════╗",
      "║       AVAILABLE COMMANDS             ║",
      "╠══════════════════════════════════════╣",
      "║  alloc <size>    - Allocate memory   ║",
      "║  free <id>       - Free a block      ║",
      "║  blocks          - List all blocks   ║",
      "║  defrag          - Defragment memory ║",
      "║  scan            - Scan for leaks    ║",
      "║  sort            - Sort by size      ║",
      "║  info            - Memory status     ║",
      "║  help            - Show this help    ║",
      "║  reset           - Reset level       ║",
      "╚══════════════════════════════════════╝",
    ].join("\n"),
    blocks: Engine.getBlocks(),
    usedMemory: Engine.getUsedMemory(),
    totalMemory: Engine.getTotalMemory(),
  };
}

function handleReset(): CommandResult {
  Engine.resetMemory();
  return {
    success: true,
    output: "Memory reset. All blocks cleared.",
    blocks: [],
    usedMemory: 0,
    totalMemory: Engine.getTotalMemory(),
  };
}

function handleBlocks(): CommandResult {
  const blocks = Engine.getBlocks();
  if (blocks.length === 0) {
    return {
      success: true,
      output: "No memory blocks allocated.",
      blocks: [],
      usedMemory: 0,
      totalMemory: Engine.getTotalMemory(),
    };
  }

  const lines = [
    "╔════════════════════════════════════════════════════╗",
    "║  ID  │ Address │ Size    │ Status   │ Flags       ║",
    "╠════════════════════════════════════════════════════╣",
  ];

  for (const b of blocks) {
    const status = b.isFree ? "  FREE  " : "  USED  ";
    const flags = b.isLeak ? " ⚠ LEAK  " : "          ";
    lines.push(
      `║  ${String(b.id).padStart(3)} │ 0x${b.address.toString(16).toUpperCase().padStart(4, "0")} │ ${String(b.size).padStart(6)}B │ ${status} │${flags}║`
    );
  }

  lines.push("╚════════════════════════════════════════════════════╝");

  return {
    success: true,
    output: lines.join("\n"),
    blocks,
    usedMemory: Engine.getUsedMemory(),
    totalMemory: Engine.getTotalMemory(),
  };
}
