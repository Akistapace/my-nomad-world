import { logout } from "@/app/actions/auth";

export default function BannedPage() {
  return (
    <div className="min-h-dvh bg-[#011627] flex items-center justify-center p-6">
      <div className="pixel-panel max-w-sm w-full p-8 text-center flex flex-col gap-6">
        <div className="text-[48px]">🚫</div>
        <div>
          <div className="text-[14px] text-[#ff4d6d] mb-2">CONTA BANIDA</div>
          <div className="text-[8px] text-white/50 leading-[2]">
            Sua conta foi suspensa por violação dos termos de uso.
            Entre em contato com o suporte se acreditar que isso é um erro.
          </div>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="w-full font-pixel text-[8px] px-4 py-3 border-2 border-[#ff4d6d] bg-[#ff4d6d11] text-[#ff4d6d] cursor-pointer"
          >
            SAIR
          </button>
        </form>
      </div>
    </div>
  );
}
