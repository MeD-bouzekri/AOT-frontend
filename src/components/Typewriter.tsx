"use client";

import { useEffect, useState } from "react";

interface TypewriterProps {
  /** phrases to choose from — one is picked at random per page load */
  words: string[];
  className?: string;
  typeSpeed?: number;
}

/**
 * Picks ONE phrase at random per page load and types it once,
 * character-by-character, then stops (caret keeps blinking).
 * Respects reduced-motion by showing the phrase statically.
 */
export default function Typewriter({
  words,
  className,
  typeSpeed = 95,
}: TypewriterProps) {
  const [reduced, setReduced] = useState(false);
  const [text, setText] = useState("");
  // pick one phrase per mount — chosen client-side only (after hydration)
  // to avoid SSR/client mismatch from Math.random during render.
  const [target, setTarget] = useState<string | null>(null);

  useEffect(() => {
    setReduced(
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
    setTarget(words[Math.floor(Math.random() * words.length)]);
    // words is a stable literal from the parent; run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (reduced || target === null) return;
    if (text === target) return; // done — stop typing
    const t = setTimeout(
      () => setText(target.slice(0, text.length + 1)),
      typeSpeed
    );
    return () => clearTimeout(t);
  }, [text, target, reduced, typeSpeed]);

  // Server + first client render: emit a stable placeholder (first word,
  // invisible) so markup matches. Real phrase + typing start after mount.
  if (target === null) {
    return (
      <span className={className} aria-label={words[0]}>
        <span style={{ opacity: 0 }}>{words[0]}</span>
      </span>
    );
  }

  if (reduced) {
    return <span className={className}>{target}</span>;
  }

  return (
    <span className={className} aria-label={target}>
      {text}
      <span className="typewriter-caret" aria-hidden="true">
        |
      </span>
    </span>
  );
}
