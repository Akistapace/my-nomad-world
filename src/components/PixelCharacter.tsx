import type { Character } from "@/lib/types";

// [base, light, dark]
const PALETTES: Record<string, readonly [string, string, string]> = {
  blue: ["#00e5ff", "#80f4ff", "#0099cc"],
  red: ["#ff4d6d", "#ff9aaa", "#cc2040"],
  green: ["#39ff14", "#90ff70", "#1a9900"],
  purple: ["#bf5af2", "#d890ff", "#8020c0"],
  gold: ["#ffd60a", "#ffe880", "#cc9900"],
};

const SKINS: Record<string, readonly [string, string, string]> = {
  adventurer: ["#f5c89a", "#fde0c0", "#d4956a"],
  nomad: ["#d4956a", "#e8b887", "#b07040"],
  explorer: ["#e8b887", "#f5c89a", "#c67a4a"],
  wanderer: ["#c67a4a", "#d4956a", "#8b4a20"],
};

interface Props {
  character: Character;
  size?: number;
}

// 16 cols × 24 rows — detailed 64-bit style sprite
// Square cells: cellSize = size/16, SVG height = size*1.5
function buildGrid(
  color: string,
  skinKey: string,
  hat: boolean,
  backpack: boolean,
): (string | null)[][] {
  const _ = null;

  const [C, CL, CD] = PALETTES[color] ?? PALETTES.blue;
  const [S, SL, SD] = SKINS[skinKey] ?? SKINS.adventurer;

  // Hat crown or hair
  const HH = hat ? C : "#5a3a0a";
  const HL = hat ? CL : "#7a5020";
  const HD = hat ? CD : "#3a2008";
  const HB = hat ? "#dde8ff" : "#1a0a00"; // hat band (light) or hair edge (dark)

  // Eyes
  const EB = "#1a0a00"; // eyebrow
  const EW = "#f8f0e8"; // white
  const EP = "#080208"; // pupil

  // Mouth & nose
  const NS = SD;
  const ML = "#cc4444";
  const MD = "#882222";

  const NC = SD; // neck

  // Belt
  const BK = "#2a1a08";
  const BG = "#ffd700";

  // Pants
  const P = "#1a3470";
  const PL = "#2a4a90";
  const PD = "#0a1a40";

  // Boots
  const BT = "#1a0f08";
  const BTL = "#3a2518";

  // Backpack (null when absent — transparent)
  const K = backpack ? "#9b6b44" : null;
  const KL = backpack ? "#c08050" : null;
  const KD = backpack ? "#5a3a1a" : null;

  //  cols:  0    1    2    3    4    5    6    7    8    9   10   11   12   13   14   15
  const hatRows: (string | null)[][] = hat
    ? [
        [_, _, _, HD, HH, HH, HL, HH, HH, HH, HD, _, _, _, _, _], // 0 crown top
        [_, _, HD, HH, HH, HL, HL, HH, HH, HH, HH, HD, _, _, _, _], // 1 crown mid
        [_, _, HH, HH, HH, HH, HH, HH, HH, HH, HH, HH, _, _, _, _], // 2 crown base
        [_, _, HB, HB, HB, HB, HB, HB, HB, HB, HB, HB, HB, _, _, _], // 3 brim/band
      ]
    : [
        [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _], // 0 blank
        [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _], // 1 blank
        [_, _, _, _, HD, HH, HL, HH, HH, HH, HH, HD, _, _, _, _], // 2 hair top
        [_, _, _, _, HH, HH, HL, HH, HH, HH, HH, HB, _, _, _, _], // 3 hair base
      ];

  const bodyRows: (string | null)[][] = [
    //  0    1    2    3    4    5    6    7    8    9   10   11   12   13   14   15
    [_, _, _, _, SD, S, S, S, S, S, S, SD, _, _, _, _], //  4 forehead
    [_, _, _, _, S, S, SL, SL, S, S, S, S, _, _, _, _], //  5 forehead highlight
    [_, _, _, _, S, EB, EB, S, S, EB, EB, S, _, _, _, _], //  6 eyebrows
    [_, _, _, _, S, EW, EP, S, S, EW, EP, S, _, _, _, _], //  7 eyes
    [_, _, _, _, S, S, S, S, S, S, S, S, _, _, _, _], //  8 cheeks
    [_, _, _, _, S, S, NS, NS, S, S, S, SD, _, _, _, _], //  9 nose
    [_, _, _, _, S, ML, ML, MD, ML, ML, S, S, _, _, _, _], // 10 mouth
    [_, _, _, _, SD, S, S, S, S, S, S, SD, _, _, _, _], // 11 chin/jaw
    [_, _, _, _, _, NC, NC, NC, NC, _, _, _, _, _, _, _], // 12 neck
    [_, _, _, _, CD, C, CL, C, C, C, C, CD, K, KL, _, _], // 13 shirt top
    [_, _, SD, _, C, C, CL, CD, C, C, C, CD, K, K, KD, _], // 14 shirt + left arm shadow
    [_, S, S, _, CD, C, C, C, C, C, C, CD, KD, K, _, _], // 15 left arm out
    [_, _, SL, _, C, C, C, C, C, C, C, CD, _, KD, _, _], // 16 left hand + shirt base
    [_, _, _, _, BK, BK, BG, BK, BK, BK, BK, _, _, _, _, _], // 17 belt + gold buckle
    [_, _, _, _, P, P, PL, _, PL, P, P, _, _, _, _, _], // 18 pants top / crease
    [_, _, _, _, P, PL, _, _, _, PL, P, _, _, _, _, _], // 19 pants crease
    [_, _, _, _, PD, P, _, _, _, P, PD, _, _, _, _, _], // 20 pants lower shadow
    [_, _, _, _, P, P, _, _, _, P, P, _, _, _, _, _], // 21 pants bottom
    [_, _, _, _, BT, BTL, _, _, _, BTL, BT, _, _, _, _, _], // 22 boot top + shine
    [_, _, _, BT, BT, BT, _, _, _, BT, BT, BT, _, _, _, _], // 23 boot sole (wider)
  ];

  return [...hatRows, ...bodyRows];
}

export default function PixelCharacter({ character, size = 64 }: Props) {
  const COLS = 16;

  const grid = buildGrid(character.color, character.skin, character.hat, character.backpack);
  const cellSize = size / COLS; // square cells → height = size * 1.5

  const rects: React.ReactElement[] = [];
  grid.forEach((row, r) => {
    row.forEach((cell, c) => {
      if (!cell) return;
      rects.push(
        <rect
          key={`${r}-${c}`}
          x={c * cellSize}
          y={r * cellSize}
          width={cellSize}
          height={cellSize}
          fill={cell}
        />,
      );
    });
  });

  return (
    <svg
      width={size}
      height={size * 1.5}
      viewBox={`0 0 ${size} ${size * 1.5}`}
      style={{ imageRendering: "pixelated", display: "block" }}
    >
      {rects}
    </svg>
  );
}
