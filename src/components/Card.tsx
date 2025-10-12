// src/components/Card.tsx (hover:scale-105 제거 제안)

import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  backgroundColor?: string;
  onClick?: () => void;
}

export function Card({
  children,
  className = "",
  backgroundColor,
  onClick,
}: CardProps) {
  const style = backgroundColor ? { backgroundColor } : {};

  return (
    <div
      // 💡 hover:scale-105 제거: 클릭 가능한 카드(Home, Result)에서 의도치 않은 움직임 방지
      className={`rounded-2xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl ${
        onClick ? "cursor-pointer" : "" // hover:scale-105 제거
      } ${className}`}
      style={style}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
