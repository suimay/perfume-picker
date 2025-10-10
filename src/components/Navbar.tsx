import { LogIn, LogOut, Sparkles, Settings, ListChecks, Info } from "lucide-react";

type Props = {
  onNavigate: (page: string) => void;
  user: any;
  currentPage?: string;
  onLogout?: () => Promise<void> | void;
};

export default function Navbar({ onNavigate, user, currentPage, onLogout }: Props) {
  const goDetail = () => { onNavigate('all-perfumes'); };

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/70 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        <button
          className="flex items-center gap-2 font-semibold tracking-tight"
          onClick={() => onNavigate('home')}
          aria-label="홈으로"
        >
          <Sparkles className="size-5" aria-hidden />
          <span>Perfume Picker</span>
        </button>

        <nav className="hidden md:flex items-center gap-6 text-sm text-neutral-700">
          <button
            onClick={() => onNavigate('preferences')}
            className={`hover:text-black flex items-center gap-2 ${currentPage==='preferences' ? 'text-black' : ''}`}
          >
            <Settings className="size-4" aria-hidden />
            취향 선택
          </button>
          <button
            onClick={() => onNavigate('results')}
            className={`hover:text-black flex items-center gap-2 ${currentPage==='results' ? 'text-black' : ''}`}
          >
            <ListChecks className="size-4" aria-hidden />
            추천 결과
          </button>
          <button onClick={goDetail} className="hover:text-black flex items-center gap-2">
            <Info className="size-4" aria-hidden />
            향수 상세
          </button>
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <button
                onClick={() => onNavigate('mypage')}
                className="inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm hover:bg-neutral-50"
              >
                마이페이지
              </button>
              <button
                onClick={() => onLogout?.()}
                className="inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm hover:bg-neutral-50"
              >
                <LogOut className="size-4" aria-hidden />
                로그아웃
              </button>
            </>
          ) : (
            <button
              onClick={() => onNavigate('auth')}
              className="inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm hover:bg-neutral-50"
            >
              <LogIn className="size-4" aria-hidden />
              로그인
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
