import React from "react";
import { Home, ChevronRight } from "lucide-react";

export type Crumb = {
  label: string;
  onClick?: () => void; // 내부 라우팅용
  href?: string; // 외부 링크용
  current?: boolean; // 마지막(현재) 표시
};

type Props = {
  items: Crumb[];
  className?: string;
  separatorIcon?: React.ReactNode; // 기본: <ChevronRight/>
  showHomeIcon?: boolean; // 기본: true
  truncate?: boolean; // 기본: true (작은 화면에서 중간 crumb 접기)
};

export const Breadcrumb: React.FC<Props> = ({
  items,
  className = "",
  separatorIcon,
  showHomeIcon = false,
  truncate = true,
}) => {
  const Sep = () => (
    <span className="mx-2 text-gray-400">
      {separatorIcon ?? <ChevronRight size={16} />}
    </span>
  );

  // xs~sm 뷰포트에서 중간 crumb은 생략하고 "홈 / ... / 현재" 형태로 축약 표시
  const head = items[0];
  const tail = items[items.length - 1];
  const hasMiddle = items.length > 2;

  return (
    <nav
      aria-label="Breadcrumb"
      className={`text-sm text-gray-500 ${className}`}
    >
      {/* compact: xs~sm */}
      {truncate && (
        <div className="flex items-center sm:hidden">
          {head && (
            <>
              {showHomeIcon ? <Home className="mr-1 h-4 w-4" /> : null}
              {head.current ? (
                <span className="text-gray-900 font-medium">{head.label}</span>
              ) : head.onClick ? (
                <button onClick={head.onClick} className="hover:underline">
                  {head.label}
                </button>
              ) : head.href ? (
                <a href={head.href} className="hover:underline">
                  {head.label}
                </a>
              ) : (
                <span>{head.label}</span>
              )}
            </>
          )}
          {hasMiddle && (
            <>
              <Sep />
              <span className="text-gray-400">…</span>
            </>
          )}
          {tail && (
            <>
              <Sep />
              <span className="text-gray-900 font-medium truncate max-w-[50vw]">
                {tail.label}
              </span>
            </>
          )}
        </div>
      )}

      {/* full: md 이상 */}
      <div
        className={`hidden sm:flex items-center ${showHomeIcon ? "pl-0" : ""}`}
      >
        {items.map((it, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <div key={idx} className="flex items-center min-w-0">
              {idx !== 0 && <Sep />}
              {idx === 0 && showHomeIcon ? (
                <Home className="mr-1 h-4 w-4" />
              ) : null}

              {isLast || it.current ? (
                <span className="text-gray-900 font-medium truncate">
                  {it.label}
                </span>
              ) : it.onClick ? (
                <button
                  onClick={it.onClick}
                  className="hover:underline truncate"
                >
                  {it.label}
                </button>
              ) : it.href ? (
                <a href={it.href} className="hover:underline truncate">
                  {it.label}
                </a>
              ) : (
                <span className="truncate">{it.label}</span>
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
};

export default Breadcrumb;
