import { useState, ReactNode } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer"; // Footer 추가

// 페이지 컴포넌트 임포트
import { Home } from "./pages/Home";
import { Preferences } from "./pages/Preferences";
import { Results } from "./pages/Results";
import { PerfumeDetail } from "./pages/PerfumeDetail";
import { Login } from "./pages/Login";
import { Signup } from "./pages/Signup";
import { MyPage } from "./pages/MyPage";
import AllPerfumes from "./pages/AllPerfumes";

type Page =
  | "home"
  | "preferences"
  | "results"
  | "auth"
  | "signup"
  | "mypage"
  | "all-perfumes"
  | string;

// Layout 헬퍼 함수 정의: 모든 페이지를 Navbar와 Footer로 감쌉니다.
const Layout = ({
  children,
  onNavigate,
  user,
  onLogout,
  currentPage,
}: {
  children: ReactNode;
  onNavigate: (page: Page) => void;
  user: any;
  onLogout: () => Promise<void> | void;
  currentPage: Page;
}) => (
  <div className="flex flex-col min-h-screen">
    {/* Navbar에 현재 페이지 정보를 전달하여 활성 메뉴를 표시 */}
    <Navbar
      onNavigate={onNavigate}
      user={user}
      onLogout={onLogout}
      currentPage={currentPage}
    />
    <main className="flex-1">{children}</main>
    <Footer />
  </div>
);

function AppContent() {
  const { user, signOut } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>("home");
  const [preferences, setPreferences] = useState<any>(null);

  /** 중앙 네비게이터 */
  const navigate = (page: Page, opts?: { prefs?: any }) => {
    if (opts?.prefs) setPreferences(opts.prefs);

    // 상세 라우팅 표준화: "perfume-<id>" 패턴이면 lastPerfumeId 저장
    if (typeof page === "string" && page.startsWith("perfume-")) {
      const idLike = page.replace("perfume-", "").trim();
      if (idLike) {
        try {
          localStorage.setItem("lastPerfumeId", String(idLike));
        } catch {
          /* ignore */
        }
      }
    }

    setCurrentPage(page);
  };

  const commonProps = {
    onNavigate: navigate,
    user: user,
    onLogout: signOut,
    currentPage: currentPage,
  };

  let pageContent: ReactNode;

  // 페이지 분기 처리
  if (typeof currentPage === "string" && currentPage.startsWith("perfume-")) {
    const idStr = currentPage.replace("perfume-", "").trim();
    const perfumeId = Number(idStr);
    pageContent = <PerfumeDetail id={perfumeId} onNavigate={navigate} />;
  } else if (currentPage === "auth") {
    pageContent = (
      <div className="py-16">
        <Login
          onSuccess={() => navigate("home")}
          onToggleMode={() => setCurrentPage("signup")}
        />
      </div>
    );
  } else if (currentPage === "signup") {
    pageContent = (
      <div className="py-16">
        <Signup
          onSuccess={() => navigate("home")}
          onToggleMode={() => setCurrentPage("auth")}
        />
      </div>
    );
  } else if (currentPage === "mypage") {
    pageContent = <MyPage onNavigate={navigate} user={user} />;
  } else if (currentPage === "all-perfumes") {
    pageContent = <AllPerfumes onNavigate={navigate} />;
  } else if (currentPage === "preferences") {
    pageContent = <Preferences onNavigate={navigate} />;
  } else if (currentPage === "results") {
    pageContent = <Results preferences={preferences} onNavigate={navigate} />;
  }
  // 홈 페이지 (기본값)
  else {
    pageContent = <Home onNavigate={navigate} user={user} />;
  }

  return <Layout {...commonProps}>{pageContent}</Layout>;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
