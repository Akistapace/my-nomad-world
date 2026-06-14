import { COUNTRY_BY_CODE } from "@/lib/countries-catalog";

interface Props {
  /** ISO 3166-1 alpha-2 (ex: BR) ou alpha-3 (ex: BRA) */
  code: string;
  size?: number;
  className?: string;
}

function resolveAlpha2(code: string): string {
  const upper = code.toUpperCase();
  if (upper.length === 2) return upper;
  return COUNTRY_BY_CODE[upper]?.alpha2 ?? upper.slice(0, 2);
}

export default function CountryFlag({ code, size = 24, className }: Props) {
  const alpha2 = resolveAlpha2(code).toLowerCase();

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://flagcdn.com/w80/${alpha2}.png`}
      srcSet={`https://flagcdn.com/w160/${alpha2}.png 2x`}
      alt=""
      width={size}
      height={Math.round(size * 0.72)}
      className={className}
      style={{
        objectFit: "cover",
        border: "1px solid rgba(255,255,255,0.35)",
        flexShrink: 0,
        display: "block",
      }}
    />
  );
}
