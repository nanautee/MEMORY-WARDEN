"use client";

import { useState, useEffect } from "react";

interface GlitchTextProps {
  text: string;
  className?: string;
  glitchOnChange?: boolean;
}

export default function GlitchText({ text, className = "", glitchOnChange = true }: GlitchTextProps) {
  const [glitch, setGlitch] = useState(false);

  useEffect(() => {
    if (!glitchOnChange) return;
    setGlitch(true);
    const t = setTimeout(() => setGlitch(false), 200);
    return () => clearTimeout(t);
  }, [text, glitchOnChange]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() < 0.05) {
        setGlitch(true);
        setTimeout(() => setGlitch(false), 100 + Math.random() * 100);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <span
      className={`glitch-text ${glitch ? "glitch-active" : ""} ${className}`}
      data-text={text}
    >
      {text}
    </span>
  );
}
