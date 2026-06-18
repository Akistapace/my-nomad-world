"use client";
import { logout } from "@/app/actions/auth";
import { useUser } from "@/lib/context/user-context";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaCamera, FaTrophy, FaUser, FaUsers } from "react-icons/fa";
import { GiWorld } from "react-icons/gi";
import { TbTargetArrow } from "react-icons/tb";
import PixelCharacter from "./PixelCharacter";

const NAV_ITEMS = [
  { href: "/", label: "Mapa", icon: <GiWorld  className="h-5 w-5 text-white" /> },
  { href: "/ranking", label: "Ranking", icon: <FaTrophy  className="h-5 w-5 text-white" /> },
  { href: "/challenges", label: "Missões", icon: <TbTargetArrow  className="h-5 w-5 text-white" />  },
  { href: "/stories", label: "Stories", icon: <FaCamera className="h-4 w-4 text-white" /> },
  { href: "/friends", label: "Amigos", icon: <FaUsers  className="h-5 w-5 text-white" /> },
  { href: "/profile", label: "Perfil", icon: <FaUser  className="h-4 w-4 text-white" /> },
];

export default function Sidebar() {
  const pathname = usePathname();
  const user = useUser();
  const xpPct = (user.xp / user.xpToNext) * 100;

  return (
    <aside className="app-sidebar w-60 bg-[#0277bd] border-r-[3px] border-r-[#29b6f6] shadow-[3px_0_0_#01579b] flex-col sticky top-0 h-[100dvh] overflow-y-auto shrink-0">
      {/* Logo */}
      <div className="pt-5 px-4 pb-4 border-b-2 border-b-[#29b6f644] bg-[linear-gradient(180deg,#01579b_0%,transparent_100%)]">
        <div className="text-[9px] text-[#ffffff] tracking-[2px] mb-1">MY NOMAD</div>
        <div className="text-xs text-[#00e5ff] tracking-[1px]">WORLD</div>
      </div>

      {/* Player card */}
      <div className="p-4 border-b-2 border-b-[#29b6f644] flex flex-col gap-[10px]">
        <div className="flex items-center gap-[10px]">
          <div className="bg-[#01579b] border-2 border-[#29b6f6] shadow-[2px_2px_0_#014080] p-[6px] shrink-0">
            <PixelCharacter character={user.character} size={40} />
          </div>
          <div>
            <div className="flex gap-2 text-[7px] justify-between">
              <span className="text-[#ffd60a]">⭐ {user.level}</span>
              <span className="text-white">#{user.rank}</span>
            </div>
            <div className="text-[8px] text-white  mb-1">{user.username}</div>
            {/* XP */}
            <div>
              <div className="flex justify-between text-[6px] text-white mb-1">
                <span>XP</span>
                <span>
                  {user.xp}/{user.xpToNext}
                </span>
              </div>
              <div className="h-2 bg-[#01579b] border-2 border-[#29b6f6] overflow-hidden rounded-full">
                <div
                  className="xp-bar-fill h-full bg-[linear-gradient(90deg,#00e5ff,#bf5af2)] rounded-full"
                  style={{ width: `${xpPct}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Mini stats */}
        <div className="grid grid-cols-2 gap-1.5">
          {[
            { label: "Países", value: user.countriesCount, color: "#00e5ff" },
            { label: "Pins", value: user.totalPins, color: "#ffd60a" },
          ].map((s) => (
            <div key={s.label} className="bg-[#01579b] px-2 py-1.5 border border-white">
              <div className="text-sm" style={{ color: s.color }}>
                {s.value}
              </div>
              <div className="text-[5px] text-white/50">{s.label.toUpperCase()}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-2">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-5 py-3 no-underline transition-[background] duration-100 border-l-4 ${
                active ? "bg-[#01579b] border-l-[#00e5ff]" : "bg-transparent border-l-transparent"
              }`}
              onMouseEnter={(e) => {
                if (!active) (e.currentTarget as HTMLElement).style.background = "#01579b44";
              }}
              onMouseLeave={(e) => {
                if (!active) (e.currentTarget as HTMLElement).style.background = "transparent";
              }}
            >
              <span className="text-lg leading-none">{item.icon}</span>
              <span
                className={`font-pixel text-[9px] tracking-[0.5px] ${active ? "text-[#00e5ff]" : "text-white"}`}
              >
                {item.label.toUpperCase()}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Admin link */}
      {user.isAdmin && (
        <div className="px-4 pb-2">
          <Link
            href="/admin"
            className="flex items-center gap-2 px-3 py-2 border-2 border-[#ff00ff44] bg-[#ff00ff11] no-underline"
          >
            <span className="text-[10px]">🛡</span>
            <span className="font-pixel text-[7px] text-[#ff00ff]">ADMIN</span>
          </Link>
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-3 border-t-2 border-t-[#29b6f644] flex flex-col gap-2">
        <form action={logout}>
          <button
            type="submit"
            className="w-full font-pixel text-[7px] px-3 py-2 border-2 border-[#ff4d6d44] bg-transparent text-[#ff4d6d] cursor-pointer"
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#ff4d6d11";
              e.currentTarget.style.borderColor = "#ff4d6d";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.borderColor = "#ff4d6d44";
            }}
          >
            ⏻ SAIR
          </button>
        </form>
        <div className="text-[6px] text-white">MY NOMAD WORLD v0.1</div>
      </div>
    </aside>
  );
}
