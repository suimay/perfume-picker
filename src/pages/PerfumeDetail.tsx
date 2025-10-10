import React from "react";
import { Bookmark, ExternalLink, ArrowLeft } from "lucide-react";
import Breadcrumb from "../components/Breadcrumb";

type Props = { id?: number; onNavigate?: (page: string) => void };

export const PerfumeDetail: React.FC<Props> = ({ id, onNavigate }) => {
  // 실제 데이터는 DB나 mock 데이터로부터 받아올 수도 있음
  const perfume = {
    id: 1,
    nameKo: "조 말론 우드 세이지 앤 씨 솔트",
    nameEn: "Jo Malone Wood Sage & Sea Salt",
    description: "바다의 싱그러움과 우디한 세이지가 어우러진 상쾌한 향수",
    tags: ["#상큼한", "#깔끔한", "#차가운"],
    image: "/images/wood-sage.jpg",
    notes: {
      top: ["시트러스", "레몬"],
      middle: ["세이지", "바다향"],
      base: ["우드", "앰버그리스"],
    },
    longevity: 6,
    sillage: 7,
    seasons: ["봄", "여름"],
    times: ["낮", "오후"],
    similar: [
      { id: 2, name: "디올 소바쥬", brand: "Dior", color: "bg-[#8b5236]" },
      { id: 3, name: "구딸 뚜 딸플뢰", brand: "Goutal", color: "bg-[#b8c87f]" },
      {
        id: 4,
        name: "바이레도 집시 워터",
        brand: "Byredo",
        color: "bg-[#e5a84a]",
      },
    ],
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 space-y-8">
      {/* 상단: 제목 + 뒤로가기 버튼 */}
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold tracking-tight">향(香)</h1>
        <button
          onClick={() => onNavigate?.("all-perfumes")}
          className="flex items-center border rounded-lg px-4 py-2 text-sm hover:bg-gray-50"
        >
          <ArrowLeft className="mr-1 w-4 h-4" /> 뒤로가기
        </button>
      </div>

      {/* Breadcrumb */}
      <Breadcrumb
        className="mt-2"
        showHomeIcon={false}
        items={[
          { label: "홈", onClick: () => onNavigate?.("home") },
          { label: "향수 목록", onClick: () => onNavigate?.("all-perfumes") },
          { label: perfume.nameEn, current: true },
        ]}
      />

      {/* 향수 메인 설명 */}
      <section className="space-y-6">
        {/* 이미지 */}
        <div className="rounded-3xl overflow-hidden bg-gray-100 h-64 md:h-80 flex items-center justify-center">
          <img
            src={perfume.image}
            alt={perfume.nameKo}
            className="w-full h-full object-cover"
          />
        </div>

        {/* 이름 / 설명 / 태그 / 버튼 */}
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-semibold">
              {perfume.nameKo}
            </h2>
            <p className="text-gray-500 text-lg">{perfume.nameEn}</p>
          </div>
          <p className="text-gray-700">{perfume.description}</p>
          <div className="flex flex-wrap gap-2">
            {perfume.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 rounded-full text-sm bg-gray-100"
              >
                {tag}
              </span>
            ))}
          </div>
          <div className="flex gap-3">
            <button className="flex-1 border rounded-lg py-2 flex items-center justify-center gap-2">
              <Bookmark size={18} /> 북마크
            </button>
            <button className="flex-1 bg-black text-white rounded-lg py-2 flex items-center justify-center gap-2">
              <ExternalLink size={18} /> 구매하기
            </button>
          </div>
        </div>
      </section>

      {/* 노트 구조 */}
      <section className="rounded-2xl bg-white shadow p-6 space-y-6">
        <h3 className="text-xl font-semibold mb-2">노트 구조</h3>
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1 flex justify-center">
            <img
              src="/images/note-pyramid.png"
              alt="노트 구조"
              className="max-h-64 object-contain"
            />
          </div>
          <div className="flex-1 space-y-4 text-sm">
            <div>
              <div className="font-semibold mb-1">Top Notes</div>
              <div className="flex gap-2 flex-wrap">
                {perfume.notes.top.map((n) => (
                  <span key={n} className="bg-gray-100 px-2 py-1 rounded-full">
                    {n}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <div className="font-semibold mb-1">Middle Notes</div>
              <div className="flex gap-2 flex-wrap">
                {perfume.notes.middle.map((n) => (
                  <span key={n} className="bg-gray-100 px-2 py-1 rounded-full">
                    {n}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <div className="font-semibold mb-1">Base Notes</div>
              <div className="flex gap-2 flex-wrap">
                {perfume.notes.base.map((n) => (
                  <span key={n} className="bg-gray-100 px-2 py-1 rounded-full">
                    {n}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 향수 특성 */}
      <section className="rounded-2xl bg-white shadow p-6 space-y-4">
        <h3 className="text-xl font-semibold">향수 특성</h3>
        <div>
          <div className="text-sm text-gray-600 mb-1">지속력</div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-black rounded-full"
              style={{ width: `${(perfume.longevity / 10) * 100}%` }}
            ></div>
          </div>
          <div className="text-right text-xs text-gray-500">
            {perfume.longevity}/10
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-600 mb-1">확산력</div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-black rounded-full"
              style={{ width: `${(perfume.sillage / 10) * 100}%` }}
            ></div>
          </div>
          <div className="text-right text-xs text-gray-500">
            {perfume.sillage}/10
          </div>
        </div>

        <div className="flex flex-wrap gap-4 text-sm">
          <div>
            <div className="font-medium text-gray-700">추천 계절</div>
            <div className="flex gap-2 mt-1">
              {perfume.seasons.map((s) => (
                <span key={s} className="bg-gray-100 px-3 py-1 rounded-full">
                  {s}
                </span>
              ))}
            </div>
          </div>
          <div>
            <div className="font-medium text-gray-700">추천 시간대</div>
            <div className="flex gap-2 mt-1">
              {perfume.times.map((t) => (
                <span key={t} className="bg-gray-100 px-3 py-1 rounded-full">
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 비슷한 향수 */}
      <section className="space-y-4">
        <h3 className="text-xl font-semibold">비슷한 향수</h3>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
          {perfume.similar.map((s) => (
            <div
              key={s.id}
              className={`${s.color} rounded-2xl p-6 text-white flex flex-col justify-center`}
            >
              <div className="flex-1 flex items-center justify-center">
                <div className="text-4xl">✨</div>
              </div>
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
