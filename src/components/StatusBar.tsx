"use client";

import { Level } from "@/types";

interface StatusBarProps {
  level: Level | null;
  levelIndex: number;
  score: number;
  usedMemory: number;
  totalMemory: number;
  objectives: { description: string; completed: boolean }[];
}

export default function StatusBar({ level, levelIndex, score, usedMemory, totalMemory, objectives }: StatusBarProps) {
  const usagePercent = totalMemory > 0 ? Math.round((usedMemory / totalMemory) * 100) : 0;

  return (
    <div className="status-bar">
      <div className="status-bar-row">
        <span className="status-label">LVL</span>
        <span className="status-value">{String(levelIndex + 1).padStart(2, "0")}</span>
        <span className="status-separator">│</span>
        <span className="status-label">SCORE</span>
        <span className="status-value">{String(score).padStart(6, "0")}</span>
        <span className="status-separator">│</span>
        <span className="status-label">MEM</span>
        <span className="status-value">{usagePercent}%</span>
        <span className="status-separator">│</span>
        <span className="status-label">{usedMemory}B / {totalMemory}B</span>
      </div>
      {objectives.length > 0 && (
        <div className="status-bar-row objectives-row">
          <span className="status-label">OBJECTIVES:</span>
          {objectives.map((obj, i) => (
            <span key={i} className={`objective ${obj.completed ? "objective-done" : ""}`}>
              {obj.completed ? "[✓]" : "[ ]"} {obj.description}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
