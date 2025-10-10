import React from "react";
import { useAuth } from "../contexts/AuthContext";
import { Sparkles } from "lucide-react";

export const Header: React.FC<{ onNavigate: (page: string) => void }> = ({
  onNavigate,
}) => {
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* 로고 */}
        <button
          onClick={() => onNavigate("home")}
          className="flex items-center gap-2 font-semibold text-lg text-gray-800 hover:text-black"
        >
          <Sparkles size={18} className="text-yellow-500" />
          <span>Perfume Sense</span>
        </button>

        {/* 메뉴 */}
        <nav className="hidden md:flex gap-6 text-sm text-gray-600">
          <button
            onClick={() => onNavigate("all-perfumes")}
            className="hover:text-black"
          >
            향수 목록
          </button>
          <button
            onClick={() => onNavigate("preferences")}
            className="hover:text-black"
          >
            취향 선택
          </button>
          <button
            onClick={() => onNavigate("results")}
            className="hover:text-black"
          >
            추천 결과
          </button>
        </nav>

        {/* 로그인 / 로그아웃 */}
        <div>
          {user ? (
            <button
              onClick={signOut}
              className="text-sm text-gray-600 hover:text-black"
            >
              로그아웃
            </button>
          ) : (
            <button
              onClick={() => onNavigate("login")}
              className="text-sm text-gray-600 hover:text-black"
            >
              로그인
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
