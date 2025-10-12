// src/components/NotionIcon.tsx

import React from "react";

interface NotionIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
}

export const NotionIcon: React.FC<NotionIconProps> = ({
  size = 20,
  className = "",
  ...props
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* 1. 정면 사각형 (노션 블록의 주 몸통) */}
      <rect x="5" y="5" width="14" height="14" rx="2" ry="2" />
      {/* 2. 필수 입체감 표현 (좌측 상단 그림자) */}
      {/* 좌측 상단 대각선 (정면 좌상단 5,5 -> 좌후방 2,2) */}
      <line x1="5" y1="5" x2="2" y2="2" />
      {/* 좌측 하단 대각선 (정면 좌하단 5,19 -> 좌후방 2,16) */}
      <line x1="5" y1="19" x2="2" y2="16" />

      {/* 윗면 오른쪽 대각선 (정면 우상단 19,5 -> 우후방 22,2) */}
      <line x1="19" y1="5" x2="16" y2="2" />
      {/* 좌측 세로선 (좌후방 2,2 -> 좌후방 2,16) */}
      <line x1="2" y1="2" x2="2" y2="16" />
      {/* 상단 가로선 (좌후방 2,2 -> 우후방 19,2) */}
      <line x1="2" y1="2" x2="16" y2="2" />
      {/* 3. N 글자 중앙 정렬 */}
      {/* N의 왼쪽 세로선 */}
      <line x1="8" y1="8" x2="8" y2="16" />
      {/* N의 대각선 */}
      <line x1="8" y1="8" x2="16" y2="16" />
      {/* N의 오른쪽 세로선 */}
      <line x1="16" y1="8" x2="16" y2="16" />
    </svg>
  );
};

export default NotionIcon;
