import type { PinType } from "@/lib/types";
import { PIN_COLORS } from "@/lib/types";

interface Props {
  type: PinType;
  size?: number;
  animate?: boolean;
  label?: string;
  onClick?: () => void;
}

export default function PixelPin({ type, size = 32, animate = false, label, onClick }: Props) {
  const color = PIN_COLORS[type];
  // teardrop height = size, width = size * 0.7
  const w = Math.round(size * 0.7);
  const h = size;
  const cx = w / 2;
  const r = w / 2;
  const headCy = r;
  // tip at bottom center
  const tipY = h;
  // path: tip → left tangent → arc over head → right tangent → tip
  const d = `M ${cx},${tipY} L ${cx - r},${headCy} A ${r},${r} 0 1,1 ${cx + r},${headCy} Z`;

  return (
    <div
      onClick={onClick}
      className={`inline-flex flex-col items-center gap-[2px] [filter:drop-shadow(2px_2px_0_#01579b)] ${animate ? "pin-bounce" : ""} ${onClick ? "cursor-pointer" : "cursor-default"}`}
    >
      <svg
        width={w}
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        className="[image-rendering:pixelated] block"
      >
        {/* shadow offset */}
        <path d={d} fill="#01579b" transform="translate(2,2)" />
        {/* main teardrop */}
        <path d={d} fill={color} stroke="#01579b" strokeWidth={1.5} />
        {/* inner dot/shine */}
        <circle cx={cx} cy={headCy * 0.75} r={r * 0.28} fill="rgba(255,255,255,0.35)" />
      </svg>
      {label && (
        <span
          className="font-pixel text-[6px] [text-shadow:1px_1px_0_#01579b] whitespace-nowrap mt-[2px]"
          style={{ color }}
        >
          {label}
        </span>
      )}
    </div>
  );
}
