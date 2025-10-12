// src/components/Footer.tsx

import React from "react";
// 💡 수정 완료: Github 아이콘을 lucide-react에서 추가로 import 합니다.
import { Mail, Instagram, Github } from "lucide-react";
import { NotionIcon } from "./NotionIcon"; // 👈 새로 만든 NotionIcon 컴포넌트 import

const Footer: React.FC = () => {
  // 📌 실제 링크
  const GITHUB_LINK = "https://github.com/suimay/perfume-picker"; // GitHub
  const INSTAGRAM_LINK =
    "https://www.instagram.com/ooinlees?igsh=MWw4eGRkamEweDd0cQ%3D%3D&utm_source=qr"; // 인스타그램
  const NOTION_LINK =
    "https://www.notion.so/amilab/26f763f6955a802e8e48e466b95da239?source=copy_link"; // 프로젝트 노션 페이지
  const EMAIL_ADDRESS = "mailto:atomsyndrome@gmail.com"; // 문의 메일

  // 더미 클릭 핸들러
  const handleDummyClick = (e: React.MouseEvent) => {
    e.preventDefault();
    alert("환영합니다. 자유롭게 즐겨보세요 ♡⸜(ˆᗜˆ˵ )⸝♡");
  };
  const handleDummyClick2 = (e: React.MouseEvent) => {
    e.preventDefault();
    alert("당신의 개인정보는 제 주머니 속으로.");
  };
  return (
    <footer className="bg-gray-50 text-gray-500 text-sm mt-16 border-t">
      <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col sm:flex-row justify-between items-center">
        {/* 1. 좌측: 저작권 및 약관/방침 */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <p className="order-2 sm:order-1">© 2025 KSNU 2500131 SUIN. 향(香)</p>
          {/* 약관/방침 링크 (완성도 유지) */}
          <div className="order-1 sm:order-2 flex gap-4 text-xs">
            <a href="#" onClick={handleDummyClick} className="hover:text-black">
              이용약관
            </a>
            <a
              href="#"
              onClick={handleDummyClick2}
              className="hover:text-black"
            >
              개인정보처리방침
            </a>
          </div>
        </div>

        {/* 2. 우측: 개인 연락처 및 프로젝트 링크 (아이콘) */}
        <div className="flex gap-4 mt-4 sm:mt-0 items-center">
          {/* 메일 문의 */}
          <a
            href={EMAIL_ADDRESS}
            className="hover:text-black transition-colors"
            aria-label="문의하기 이메일"
          >
            <Mail size={20} />
          </a>

          {/* 인스타그램 */}
          <a
            href={INSTAGRAM_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-black transition-colors"
            aria-label="인스타그램"
          >
            <Instagram size={20} />
          </a>

          {/* 📌 노션 페이지 (새 아이콘 적용) */}
          <a
            href={NOTION_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-black transition-colors"
            aria-label="프로젝트 노션 페이지"
          >
            {/* BookOpen 대신 NotionIcon 사용 */}
            <NotionIcon size={20} />
          </a>

          {/* GitHub */}
          <a
            href={GITHUB_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-black transition-colors"
            aria-label="GitHub"
          >
            <Github size={20} />
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
