"use client";

import { useState, useCallback, useEffect } from "react";
import CRTEffect from "@/components/CRTEffect";
import GlitchText from "@/components/GlitchText";
import Terminal from "@/components/Terminal";
import CommandLine from "@/components/CommandLine";
import MemoryGrid from "@/components/MemoryGrid";
import StatusBar from "@/components/StatusBar";
import { parseCommand } from "@/engine/command-parser";
import * as Engine from "@/engine/wasm-loader";
import { loadSave, saveProgress, markLevelCompleted, clearSave } from "@/engine/cache";
import levelsData from "@/levels/levels.json";
import { Level, Objective, CommandHistoryEntry } from "@/types";

type GamePhase = "start" | "tutorial" | "playing";

const TUTORIAL_STEPS = [
  {
    title: "What is Memory?",
    text: "In C, memory is a large block of bytes your program can use. When a program needs space for data, it requests it from the OS. This is called allocation.",
    code: [
      { cmd: "alloc 256", desc: "  <-- Requests 256 bytes of memory" },
    ],
    tip: "Think of memory like a warehouse. You ask for a room of a certain size, and the system gives you one.",
  },
  {
    title: "Allocating Memory",
    text: "Use the alloc command to request memory. You specify the size in bytes. The system gives you a block and returns its ID.",
    code: [
      { cmd: "alloc 256", desc: "  <-- Get a 256-byte block (ID: 0)" },
      { cmd: "alloc 512", desc: "  <-- Get a 512-byte block (ID: 1)" },
      { cmd: "blocks", desc: "      <-- See all allocated blocks" },
    ],
    tip: "Each block gets a unique ID. You'll need this ID to free it later.",
  },
  {
    title: "Freeing Memory",
    text: "When you're done with a block, you MUST free it. If you forget, it becomes a memory leak -- wasted space that can never be reused.",
    code: [
      { cmd: "free 0", desc: "    <-- Release block #0" },
      { cmd: "info", desc: "      <-- Check memory status" },
    ],
    tip: "In real C programs, memory leaks are a serious bug. They slow down and eventually crash the system.",
  },
  {
    title: "Fragmentation",
    text: "Over time, memory gets fragmented -- small free gaps appear between used blocks. This wastes space because you can't combine small gaps into a big one.",
    code: [
      { cmd: "defrag", desc: "    <-- Merge adjacent free blocks" },
    ],
    tip: "Defragmentation pushes free blocks together, creating larger contiguous spaces for new allocations.",
  },
  {
    title: "Memory Leaks",
    text: "Sometimes blocks get 'lost' -- no pointer references them anymore, but they're never freed. These are memory leaks. Use scan to find them.",
    code: [
      { cmd: "scan", desc: "      <-- Search for leaked blocks" },
      { cmd: "blocks", desc: "     <-- Leaks are marked with LEAK" },
      { cmd: "free 2", desc: "   <-- Free the leaked block" },
    ],
    tip: "In the game, leaked blocks are marked with LEAK. Free them to complete the level.",
  },
  {
    title: "Ready to Play!",
    text: "You now know the basics of C memory management. Complete each sector's objectives to restore system integrity. Good luck, Memory Warden.",
    code: [
      { cmd: "help", desc: "      <-- See all commands anytime" },
      { cmd: "info", desc: "      <-- Check current memory status" },
      { cmd: "blocks", desc: "     <-- List all memory blocks" },
    ],
    tip: "Watch the OBJECTIVES panel on the right. Complete all objectives to clear each sector.",
  },
];

