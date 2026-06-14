import { COUNTRIES_CATALOG, CountryOption } from "@/lib/countries-catalog";
import { useMemo } from "react";
import { FaCheck } from "react-icons/fa";
import CountryFlag from "./CountryFlag";

interface Props {
  search: string;
  visitedCodes: string[];
  selected: CountryOption | null,
  setSearch: (value: string)=> void
  setSelected: (value: CountryOption)=> void
}

export const SearchCountry = ({ search, visitedCodes, selected, setSearch, setSelected }: Props) => {
  const available = useMemo(() => {
    const visited = new Set(visitedCodes);
    const q = String(search).trim().toLowerCase();

    return COUNTRIES_CATALOG.filter((c) => {
      if (visited.has(c.code)) return false;
      if (!q) return true;

      return (
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.continent.toLowerCase().includes(q)
      );
    });
  }, [search, visitedCodes]);

  return (
    <div>
      <div className="text-[7px] text-white mb-2">PAÍS</div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder=""
        className="w-full pixel-input"
        style={{ fontSize: 8 }}
      />

      <div className="mt-2 max-h-36 overflow-y-auto border-2 border-white/25">
        {available.length === 0 ? (
          <div className="p-3 text-[7px] text-white">Nenhum país encontrado.</div>
        ) : (
          available.map((c) => {
            const isActive = selected?.code === c.code;

            return (
              <button
                key={c.code}
                type="button"
                onClick={() => setSelected(c)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 border-b border-white/20 text-left font-['Press_Start_2P'] text-[7px] ${
                  isActive ? "bg-[#00e5ff22] text-white" : "text-white"
                }`}
              >
                <CountryFlag code={c.alpha2} size={28} />
                <span className="flex-1">{c.name}</span>
                <span className="text-[6px] text-white">{c.continent}</span>
                {isActive && <FaCheck className="ml-2 h-4 w-4 text-[#39ff14]" />}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
