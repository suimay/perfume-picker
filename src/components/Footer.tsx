import React from "react";

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-50 text-gray-500 text-sm mt-16 border-t">
      <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col sm:flex-row justify-between">
        <p>© 2025 Perfume Sense. All rights reserved.</p>
        <div className="flex gap-4 mt-2 sm:mt-0">
          <a href="#" className="hover:text-black">
            이용약관
          </a>
          <a href="#" className="hover:text-black">
            개인정보처리방침
          </a>
          <a href="#" className="hover:text-black">
            문의하기
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
