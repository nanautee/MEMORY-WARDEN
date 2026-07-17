"use client";

import { useEffect, useRef } from "react";
import { CommandHistoryEntry } from "@/types";
import GlitchText from "./GlitchText";

interface TerminalProps {
  history: CommandHistoryEntry[];
  introText?: string | false;
}

export default function Terminal({ history, introText }: TerminalProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  return (
    <div className="terminal-output" ref={scrollRef}>
      {introText && introText !== false && (
        <div className="terminal-intro">
          <pre className="ascii-art">{`
 ██████╗ ███╗   ███╗██╗    ███████╗ ██████╗ █████╗ ███╗   ██╗
██╔════╝ ████╗ ████║██║    ██╔════╝██╔════╝██╔══██╗████╗  ██║
██║  ███╗██╔████╔██║██║    ███████╗██║     ███████║██╔██╗ ██║
██║   ██║██║╚██╔╝██║██║    ╚════██║██║     ██╔══██║██║╚██╗██║
╚██████╔╝██║ ╚═╝ ██║██║    ███████║╚██████╗██║  ██║██║ ╚████║
 ╚═════╝ ╚═╝     ╚═╝╚═╝    ╚══════╝ ╚═════╝╚═╝  ╚═╝╚═╝  ╚═══╝
          `}</pre>
          <div className="text-accent">
            <GlitchText text="MEMORY WARDEN v1.0" />
          </div>
          <div className="text-dim">System initialized. Type "help" for commands.</div>
          <div className="text-dim">────────────────────────────────────────</div>
        </div>
      )}
      {history.map((entry, i) => (
        <div key={i} className="terminal-entry">
          <div className="terminal-command">
            <span className="prompt-dollar">$</span> {entry.command}
          </div>
          <pre className={`terminal-output-text ${entry.isError ? "text-error" : "text-success"}`}>
            {entry.output}
          </pre>
        </div>
      ))}
    </div>
  );
}
