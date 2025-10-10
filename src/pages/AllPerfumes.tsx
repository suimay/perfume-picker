import React, { useMemo, useState } from "react";
import type { Perfume } from "../data/perfumes";
import { perfumes } from "../data/perfumes";

type Props = { onNavigate?: (page: string) => void };

/**
 * ✅ SECTIONED LAYOUT – 향수 목록 페이지
 * 섹션별로 주석 달아뒀으니 기존 UI를 그대로 이 위치에 채워넣으면 됩니다.
 * - 0. Breadcrumb (선택)
 * - 1. PageHeader (제목/설명)
 * - 2. Controls (검색/필터/정렬)
 * - 3. Grid (카드 목록)
 * - 4. Pagination (선택)
 * - 5. FooterCTA (선택)
 */

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
      const byText =
        !text ||
        `${p.name} ${p.brand} ${p.top.join(",")} ${p.heart.join(
          ","
        )} ${p.base.join(",")}`
          .toLowerCase()
          .includes(text);
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
      {/* 0) Breadcrumb ------------------------------------------------------ */}
      <nav className="text-sm text-gray-500">
        <button
          className="hover:underline"
          onClick={() => onNavigate?.("home")}
        >
          홈
        </button>
        <span className="mx-2">/</span>
        <span className="text-gray-900">향수 목록</span>
      </nav>

      {/* 1) PageHeader ------------------------------------------------------ */}
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">향수 목록</h1>
        <p className="text-gray-600 mt-1">취향과 계열로 빠르게 찾아보세요.</p>
      </header>

      {/* 2) Controls (검색/필터/정렬) --------------------------------------- */}
      <section
        aria-label="controls"
        className="rounded-2xl bg-white shadow p-4 grid gap-3 sm:grid-cols-3"
      >
        <div>
          <label className="block text-sm text-gray-500 mb-1">검색</label>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="이름/브랜드/노트로 검색"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/10"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-500 mb-1">계열</label>
          <select
            value={family}
            onChange={(e) => setFamily(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2"
          >
            {families.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-500 mb-1">정렬</label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as any)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2"
          >
            <option value="name-asc">이름 오름차순</option>
            <option value="name-desc">이름 내림차순</option>
          </select>
        </div>
      </section>

      {/* 3) Grid ------------------------------------------------------------ */}
      <section aria-label="grid">
        <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p: Perfume) => (
            <article
              key={p.id}
              className="rounded-2xl bg-white shadow hover:shadow-lg transition"
            >
              <button
                onClick={() => goDetail(p.id)}
                className="block w-full text-left"
              >
                <div className="h-44 bg-gray-100 rounded-t-2xl overflow-hidden flex items-center justify-center">
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
                <div className="p-4 space-y-1">
                  <div className="text-xs text-gray-500">{p.brand}</div>
                  <h3 className="text-lg font-medium">{p.name}</h3>
                  <div className="text-xs inline-block mt-1 bg-gray-100 px-2 py-0.5 rounded-full">
                    {p.family}
                  </div>
                  <p className="text-sm text-gray-500 truncate">
                    Top: {p.top.join(", ")}
                  </p>
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

      {/* 4) Pagination (필요 시) ------------------------------------------- */}
      {/* <footer className="flex justify-center">
        <button className="px-4 py-2 rounded-lg bg-gray-100">더 보기</button>
      </footer> */}

      {/* 5) FooterCTA (선택) ------------------------------------------------ */}
      {/* 원하는 CTA 섹션을 배치하세요 */}
    </div>
  );
};

export default AllPerfumes;
