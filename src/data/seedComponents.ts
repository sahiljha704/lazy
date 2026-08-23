import { UIComponentItem } from '../types';

export const SEED_COMPONENTS: UIComponentItem[] = [
  {
    id: 'dia-text-reveal',
    title: 'Dia Text Reveal',
    category: 'Hero & Headers',
    framework: 'React + Tailwind',
    description: 'A dynamic text reveal animation featuring diagonal chromatic gradients and staggered letter transitions for high-impact typography and landing hero sections.',
    authorEmail: 'vulchureeditz@gmail.com',
    authorName: 'vulchureeditz',
    createdAt: new Date().toISOString(),
    likesCount: 1,
    wishlistCount: 0,
    viewsCount: 1,
    copyCount: 0,
    featured: true,
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    screenRecordingUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    code: `import React, { useEffect, useState } from "react";

interface DiaTextRevealProps {
  text: string;
  colors?: string[];
  className?: string;
  delay?: number;
}

export function DiaTextReveal({
  text = "Magic UI",
  colors = ["#A97CF8", "#F38CB8", "#FDCC92"],
  className = "",
  delay = 0,
}: DiaTextRevealProps) {
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsRevealed(true), 120);
    return () => clearTimeout(timer);
  }, []);

  const letters = Array.from(text);
  const gradient = \`linear-gradient(135deg, \${colors.join(", ")})\`;

  return (
    <div className={\`inline-flex flex-wrap items-center justify-center gap-[0.03em] overflow-hidden select-none font-sans \${className}\`}>
      {letters.map((char, index) => (
        <span
          key={index}
          className="inline-block transition-all duration-700 ease-out"
          style={{
            backgroundImage: gradient,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            opacity: isRevealed ? 1 : 0,
            transform: isRevealed
              ? "translateY(0px) rotate(0deg) scale(1)"
              : "translateY(24px) rotate(6deg) scale(0.85)",
            transitionDelay: \`\${index * 70 + delay}ms\`,
            filter: isRevealed
              ? "drop-shadow(0 0 20px rgba(169, 124, 248, 0.4))"
              : "none",
          }}
        >
          {char === " " ? "\\u00A0" : char}
        </span>
      ))}
    </div>
  );
}

export function DiaTextRevealDemo() {
  return (
    <div className="flex min-h-64 items-center justify-center p-8 bg-[#0A0A0C] rounded-2xl border border-zinc-800 shadow-2xl">
      <DiaTextReveal
        className="text-4xl sm:text-5xl font-extrabold tracking-tight"
        text="Magic UI"
        colors={["#A97CF8", "#F38CB8", "#FDCC92"]}
      />
    </div>
  );
}

export default DiaTextRevealDemo;`,
    tags: ['DiaTextReveal', 'MagicUI', 'Typography', 'Gradient', 'Animation'],
  },
];
