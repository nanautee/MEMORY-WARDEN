"use client";

import { useState, useRef, useEffect } from "react";

interface CommandLineProps {
  onCommand: (cmd: string) => void;
  disabled?: boolean;
}

export default function CommandLine({ onCommand, disabled = false }: CommandLineProps) {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = input.trim();
    if (!cmd) return;

    setHistory((prev) => [...prev, cmd]);
    setHistoryIdx(-1);
    onCommand(cmd);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      const newIdx = historyIdx + 1;
      if (newIdx < history.length) {
        setHistoryIdx(newIdx);
        setInput(history[history.length - 1 - newIdx]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const newIdx = historyIdx - 1;
      if (newIdx >= 0) {
        setHistoryIdx(newIdx);
        setInput(history[history.length - 1 - newIdx]);
      } else {
        setHistoryIdx(-1);
        setInput("");
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="command-line">
      <span className="command-prompt">
        <span className="prompt-user">warden</span>
        <span className="prompt-at">@</span>
        <span className="prompt-host">memory</span>
        <span className="prompt-colon">:</span>
        <span className="prompt-path">~</span>
        <span className="prompt-dollar">$</span>
      </span>
      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className="command-input"
        autoComplete="off"
        spellCheck={false}
        autoFocus
      />
      <span className="cursor-blink">█</span>
    </form>
  );
}
