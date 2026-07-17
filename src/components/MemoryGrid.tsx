"use client";

import { MemoryBlock } from "@/types";

interface MemoryGridProps {
  blocks: MemoryBlock[];
  totalMemory: number;
}

export default function MemoryGrid({ blocks, totalMemory }: MemoryGridProps) {
  const maxBarWidth = 60;

  return (
    <div className="memory-grid">
      <div className="memory-grid-header">
        <span className="text-dim">MEMORY MAP</span>
        <span className="text-dim">[ {totalMemory} bytes total ]</span>
      </div>
      <div className="memory-bar-container">
        {blocks.map((block) => {
          const width = Math.max(1, Math.round((block.size / totalMemory) * maxBarWidth));
          let barClass = "memory-bar ";
          if (block.isFree) barClass += "memory-bar-free";
          else if (block.isLeak) barClass += "memory-bar-leak";
          else barClass += "memory-bar-used";

          return (
            <div key={block.id} className="memory-bar-row">
              <span className="memory-bar-id">#{String(block.id).padStart(2, "0")}</span>
              <div className={barClass} style={{ width: `${width}ch` }}>
                {"█".repeat(width)}
              </div>
              <span className="memory-bar-size">{block.size}B</span>
              <span className="memory-bar-status">
                {block.isLeak ? "⚠LEAK" : block.isFree ? "FREE" : "USED"}
              </span>
            </div>
          );
        })}
      </div>
      {blocks.length === 0 && (
        <div className="text-dim" style={{ padding: "8px 0" }}>
          No blocks allocated. Memory is empty.
        </div>
      )}
    </div>
  );
}
