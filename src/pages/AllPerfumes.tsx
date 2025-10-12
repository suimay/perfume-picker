// src/pages/AllPerfumes.tsx

import React, { useMemo, useState } from "react";
import type { Perfume } from "../data/perfumes";
import { perfumes } from "../data/perfumes";
import Breadcrumb from "../components/Breadcrumb";
import { Search, Sun, Clock, Filter, List } from "lucide-react"; // 아이콘 추가

type Props = { onNavigate?: (page: string) => void };

// 💡 날씨/시간대 매칭 헬퍼 함수
const getWeatherEmoji = (match: Perfume["season_match"]) => {
  const highest = Object.keys(match).reduce((a, b) =>
    match[a as keyof typeof match] > match[b as keyof typeof match] ? a : b
  );

  switch (highest) {
    case "summer":
      return "☀️"; // 여름
    case "spring":
      return "🌸"; // 봄
    case "fall":
      return "🍂"; // 가을
    case "winter":
      return "❄️"; // 겨울
    default:
      return "✨";
  }
};
const getTimeEmoji = (match: Perfume["time_match"]) => {
  const highest = Object.keys(match).reduce((a, b) =>
    match[a as keyof typeof match] > match[b as keyof typeof match] ? a : b
  );

  switch (highest) {
    case "morning":
      return "🌄"; // 오전
    case "afternoon":
      return "🌤️"; // 오후
    case "evening":
      return "🌆"; // 저녁
    case "night":
      return "🌙"; // 밤
    default:
      return "⏱️";
  }
};

export const AllPerfumes: React.FC<Props> = ({ onNavigate }) => {
  // --- Controls 상태 ---------------------------------------------------------
  const [q, setQ] = useState("");
  const [family, setFamily] = useState<string>("all");
  const [sort, setSort] = useState<"name-asc" | "name-desc">("name-asc");

  const families = useMemo(() => {
    const s = new Set<string>();
    perfumes.forEach((p) => s.add(p.family));
    return ["all", ...Array.from(s)];
  }, []);

  const filtered = useMemo(() => {
    const text = q.trim().toLowerCase();
    let list = perfumes.filter((p) => {
      // Top Note가 제거되었으므로, feeling_tags도 검색에 포함
      const searchableText = `${p.name} ${p.brand} ${
        p.family
      } ${p.feeling_tags.join(",")} ${p.heart.join(",")} ${p.base.join(
        ","
      )}`.toLowerCase();
      const byText = !text || searchableText.includes(text);
      const byFamily = family === "all" || p.family === family;
      return byText && byFamily;
    });
    if (sort === "name-asc")
      list = list.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "name-desc")
      list = list.sort((a, b) => b.name.localeCompare(a.name));
    return list;
  }, [q, family, sort]);

  function goDetail(id: number) {
    const page = `perfume-${id}`;
    try {
      localStorage.setItem("lastPerfumeId", String(id));
    } catch {}
    onNavigate
      ? onNavigate(page)
      : window.dispatchEvent(new CustomEvent("app:navigate", { detail: page }));
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 space-y-8">
      {/* 1) Breadcrumb (디자인 통일) */}
      <Breadcrumb
        showHomeIcon={false}
        separatorIcon={<span>/</span>} // 구분 기호 '/'로 통일
        items={[
          { label: "홈", onClick: () => onNavigate?.("home") },
          { label: "향수 목록", current: true },
        ]}
      />

      {/* 2) PageHeader */}
      <header className="text-center">
        <h1 className="text-3xl font-semibold tracking-tight">향수 목록</h1>
        <p className="text-gray-600 mt-1">취향과 계열로 빠르게 찾아보세요</p>
      </header>

      {/* 3) 검색창 디자인 개선 */}
      <section
        aria-label="search"
        className="rounded-2xl bg-white shadow p-4 mb-6"
      >
        <label className="block text-sm text-gray-500 mb-1 flex items-center">
          <Search className="w-4 h-4 mr-2" /> 통합 검색
        </label>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="이름 / 브랜드 / 노트 / 감각 태그로 검색"
          className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-neutral-900/50"
        />
      </section>

      {/* 4) 필터/정렬 디자인 개선 */}
      <section
        aria-label="controls"
        className="rounded-2xl bg-white shadow p-4 grid gap-3 sm:grid-cols-2"
      >
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-500" />
          <div className="flex-1">
            <label className="block text-sm text-gray-500 mb-1">계열</label>
            <select
              value={family}
              onChange={(e) => setFamily(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 bg-white appearance-none"
            >
              {families.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <List className="w-5 h-5 text-gray-500" />
          <div className="flex-1">
            <label className="block text-sm text-gray-500 mb-1">정렬</label>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as any)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 bg-white appearance-none"
            >
              <option value="name-asc">이름 오름차순</option>
              <option value="name-desc">이름 내림차순</option>
            </select>
          </div>
        </div>
      </section>

      {/* 5) Grid (카드 디자인 개선) */}
      <section aria-label="grid" className="pt-4">
        <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p: Perfume) => (
            <article
              key={p.id}
              className="rounded-2xl bg-white shadow hover:shadow-lg transition overflow-hidden"
            >
              <button
                onClick={() => goDetail(p.id)}
                className="block w-full text-left"
              >
                <div className="h-44 bg-gray-100 overflow-hidden flex items-center justify-center">
                  {p.image ? (
                    <img
                      src={p.image}
                      alt={p.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-gray-400">이미지 없음</span>
                  )}
                </div>

                {/* 💡 감각 색상 띠 적용 */}
                <div className="relative p-4 space-y-1">
                  <div
                    className="absolute top-0 left-0 h-1 w-full"
                    style={{ backgroundColor: p.color_hex }}
                  />

                  <div className="text-xs text-gray-500">{p.brand}</div>
                  <h3 className="text-lg font-medium">{p.name}</h3>

                  {/* 💡 추천 날씨/시간대 이모티콘 태그 */}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-lg" title="추천 계절">
                      <Sun className="w-4 h-4 mr-1 inline-block text-gray-600" />
                      {getWeatherEmoji(p.season_match)}
                    </span>
                    <span className="text-lg" title="추천 시간대">
                      <Clock className="w-4 h-4 mr-1 inline-block text-gray-600" />
                      {getTimeEmoji(p.time_match)}
                    </span>
                    <span className="text-xs inline-block bg-gray-100 px-2 py-0.5 rounded-full ml-auto">
                      {p.family}
                    </span>
                  </div>
                </div>
              </button>
            </article>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full text-center text-gray-500 py-12">
              조건에 맞는 향수가 없습니다.
            </div>
          )}
        </div>
      </section>

      {/* ... (푸터 유지) ... */}
    </div>
  );
};

export default AllPerfumes;
