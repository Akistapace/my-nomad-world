"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaCamera, FaTrophy, FaUser, FaUsers } from "react-icons/fa";
import { GiWorld } from "react-icons/gi";
import { TbTargetArrow } from "react-icons/tb";

const NAV_ITEMS = [
  { href: "/", label: "MAPA", icon: <GiWorld  className="h-5 w-5 text-white" />},
  { href: "/ranking", label: "RANK", icon: <FaTrophy  className="h-3 w-3 text-white" /> },
  { href: "/challenges", label: "MISSÃO", icon: <TbTargetArrow  className="h-3 w-3 text-white" /> },
  { href: "/stories", label: "STORY", icon: <FaCamera className="h-3 w-3 text-white" />  },
  { href: "/friends", label: "AMIGOS", icon: <FaUsers  className="h-3 w-3 text-white" /> },
  { href: "/profile", label: "PERFIL", icon: <FaUser  className="h-3 w-3 text-white" /> },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="app-bottom-nav fixed bottom-0 left-0 right-0 z-50 bg-[#0277bd] border-t-[3px] border-t-[#29b6f6] shadow-pixel-nav">
      <div className="flex items-stretch max-w-120 mx-auto">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center py-1.5 px-0.5 gap-0.75 no-underline relative border-t-2 ${
                active
                  ? "bg-[#01579b] border-t-[#00e5ff] shadow-[inset_0_2px_0_rgba(255,255,255,0.1)]"
                  : "bg-transparent border-t-transparent"
              }`}
            >
              {active && (
                <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[#00e5ff] shadow-[0_0_6px_#00e5ff]" />
              )}
              <span className="text-base">{item.icon}</span>
              <span
                className={`font-pixel text-[5px] tracking-[0.5px] ${active ? "text-[#00e5ff]" : "text-white/50"}`}
              >
                {active ? `►${item.label}` : item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
