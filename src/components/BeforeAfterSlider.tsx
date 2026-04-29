import { useState, useRef } from "react";
import { ChevronsLeftRight } from "lucide-react";

interface Props {
  before?: string;
  after?: string;
  beforeLabel?: string;
  afterLabel?: string;
}

export function BeforeAfterSlider({
  before,
  after,
  beforeLabel = "Before",
  afterLabel = "After",
}: Props) {
  const [pos, setPos] = useState(50);
  const ref = useRef<HTMLDivElement>(null);

  const handleMove = (clientX: number) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const next = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.max(0, Math.min(100, next)));
  };

  return (
    <div className="p-1.5 rounded-[32px] bg-cream-100 border border-[var(--line)]">
      <div
        ref={ref}
        className="relative aspect-[16/11] rounded-[28px] overflow-hidden cursor-ew-resize select-none"
        onMouseMove={(e) => e.buttons === 1 && handleMove(e.clientX)}
        onTouchMove={(e) => handleMove(e.touches[0].clientX)}
        onMouseDown={(e) => handleMove(e.clientX)}
        onTouchStart={(e) => handleMove(e.touches[0].clientX)}
      >
        {/* Before */}
        {before ? (
          <img src={before} className="absolute inset-0 w-full h-full object-cover" draggable={false} alt="Before" />
        ) : (
          <div className="absolute inset-0 flex items-end p-8" style={{
            background: "linear-gradient(135deg, #d4ccc4 0%, #b8b0a6 50%, #9e9590 100%)"
          }}>
            <p className="font-display text-[22px] text-white/60 italic">Before refinement</p>
          </div>
        )}

        {/* After — clipped from the right */}
        <div className="absolute inset-0" style={{ clipPath: `inset(0 0 0 ${pos}%)` }}>
          {after ? (
            <img src={after} className="absolute inset-0 w-full h-full object-cover" draggable={false} alt="After" />
          ) : (
            <div className="absolute inset-0 flex items-end p-8" style={{
              background: "linear-gradient(135deg, #e8d4c5 0%, #c97f5b55 50%, #fbf7f0 100%)"
            }}>
              <p className="font-display text-[22px] text-ink-700 italic">After refinement</p>
            </div>
          )}
        </div>

        {/* Divider line */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-cream-50 pointer-events-none"
          style={{ left: `${pos}%`, marginLeft: -1 }}
        />

        {/* Drag handle */}
        <div
          className="absolute top-1/2 w-11 h-11 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cream-50 border border-[var(--line)] shadow-md grid place-items-center pointer-events-none"
          style={{ left: `${pos}%` }}
        >
          <ChevronsLeftRight size={16} className="text-ink-700" strokeWidth={1.6} />
        </div>

        {/* Labels */}
        <span className="absolute top-4 left-4 px-3 py-1.5 rounded-full text-[10px] tracking-[0.18em] uppercase font-medium bg-ink-900/[0.78] text-cream-50 backdrop-blur pointer-events-none">
          {beforeLabel}
        </span>
        <span className="absolute top-4 right-4 px-3 py-1.5 rounded-full text-[10px] tracking-[0.18em] uppercase font-medium bg-terracotta/90 text-cream-50 backdrop-blur pointer-events-none">
          {afterLabel}
        </span>
      </div>
    </div>
  );
}
