"use client";

import { useEffect, useState } from "react";

const tips = [
  "Reading the strongest signal first: recent work beats old claims.",
  "GitHub cadence is useful, but project context matters more than raw commits.",
  "LeetCode is one layer of signal, not the whole developer.",
  "Profiles stay private until the analysis is reviewed.",
  "Free profiles refresh on the configured cadence, defaulting to 14 days.",
  "Good evidence explains what changed, why it mattered, and how it shipped."
];

export function LoadingTips({ label = "Working" }: { label?: string }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setIndex((current) => (current + 1) % tips.length), 2400);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="loader-shell" role="status" aria-live="polite">
      <div className="loader-orbit" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div>
        <div className="loader-label">{label}</div>
        <p className="loader-tip">{tips[index]}</p>
      </div>
    </div>
  );
}

