"use client";
import { useEffect, useState } from "react";
import type { XPResult } from "@/lib/xp";

interface Props {
  result: XPResult;
  onDone: () => void;
}

export default function XPToast({ result, onDone }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const show = setTimeout(() => setVisible(true), 30);
    const hide = setTimeout(() => setVisible(false), 2700);
    const done = setTimeout(onDone, 3000);
    return () => {
      clearTimeout(show);
      clearTimeout(hide);
      clearTimeout(done);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        top: 80,
        right: 16,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: 6,
        alignItems: "flex-end",
        transition: "opacity 0.3s, transform 0.3s",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(-12px)",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          background: "#01579b",
          border: "2px solid #ffd60a",
          padding: "10px 16px",
          fontFamily: '"Press Start 2P", monospace',
          fontSize: 10,
          color: "#ffd60a",
          boxShadow: "3px 3px 0 #014080",
          whiteSpace: "nowrap",
        }}
      >
        ⭐ +{result.xpGained} XP
      </div>
      {result.leveledUp && (
        <div
          style={{
            background: "#01579b",
            border: "2px solid #39ff14",
            padding: "10px 16px",
            fontFamily: '"Press Start 2P", monospace',
            fontSize: 9,
            color: "#39ff14",
            boxShadow: "3px 3px 0 #014080",
            whiteSpace: "nowrap",
          }}
        >
          🎉 LEVEL UP! LVL {result.newLevel}
        </div>
      )}
    </div>
  );
}
