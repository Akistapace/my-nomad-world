import type { CSSProperties, ReactNode } from "react";

interface Props {
  title?: string;
  accentColor?: string;
  children: ReactNode;
  style?: CSSProperties;
  noPadding?: boolean;
}

export default function PixelPanel({
  title,
  accentColor = "#ffffff",
  children,
  style,
  noPadding = false,
}: Props) {
  return (
    <div
      className="bg-[#0277bd] relative shadow-pixel-card"
      style={{ border: `2px solid ${accentColor}`, ...style }}
    >
      {title && (
        <div className="px-3 py-[5px] flex items-center gap-2" style={{ background: accentColor }}>
          <span className="text-[8px] text-[#0a3060] font-pixel">► {title}</span>
        </div>
      )}
      <div className={noPadding ? undefined : "p-[14px]"}>{children}</div>
    </div>
  );
}
