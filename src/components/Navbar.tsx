import {
  LogIn,
  LogOut,
  Sparkles,
  Settings,
  ListChecks,
  Info,
  User,
} from "lucide-react";

type Props = {
  onNavigate: (page: string) => void;
  user: any;
  currentPage?: string;
  onLogout?: () => Promise<void> | void;
};

export default function Navbar({
  onNavigate,
  user,
  currentPage,
  onLogout,
}: Props) {
  // 'perfume-123' 형태의 상세 페이지도 메뉴에서 '향수 목록'이 활성화되도록 처리
  const isPerfumeDetail = currentPage?.startsWith("perfume-");
  const goDetail = () => {
    onNavigate("all-perfumes");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/70 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        <button
          className="flex items-center gap-2 font-semibold tracking-tight"
          onClick={() => onNavigate("home")}
          aria-label="홈으로"
        >
          <Sparkles className="size-5 text-yellow-500" aria-hidden />{" "}
          {/* 로고에 색상 추가 */}
          <span>향(香)</span>
        </button>

        <nav className="hidden md:flex items-center gap-6 text-sm text-neutral-700">
          <button
            onClick={() => onNavigate("preferences")}
            className={`hover:text-black flex items-center gap-2 ${
              currentPage === "preferences" ? "text-black font-semibold" : ""
            }`}
          >
            <Settings className="size-4" aria-hidden />
            취향 선택
          </button>
          <button
            onClick={() => onNavigate("results")}
            className={`hover:text-black flex items-center gap-2 ${
              currentPage === "results" ? "text-black font-semibold" : ""
            }`}
          >
            <ListChecks className="size-4" aria-hidden />
            추천 결과
          </button>
          <button
            onClick={goDetail}
            className={`hover:text-black flex items-center gap-2 ${
              currentPage === "all-perfumes" || isPerfumeDetail
                ? "text-black font-semibold"
                : ""
            }`}
          >
            <Info className="size-4" aria-hidden />
            향수 목록
          </button>
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <button
                onClick={() => onNavigate("mypage")}
                className={`inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm hover:bg-neutral-100 ${
                  currentPage === "mypage"
                    ? "bg-neutral-100 font-medium"
                    : "border"
                }`}
              >
                <User className="size-4" aria-hidden />
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
              onClick={() => onNavigate("auth")}
              className="inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm bg-neutral-900 text-white hover:bg-neutral-800"
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
