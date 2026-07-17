"use client";

import { useEffect, useState } from "react";

interface CRTEffectProps {
  children: React.ReactNode;
  intensity?: "low" | "medium" | "high";
}

export default function CRTEffect({ children, intensity = "medium" }: CRTEffectProps) {
  const [flicker, setFlicker] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() < 0.03) {
        setFlicker(true);
        setTimeout(() => setFlicker(false), 50 + Math.random() * 150);
      }
    }, 200);
    return () => clearInterval(interval);
  }, []);

  const flickerOpacity = flicker ? 0.92 + Math.random() * 0.08 : 1;

  return (
    <div className="crt-wrapper">
      <div
        className="crt-screen"
        style={{ opacity: flickerOpacity }}
      >
        <div className="crt-scanlines" />
        <div className="crt-vignette" />
        <div className="crt-noise" />
        {children}
      </div>
      <div className="crt-reflection" />
    </div>
  );
}
