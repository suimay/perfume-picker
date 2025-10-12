import React, { useState, useEffect } from "react";
import { Bookmark, ExternalLink, ArrowLeft } from "lucide-react";
import Breadcrumb from "../components/Breadcrumb";
// getPerfumeById와 Perfume 타입은 data/perfumes.ts에서 import
import { getPerfumeById, Perfume } from "../data/perfumes";

type Props = { id?: number; onNavigate?: (page: string) => void };

// 💡 척도 레이블 정의 (4포인트를 유지합니다.)
const SEASON_LABELS = ["봄", "여름", "가을", "겨울"];
const TIME_LABELS = ["아침", "낮", "저녁", "밤"];

// 🚨 ToggleBar와 NotePyramid는 아래 PerfumeDetail 함수 내부에 정의되어
// 상태 변수에 안전하게 접근합니다.

export const PerfumeDetail: React.FC<Props> = ({ id, onNavigate }) => {
  const [perfume, setPerfume] = useState<Perfume | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  // 💡 호버 상태
  const [hoverNote, setHoverNote] = useState<"top" | "heart" | "base" | null>(
    null
  );

  // 목업 데이터 유지 (실제 데이터는 data/perfumes.ts에서 가져옴)
  const similarMock = [
    { id: 2, name: "Sunlit Cedar", brand: "Northwood", color: "#A65A37" },
    { id: 3, name: "Cotton Haze", brand: "Soft Co.", color: "#D3D6D8" },
    { id: 4, name: "Blooming Tea", brand: "Teaflor", color: "#C4C462" },
  ];

  // =======================================================
  // 💡 [컴포넌트 1] ToggleBar (스코프 문제 해결)
  // =======================================================
  const ToggleBar: React.FC<{
    label: string;
    value: number;
    matchData?: Perfume["season_match"] | Perfume["time_match"];
    max: number;
    color: string;
    scaleLabels?: string[];
  }> = ({ label, value, matchData, max, color, scaleLabels }) => {
    const isPerformance = max === 10;
    const isMatchScale = !!matchData;

    let togglePosition: number;
    let matchLabel = "";

    if (isPerformance) {
      togglePosition = (value / max) * 100;
    } else if (isMatchScale && scaleLabels) {
      const keys = Object.keys(matchData as any) as Array<
        keyof typeof matchData
      >;

      let maxScore = -1;
      let maxIndex = 0;

      keys.forEach((key, index) => {
        const score = (matchData as any)[key];
        if (score > maxScore) {
          maxScore = score;
          maxIndex = index;
        }
      });

      matchLabel = scaleLabels[maxIndex];
      togglePosition = (maxIndex / (scaleLabels.length - 1)) * 100;
    } else {
      togglePosition = 0;
    }

    const numSteps = scaleLabels?.length ?? 0;

    return (
      <div className="mb-8">
        <div className="text-sm text-gray-600 mb-4 flex justify-between items-end">
          <span>{label}</span>
          {isPerformance ? (
            <span className="text-sm font-semibold text-neutral-800">{`${value}/10`}</span>
          ) : (
            <span className="text-sm font-semibold text-neutral-800">
              {matchLabel} 추천
            </span>
          )}
        </div>
        <div className="relative h-2 bg-gray-200 rounded-full overflow-visible">
          <div
            className="h-full rounded-full"
            style={{
              width: isPerformance ? `${togglePosition}%` : "100%",
              backgroundColor: isPerformance ? color : "transparent",
            }}
          ></div>

          {isMatchScale && (
            <div className="absolute inset-0 flex justify-between items-center px-[0.1rem]">
              <div className="absolute left-[0%] top-1/2 w-px h-3 bg-gray-400 -translate-y-1/2"></div>
              <div className="absolute left-[33.333%] top-1/2 w-px h-3 bg-gray-400 -translate-y-1/2"></div>
              <div className="absolute left-[66.666%] top-1/2 w-px h-3 bg-gray-400 -translate-y-1/2"></div>
              <div className="absolute left-[100%] top-1/2 w-px h-3 bg-gray-400 -translate-y-1/2"></div>
            </div>
          )}

          {scaleLabels && (
            <div className={`absolute inset-0 flex justify-between`}>
              {scaleLabels.map((l, i) => (
                <div
                  key={i}
                  className="absolute top-4 text-xs text-neutral-500 font-medium text-center"
                  style={{
                    left: `${(i / (numSteps - 1)) * 100}%`,
                    transform: `translateX(${
                      i === 0 ? "0" : i === numSteps - 1 ? "-100%" : "-50%"
                    })`,
                    whiteSpace: "nowrap",
                  }}
                >
                  {l}
                </div>
              ))}
            </div>
          )}

          <div
            className="absolute top-1/2 -translate-y-1/2 rounded-full border-2 shadow-md transition-all duration-300"
            style={{
              backgroundColor: color,
              width: "12px",
              height: "12px",
              left: `${togglePosition}%`,
              transform: "translateY(-50%) translateX(-50%)",
            }}
          ></div>
        </div>
      </div>
    );
  };

  // =======================================================
  // 💡 [컴포넌트 2] NotePyramid (스코프 문제 해결)
  // =======================================================
  const NotePyramid: React.FC<{ color: string }> = ({ color }) => {
    // 💡 activeNote 상태에 접근하여 배경색을 결정하는 헬퍼 함수
    const getSectionFill = (section: "top" | "heart" | "base") => {
      if (hoverNote === section) return "rgba(211, 214, 216, 0.5)"; // 연한 회색 하이라이트 (#D3D6D8)
      return "none";
    };

    return (
      <svg
        width="200"
        height="200"
        viewBox="0 0 200 200"
        className="mx-auto"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-neutral-500"
        >
          {/* 피라미드 외곽선 */}
          <path d="M 10 190 L 100 10 L 190 190 Z" />

          {/* Middle/Base 구분선 */}
          <line x1="10" y1="130" x2="190" y2="130" />

          {/* Top/Middle 구분선 */}
          <line x1="10" y1="70" x2="190" y2="70" />
        </g>

        {/* 💡 호버 섹션 배경 (마우스 이벤트를 잡지 않고, getSectionFill 결과만 표시) */}
        <polygon
          points="10,130 190,130 190,190 10,190"
          fill={getSectionFill("base")}
        />
        <polygon
          points="10,70 190,70 190,130 10,130"
          fill={getSectionFill("heart")}
        />
        <polygon points="100,10 190,70 10,70" fill={getSectionFill("top")} />

        {/* 텍스트 레이블 (SVG 텍스트) */}
        <text
          x="100"
          y="45"
          textAnchor="middle"
          fontSize="14"
          fontWeight="bold"
          fill={color}
        >
          Top Notes
        </text>
        <text
          x="100"
          y="105"
          textAnchor="middle"
          fontSize="14"
          fontWeight="bold"
          fill={color}
        >
          Heart Notes
        </text>
        <text
          x="100"
          y="165"
          textAnchor="middle"
          fontSize="14"
          fontWeight="bold"
          fill={color}
        >
          Base Notes
        </text>
      </svg>
    );
  };

  // =======================================================
  // React Hooks 및 핸들러
  // =======================================================
  useEffect(() => {
    if (id) {
      const data = getPerfumeById(id);
      if (data) {
        setPerfume(data);
      } else {
        console.error(`Perfume with id ${id} not found.`);
      }
    }
    setIsBookmarked(localStorage.getItem(`bookmark-${id}`) === "true");
  }, [id]);

  if (!perfume) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-16 text-center text-gray-500">
        향수 정보를 불러오는 중입니다...
      </div>
    );
  }

  const detailColor = perfume.color_hex ?? "#3B82F6";

  const handleBookmark = () => {
    const newState = !isBookmarked;
    setIsBookmarked(newState);
    if (newState) {
      localStorage.setItem(`bookmark-${id}`, "true");
      console.log("북마크에 추가되었습니다.");
    } else {
      localStorage.removeItem(`bookmark-${id}`);
      console.log("북마크가 해제되었습니다.");
    }
  };

  // 💡 호버에 따른 태그 하이라이트 클래스
  const getNoteClass = (type: "top" | "heart" | "base") => {
    if (!hoverNote) return "bg-white border-gray-100";
    if (hoverNote === type) return "bg-gray-100 border-gray-300 shadow-md"; // 연한 회색 강조
    return "bg-white border-gray-100 opacity-50"; // 비활성화된 노트
  };

  return (
    <div
      id="perfume-detail-root"
      className="container mx-auto max-w-5xl px-4 py-8 space-y-8"
    >
      {/* 1. Breadcrumb */}
      <Breadcrumb
        showHomeIcon={false}
        separatorIcon={<span>/</span>}
        items={[
          { label: "홈", onClick: () => onNavigate?.("home") },
          { label: "향수 목록", onClick: () => onNavigate?.("all-perfumes") },
          { label: perfume.name, current: true },
        ]}
      />

      {/* 2. 상단 헤더 복구 */}
      <header className="text-center space-y-1 mb-8">
        <h2 className="text-3xl font-bold tracking-tight">향수 상세</h2>
        <p className="text-gray-600">해당 향수의 자세한 정보를 살펴보세요.</p>
      </header>

      {/* 향수 메인 설명 */}
      <section className="space-y-6">
        {/* 이미지 */}
        <div className="rounded-3xl overflow-hidden bg-gray-100 h-64 md:h-80 flex items-center justify-center">
          <img
            src={perfume.image}
            alt={perfume.name}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="space-y-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-semibold">
              {perfume.name}
            </h2>
            <p className="text-gray-500 text-lg">{perfume.brand}</p>
          </div>
          {/* 전체 태그 목록 */}
          <div className="flex flex-wrap gap-2">
            {[
              ...perfume.top,
              ...perfume.heart,
              ...perfume.base,
              perfume.family,
            ].map((tag, i) => (
              <span
                key={tag + i} // 키 충돌 방지
                className="px-3 py-1 rounded-full text-sm bg-gray-100"
              >
                #{tag}
              </span>
            ))}
          </div>
          {/* 버튼 영역 */}
          <div className="flex gap-3">
            <button
              onClick={handleBookmark}
              className={`flex-1 border rounded-lg py-2 flex items-center justify-center gap-2 transition-colors ${
                isBookmarked
                  ? "bg-yellow-500 text-white border-yellow-500"
                  : "border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Bookmark size={18} fill={isBookmarked ? "white" : "none"} />
              {isBookmarked ? "북마크 해제" : "북마크"}
            </button>
            <a
              href={perfume.purchase_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-black text-white rounded-lg py-2 flex items-center justify-center gap-2 hover:bg-neutral-800"
            >
              <ExternalLink size={18} /> 사이트로 이동
            </a>
          </div>
        </div>
      </section>

      {/* 노트 구조 - 피라미드 분리 및 강조 효과 */}
      <section className="rounded-2xl bg-white shadow p-6 space-y-6">
        <h3 className="text-xl font-semibold mb-2">노트 구조 (향조 시각화)</h3>
        <div className="flex flex-col md:flex-row items-start gap-8">
          {/* 1. 노트 피라미드 (시각화) */}
          <div className="md:w-1/2 flex flex-col items-center">
            {/* activeNote 상태를 props로 전달 */}
            <NotePyramid color={detailColor} />
          </div>

          {/* 2. 향조 태그 목록 (강조 효과) */}
          <div className="md:w-1/2 space-y-4 text-sm">
            {/* Top Notes */}
            <div
              className={`rounded-lg border-2 p-3 transition-all cursor-default ${getNoteClass(
                "top"
              )}`}
              onMouseEnter={() => setHoverNote("top")}
              onMouseLeave={() => setHoverNote(null)}
            >
              <div className="font-semibold mb-1">Top Notes (처음)</div>
              <div className="flex gap-2 flex-wrap">
                {perfume.top.map((n, i) => (
                  <span
                    key={n + i}
                    className="bg-white px-2 py-1 rounded-full border text-xs"
                  >
                    {n}
                  </span>
                ))}
              </div>
            </div>

            {/* Heart Notes */}
            <div
              className={`rounded-lg border-2 p-3 transition-all cursor-default ${getNoteClass(
                "heart"
              )}`}
              onMouseEnter={() => setHoverNote("heart")}
              onMouseLeave={() => setHoverNote(null)}
            >
              <div className="font-semibold mb-1">Heart Notes (중심)</div>
              <div className="flex gap-2 flex-wrap">
                {perfume.heart.map((n, i) => (
                  <span
                    key={n + i}
                    className="bg-white px-2 py-1 rounded-full border text-xs"
                  >
                    {n}
                  </span>
                ))}
              </div>
            </div>

            {/* Base Notes */}
            <div
              className={`rounded-lg border-2 p-3 transition-all cursor-default ${getNoteClass(
                "base"
              )}`}
              onMouseEnter={() => setHoverNote("base")}
              onMouseLeave={() => setHoverNote(null)}
            >
              <div className="font-semibold mb-1">Base Notes (잔향)</div>
              <div className="flex gap-2 flex-wrap">
                {perfume.base.map((n, i) => (
                  <span
                    key={n + i}
                    className="bg-white px-2 py-1 rounded-full border text-xs"
                  >
                    {n}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 향수 특성 - 그래프 통일 (토글 바) */}
      <section className="rounded-2xl bg-white shadow p-6 space-y-4">
        <h3 className="text-xl font-semibold mb-6">향수 특성 및 추천 감각</h3>

        {/* 1. 지속력 (0-10) */}
        <ToggleBar
          label="지속력"
          value={perfume.longevity}
          max={10}
          color={detailColor}
        />

        {/* 2. 확산력 (0-10) */}
        <ToggleBar
          label="확산력"
          value={perfume.sillage}
          max={10}
          color={detailColor}
        />

        {/* 3. 추천 계절 (4포인트 매칭) */}
        <div className="pt-6">
          <ToggleBar
            label="추천 계절"
            matchData={perfume.season_match}
            max={5}
            color={detailColor}
            scaleLabels={SEASON_LABELS}
          />
        </div>

        {/* 4. 추천 시간대 (4포인트 매칭) */}
        <div className="pt-6">
          <ToggleBar
            label="추천 시간대"
            matchData={perfume.time_match}
            max={5}
            color={detailColor}
            scaleLabels={TIME_LABELS}
          />
        </div>
      </section>

      {/* 비슷한 향수 */}
      <section className="space-y-4">
        <h3 className="text-xl font-semibold">비슷한 향수</h3>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
          {similarMock.map((s) => (
            <div
              key={s.id}
              onClick={() => onNavigate?.(`perfume-${s.id}`)}
              className={`rounded-2xl p-6 text-white flex flex-col justify-center cursor-pointer hover:opacity-80 transition`}
              style={{ backgroundColor: s.color }}
            >
              <div className="mt-4">
                <div className="text-lg font-medium">{s.name}</div>
                <div className="text-sm">{s.brand}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default PerfumeDetail;
