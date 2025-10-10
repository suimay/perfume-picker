import { useState } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Navbar from "./components/Navbar";

import { Home } from "./pages/Home";
import { Preferences } from "./pages/Preferences";
import { Results } from "./pages/Results";
import { PerfumeDetail } from "./pages/PerfumeDetail";
import { Login } from "./pages/Login";
import { Signup } from "./pages/Signup";
import { MyPage } from "./pages/MyPage";
import AllPerfumes from "./pages/AllPerfumes";

import Header from "./components/Header";
import Footer from "./components/Footer";

type Page =
  | "home"
  | "preferences"
  | "results"
  | "auth"
  | "signup"
  | "mypage"
  | "all-perfumes"
  | string;

function AppContent() {
  const { user, signOut } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>("home");
  const [preferences, setPreferences] = useState<any>(null);

  /** 중앙 네비게이터: perfume-<id>로 오면 id를 localStorage에도 저장(상세 폴백용) */
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
  function App() {
    const [currentPage, setCurrentPage] = useState("home");
    const navigate = (page: string) => setCurrentPage(page);

    return (
      <div className="flex flex-col min-h-screen">
        <Header onNavigate={navigate} />

        <main className="flex-1">
          {currentPage === "home" && <div>홈 페이지</div>}
          {currentPage === "all-perfumes" && (
            <AllPerfumes onNavigate={navigate} />
          )}
          {currentPage.startsWith("perfume-") && (
            <PerfumeDetail
              id={Number(currentPage.replace("perfume-", ""))}
              onNavigate={navigate}
            />
          )}
          {/* 기타 페이지들 */}
        </main>

        <Footer />
      </div>
    );
  }

  // 상세 페이지 분기 (perfume-<id> 형태를 prop으로 전달)
  if (typeof currentPage === "string" && currentPage.startsWith("perfume-")) {
    const perfumeId = currentPage.replace("perfume-", "").trim();
    return (
      <>
        <Navbar
          onNavigate={navigate}
          user={user}
          currentPage={currentPage}
          onLogout={signOut}
        />
        <PerfumeDetail perfumeId={perfumeId} onNavigate={navigate} />
      </>
    );
  }

  if (currentPage === "auth") {
    return (
      <>
        <Navbar
          onNavigate={navigate}
          user={user}
          currentPage={currentPage}
          onLogout={signOut}
        />
        <Login
          onNavigate={navigate}
          onLogin={() => navigate("home")}
          onSwitch={() => setCurrentPage("signup")}
        />
      </>
    );
  }

  if (currentPage === "signup") {
    return (
      <>
        <Navbar
          onNavigate={navigate}
          user={user}
          currentPage={currentPage}
          onLogout={signOut}
        />
        <Signup
          onNavigate={navigate}
          onSignup={() => navigate("home")}
          onSwitch={() => setCurrentPage("auth")}
        />
      </>
    );
  }

  if (currentPage === "mypage") {
    return (
      <>
        <Navbar
          onNavigate={navigate}
          user={user}
          currentPage={currentPage}
          onLogout={signOut}
        />
        <MyPage onNavigate={navigate} user={user} />
      </>
    );
  }

  if (currentPage === "all-perfumes") {
    return (
      <>
        <Navbar
          onNavigate={navigate}
          user={user}
          currentPage={currentPage}
          onLogout={signOut}
        />
        <AllPerfumes onNavigate={navigate} />
      </>
    );
  }

  if (currentPage === "preferences") {
    return (
      <>
        <Navbar
          onNavigate={navigate}
          user={user}
          currentPage={currentPage}
          onLogout={signOut}
        />
        <Preferences onNavigate={navigate} />
      </>
    );
  }

  if (currentPage === "results") {
    return (
      <>
        <Navbar
          onNavigate={navigate}
          user={user}
          currentPage={currentPage}
          onLogout={signOut}
        />
        <Results preferences={preferences} onNavigate={navigate} />
      </>
    );
  }

  return (
    <>
      <Navbar
        onNavigate={navigate}
        user={user}
        currentPage={currentPage}
        onLogout={signOut}
      />
      <Home onNavigate={navigate} user={user} />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