export default function Home() {
  const [phase, setPhase] = useState<GamePhase>("start");
  const [tutorialStep, setTutorialStep] = useState(0);
  const [currentLevelIdx, setCurrentLevelIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [history, setHistory] = useState<CommandHistoryEntry[]>([]);
  const [showComplete, setShowComplete] = useState(false);
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const [saveLoaded, setSaveLoaded] = useState(false);

  const levels = levelsData as Level[];
  const currentLevel = levels[currentLevelIdx] || null;

  useEffect(() => {
    const save = loadSave();
    if (save.tutorialDone && save.completedLevels.length > 0) {
      setScore(save.score);
      setCurrentLevelIdx(save.currentLevel);
      setPhase("playing");
      initLevel(save.currentLevel, save);
    } else if (save.tutorialDone) {
      setPhase("playing");
      setScore(save.score);
      setCurrentLevelIdx(0);
      initLevel(0, save);
    }
    setSaveLoaded(true);
  }, []);

  const initLevel = useCallback(
    (idx: number, save?: ReturnType<typeof loadSave>) => {
      Engine.resetMemory();
      const level = levels[idx];
      if (!level) return;

      Engine.setTotalMemory(level.maxMemory);

      for (const block of level.initialBlocks) {
        const id = Engine.alloc(block.size);
        if (block.isFree && id >= 0) {
          Engine.free(id);
        }
        if (block.isLeak && id >= 0) {
          Engine.injectLeak(id);
        }
      }

      const objs = level.objectives.map((o) => ({ ...o, completed: false }));
      setObjectives(objs);
      setShowWalkthrough(false);

      const storyEntry: CommandHistoryEntry = {
        command: "",
        output: level.story,
        isError: false,
        timestamp: Date.now(),
      };
      setHistory([storyEntry]);
    },
    [levels]
  );

  const handleStartTutorial = useCallback(() => {
    setPhase("tutorial");
    setTutorialStep(0);
  }, []);

  const handleSkipTutorial = useCallback(() => {
    saveProgress({ tutorialDone: true });
    setPhase("playing");
    setCurrentLevelIdx(0);
    setScore(0);
    initLevel(0);
  }, [initLevel]);

  const handleNextTutorialStep = useCallback(() => {
    if (tutorialStep < TUTORIAL_STEPS.length - 1) {
      setTutorialStep((s) => s + 1);
    } else {
      saveProgress({ tutorialDone: true });
      setPhase("playing");
      setCurrentLevelIdx(0);
      setScore(0);
      initLevel(0);
    }
  }, [tutorialStep, initLevel]);

  const handlePrevTutorialStep = useCallback(() => {
    if (tutorialStep > 0) {
      setTutorialStep((s) => s - 1);
    }
  }, [tutorialStep]);

  const checkObjectives = useCallback(
    (cmd: string, result: { success: boolean; blocks: { isFree: boolean; isLeak: boolean }[] }) => {
      setObjectives((prev) => {
        const updated = prev.map((obj) => {
          if (obj.completed) return obj;

          switch (obj.type) {
            case "alloc":
              if (cmd.startsWith("alloc ") || cmd.startsWith("malloc ")) {
                return { ...obj, completed: true };
              }
              break;
            case "free":
              if (cmd.startsWith("free ") && result.success) {
                return { ...obj, completed: true };
              }
              break;
            case "defrag":
              if ((cmd === "defrag" || cmd === "defragment") && result.success) {
                return { ...obj, completed: true };
              }
              break;
            case "scan":
              if (cmd === "scan" || cmd === "leaks") {
                return { ...obj, completed: true };
              }
              break;
            case "sort":
              if (cmd === "sort") {
                return { ...obj, completed: true };
              }
              break;
            case "free_all_leaks": {
              const remainingLeaks = result.blocks.filter((b) => b.isLeak).length;
              if (remainingLeaks === 0) {
                return { ...obj, completed: true };
              }
              break;
            }
          }
          return obj;
        });

        const allDone = updated.every((o) => o.completed);
        if (allDone && prev.some((o) => !o.completed)) {
          setTimeout(() => {
            const newScore = score + 100 + currentLevelIdx * 50;
            setScore(newScore);
            setShowComplete(true);
            markLevelCompleted(currentLevelIdx);
            saveProgress({ currentLevel: currentLevelIdx + 1, score: newScore });
          }, 300);
        }

        return updated;
      });
    },
    [currentLevelIdx, score]
  );

  const handleCommand = useCallback(
    (cmd: string) => {
      const result = parseCommand(cmd, currentLevel || undefined);

      const entry: CommandHistoryEntry = {
        command: cmd,
        output: result.output,
        isError: !result.success,
        timestamp: Date.now(),
      };

      setHistory((prev) => [...prev, entry]);
      checkObjectives(cmd, result);
    },
    [currentLevel, checkObjectives]
  );

  const handleNextLevel = useCallback(() => {
    setShowComplete(false);
    const nextIdx = currentLevelIdx + 1;
    if (nextIdx < levels.length) {
      setCurrentLevelIdx(nextIdx);
      saveProgress({ currentLevel: nextIdx });
      initLevel(nextIdx);
    } else {
      setHistory((prev) => [
        ...prev,
        {
          command: "",
          output: "CONGRATULATIONS! All sectors cleared. System integrity restored.",
          isError: false,
          timestamp: Date.now(),
        },
      ]);
    }
  }, [currentLevelIdx, levels.length, initLevel]);

  const handleResetProgress = useCallback(() => {
    clearSave();
    setPhase("start");
    setCurrentLevelIdx(0);
    setScore(0);
    setShowComplete(false);
  }, []);

  const handleWalkthroughCommand = useCallback(
    (cmd: string) => {
      handleCommand(cmd);
      setShowWalkthrough(false);
    },
    [handleCommand]
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "F5") {
        e.preventDefault();
        if (showComplete) handleNextLevel();
      }
      if (e.key === "Enter" && phase === "tutorial") {
        handleNextTutorialStep();
      }
      if (e.key === "Escape" && showWalkthrough) {
        setShowWalkthrough(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [showComplete, handleNextLevel, phase, handleNextTutorialStep, showWalkthrough]);

  if (!saveLoaded) return null;

  // ===== START SCREEN =====
  if (phase === "start") {
    const save = loadSave();
    const hasSave = save.tutorialDone || save.completedLevels.length > 0;

    return (
      <CRTEffect>
        <div className="start-screen">
          <div className="start-title">
            <GlitchText text="MEMORY WARDEN" />
          </div>
          <div className="start-subtitle">
            A retro terminal game about C memory management.
            Allocate, free, defrag, and hunt leaks across 5 sectors.
          </div>
          <button className="start-btn" onClick={handleStartTutorial}>
            {hasSave ? "[ CONTINUE ]" : "[ START ]"}
          </button>
          {hasSave && (
            <button
              className="start-btn"
              style={{ fontSize: "16px", padding: "10px 32px", marginTop: "-8px", opacity: 0.6 }}
              onClick={handleResetProgress}
            >
              [ NEW GAME ]
            </button>
          )}
        </div>
      </CRTEffect>
    );
  }

  // ===== TUTORIAL =====
  if (phase === "tutorial") {
    const step = TUTORIAL_STEPS[tutorialStep];
    const isLast = tutorialStep === TUTORIAL_STEPS.length - 1;

    return (
      <CRTEffect>
        <div className="tutorial-overlay">
          <div className="tutorial-box">
            <div className="tutorial-step-counter">
              TUTORIAL [{String(tutorialStep + 1).padStart(2, "0")}/{String(TUTORIAL_STEPS.length).padStart(2, "0")}]
            </div>
            <div className="tutorial-title">
              <GlitchText text={step.title} />
            </div>
            <div className="tutorial-text">{step.text}</div>
            <div className="tutorial-code-block">
              {step.code.map((line, i) => (
                <div key={i}>
                  <span className="cmd">$ {line.cmd}</span>
                  <span className="desc">{line.desc}</span>
                </div>
              ))}
            </div>
            <div className="tutorial-tip">{step.tip}</div>
            <div className="tutorial-nav">
              <button className="tutorial-btn" onClick={handleSkipTutorial}>
                SKIP
              </button>
              <div className="tutorial-dots">
                {TUTORIAL_STEPS.map((_, i) => (
                  <div
                    key={i}
                    className={`tutorial-dot ${i === tutorialStep ? "tutorial-dot-active" : ""} ${i < tutorialStep ? "tutorial-dot-active" : ""}`}
                    style={i < tutorialStep && i !== tutorialStep ? { opacity: 0.5 } : undefined}
                  />
                ))}
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                {tutorialStep > 0 && (
                  <button className="tutorial-btn" onClick={handlePrevTutorialStep}>
                    BACK
                  </button>
                )}
                <button className="tutorial-btn tutorial-btn-primary" onClick={handleNextTutorialStep}>
                  {isLast ? "[ BEGIN ]" : "NEXT >"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </CRTEffect>
    );
  }

  // ===== GAME =====
  return (
    <CRTEffect>
      <div className="game-container">
        <div className="game-header">
          <div className="game-title">
            <GlitchText text="MEMORY WARDEN" />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ color: "var(--text-dim)", fontSize: "17px" }}>
              {currentLevel
                ? `SECTOR ${String(currentLevel.id).padStart(2, "0")}: ${currentLevel.name}`
                : "ALL SECTORS CLEARED"}
            </div>
            <button
              className="tutorial-btn"
              style={{ fontSize: "13px", padding: "4px 12px" }}
              onClick={handleResetProgress}
            >
              RESET
            </button>
          </div>
        </div>

        <div className="game-main">
          <div className="game-terminal-section">
            <Terminal history={history} introText={false} />
            <CommandLine onCommand={handleCommand} disabled={showComplete} />
          </div>

          <div className="game-sidebar">
            <StatusBar
              level={currentLevel}
              levelIndex={currentLevelIdx}
              score={score}
              usedMemory={Engine.getUsedMemory()}
              totalMemory={Engine.getTotalMemory()}
              objectives={objectives}
            />
            <MemoryGrid
              blocks={Engine.getBlocks()}
              totalMemory={Engine.getTotalMemory()}
            />
            {currentLevel && (
              <div className="hint-panel">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <span className="hint-title" style={{ margin: 0 }}>HINTS</span>
                  <button
                    className="tutorial-btn"
                    style={{
                      fontSize: "12px",
                      padding: "3px 10px",
                      borderColor: showWalkthrough ? "var(--text-accent)" : "var(--green-mid)",
                      color: showWalkthrough ? "var(--text-accent)" : "var(--green-mid)",
                    }}
                    onClick={() => setShowWalkthrough((v) => !v)}
                  >
                    {showWalkthrough ? "HIDE" : "SOLUTION"}
                  </button>
                </div>
                {showWalkthrough && currentLevel.solution && (
                  <div className="walkthrough">
                    <div className="walkthrough-title">WALKTHROUGH</div>
                    {currentLevel.solution.map((step, i) => (
                      <div key={i} className="walkthrough-step">
                        <div className="walkthrough-cmd">
                          <span className="walkthrough-num">{i + 1}.</span>
                          <button
                            className="walkthrough-run"
                            onClick={() => handleWalkthroughCommand(step.cmd)}
                            title="Click to run"
                          >
                            $ {step.cmd}
                          </button>
                        </div>
                        <div className="walkthrough-explain">{step.explain}</div>
                      </div>
                    ))}
                  </div>
                )}
                {!showWalkthrough && currentLevel.hints && (
                  <div className="hint-text">
                    {currentLevel.hints.map((h: string, i: number) => (
                      <div key={i}>{h}</div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {showComplete && (
        <div className="level-complete-overlay">
          <div className="level-complete-box">
            <div className="level-complete-title">
              <GlitchText text="SECTOR CLEARED" />
            </div>
            <div className="level-complete-stats">
              <div>Level {currentLevelIdx + 1}: {currentLevel?.name}</div>
              <div>Score: {score}</div>
              <div style={{ marginTop: "8px", color: "var(--text-dim)" }}>
                Memory integrity restored. Awaiting next sector...
              </div>
            </div>
            <button className="level-complete-btn" onClick={handleNextLevel}>
              {currentLevelIdx + 1 < levels.length
                ? "[ NEXT SECTOR ]"
                : "[ COMPLETE ]"}
            </button>
          </div>
        </div>
      )}
    </CRTEffect>
  );
}
