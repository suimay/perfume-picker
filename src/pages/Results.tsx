// src/pages/Results.tsx

import { useEffect, useState } from "react";
import { Card } from "../components/Card";
// DB 대신 로컬 데이터셋 사용을 위해 import
import { perfumes, Perfume } from "../data/perfumes";

type Props = {
  onNavigate: (page: string) => void;
  preferences?: {
    selectedScents?: string[]; // 'fresh', 'sweet', 'warm', ...
    excludedNotes?: string[]; // 'no-vanilla', 'no-citrus', ...
  } | null;
};

type Weather = { sky: string; temp: number; hum: number };
type AlgoOptions = { seasonBoost: boolean; tempWeight: number };

// 로컬스토리지 키 (MyPage와 동일)
const LS_ALGO = "algoOptions";

// 💡 Perfume 객체에 포함된 노트들을 기반으로 Preferences의 제외 옵션을 매칭하는 헬퍼 함수
const matchNoteToExclusion = (note: string, excludedNotes: string[]) => {
  const noteLower = note.toLowerCase();

  if (
    excludedNotes.includes("no-vanilla") &&
    /vanilla|gourmand|tonka/.test(noteLower)
  )
    return true;
  if (
    excludedNotes.includes("no-citrus") &&
    /citrus|lemon|orange|lime/.test(noteLower)
  )
    return true;
  if (
    excludedNotes.includes("no-musk") &&
    /musk|aldehyde|powder|cotton/.test(noteLower)
  )
    return true;

  return false;
};

// 💡 리팩토링된 추천 점수 계산 함수 (3감각 융합의 핵심 로직)
function scorePerfume(
  p: Perfume, // Perfume 데이터 (color_hex, feeling_tags 포함)
  prefs: Props["preferences"],
  weather: Weather,
  options: AlgoOptions
) {
  let s = 0;

  const selectedScents = new Set(
    (prefs?.selectedScents ?? []).map((v) => v.toLowerCase())
  );
  const excludedNotes = prefs?.excludedNotes ?? [];

  // (1) 취향(감각 키워드) 기반 가점 (프로젝트 핵심)
  if (selectedScents.size > 0) {
    const matchedFeelings = p.feeling_tags.filter((tag: string) =>
      selectedScents.has(tag)
    );
    // 선택된 감각 키워드 1개당 10점씩 가점
    s += matchedFeelings.length * 10;
  }

  // (2) 날씨(환경) 기반 가중치 (3감각 중 날씨 반영)
  const w = options.tempWeight ?? 1; // 기온 가중치 (0~2)

  if (options.seasonBoost) {
    if (weather.temp >= 25 || weather.sky.includes("맑음")) {
      // 더운 날 or 맑은 날 -> 'fresh', 'sharp' 키워드와 일치하는 향수에 추가 가점
      if (p.feeling_tags.includes("fresh") || p.feeling_tags.includes("sharp"))
        s += 3 * w;
    }
    if (
      weather.temp <= 15 ||
      weather.sky.includes("비") ||
      weather.sky.includes("구름")
    ) {
      // 추운 날 or 흐린 날 -> 'warm', 'calm' 키워드와 일치하는 향수에 추가 가점
      if (p.feeling_tags.includes("warm") || p.feeling_tags.includes("calm"))
        s += 3 * w;
    }
  }

  // (3) 제외 옵션 감점 (필터링)
  const allNotes: string[] = [...p.top, ...p.heart, ...p.base].map((v) =>
    v.toLowerCase()
  );
  const isExcluded = allNotes.some((note) =>
    matchNoteToExclusion(note, excludedNotes)
  );

  if (isExcluded) {
    s -= 50; // 감점 폭을 크게 설정하여 사실상 제외되도록 유도
  }

  // 점수가 음수일 경우 0으로 보정 (필터링되지 않은 경우만)
  return Math.max(0, s);
}

export function Results({ onNavigate, preferences }: Props) {
  // 상단 보조(날씨)
  const [weather, setWeather] = useState<Weather>({
    sky: "맑음",
    temp: 22,
    hum: 45,
  });

  // 마이페이지에서 저장된 알고리즘 옵션 읽기
  const [algo, setAlgo] = useState<AlgoOptions>({
    seasonBoost: true,
    tempWeight: 1,
  });

  // 💡 [오류 수정 핵심] main, leftOne, rightOne 상태가 여기서 정의되며,
  // 컴포넌트 내부에서 안전하게 사용됩니다.
  const [list, setList] = useState<Perfume[]>([]);
  const [main, setMain] = useState<Perfume | null>(null);
  const [leftOne, setLeftOne] = useState<Perfume | null>(null);
  const [rightOne, setRightOne] = useState<Perfume | null>(null);

  // 중앙 카드 플립
  const [flipped, setFlipped] = useState(false);

  // 초기 로드 시 날씨 및 옵션 설정
  useEffect(() => {
    setWeather({ sky: "맑음", temp: 22, hum: 45 });
    const saved = localStorage.getItem(LS_ALGO);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setAlgo({
          seasonBoost: Boolean(parsed.seasonBoost ?? true),
          tempWeight: Number(parsed.tempWeight ?? 1),
        });
      } catch {
        // ignore
      }
    }
  }, []);

  // 추천 로직 실행 (preferences, weather, algo가 변경될 때마다)
  useEffect(() => {
    (async () => {
      // 💡 로컬 데이터셋 사용
      const data = perfumes;

      if (data) {
        const scored = data
          .map((p: Perfume) => ({
            p,
            s: scorePerfume(p, preferences || undefined, weather, algo),
          }))
          .filter((x: any) => x.s > 0) // 점수가 0보다 큰 것만 필터링 (제외된 항목 제거)
          .sort((a, b) => b.s - a.s)
          .map((x: any) => x.p) as Perfume[];
        setList(scored);
      }
    })();
  }, [
    preferences,
    weather.sky,
    weather.temp,
    weather.hum,
    algo.seasonBoost,
    algo.tempWeight,
  ]);

  // 추천 결과 할당
  useEffect(() => {
    if (list.length > 0) {
      setMain(list[0] ?? null);
      setLeftOne(list[1] ?? null);
      setRightOne(list[2] ?? null);
      if (list[0]) localStorage.setItem("lastPerfumeId", String(list[0].id));
    } else {
      setMain(null);
      setLeftOne(null);
      setRightOne(null);
    }
  }, [list]);

  const toggleFlip = () => setFlipped((v) => !v);

  // 💡 메인 추천 카드 색상 적용
  const mainBgColor = main?.color_hex ?? "#FFFFFF";

  // 텍스트 색상 결정 헬퍼 (예: 배경색이 어두우면 흰색 텍스트)
  const isColorDark = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    // 휘도 계산 (ITU-R BT.709)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b < 140;
  };
  const mainTextColor = isColorDark(mainBgColor)
    ? "text-white"
    : "text-neutral-900";

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 space-y-8">
      {/* 상단 헤더 */}
      <header className="text-center space-y-2">
        <h1 className="text-2xl md:text-3xl font-semibold">추천 결과</h1>
        <p className="text-sm text-neutral-500">
          {weather.sky} · {weather.temp}°C · {weather.hum}% 기준
        </p>
        {list.length === 0 && preferences && (
          <p className="text-red-500">
            선택한 취향/날씨에 맞는 향수가 없습니다. 조건을 다시 설정해주세요.
          </p>
        )}
      </header>

      {/* 3장 레이아웃: 좌/중/우 (색상 동적 적용) */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Left (유사 추천 1) */}
        <div className="md:pt-6">
          {leftOne && (
            // 💡 유사 추천 카드는 테두리 색상만 적용하여 메인 카드와 차별화
            <Card
              className="p-4 md:p-5 cursor-pointer scale-95 border-4 hover:scale-100"
              style={{ borderColor: leftOne.color_hex ?? "#D3D6D8" }}
              onClick={() => {
                localStorage.setItem("lastPerfumeId", String(leftOne.id));
                onNavigate(`perfume-${leftOne.id}`);
              }}
              aria-label="유사 추천 향수"
            >
              <div className="w-full h-24 bg-neutral-200/60 rounded-md mb-3" />
              <div className="text-sm text-neutral-500">{leftOne.brand}</div>
              <div className="font-medium leading-snug">{leftOne.name}</div>
            </Card>
          )}
        </div>

        {/* Center (메인 추천 - 플립) */}
        <div className="relative">
          <div
            className="group relative mx-auto max-w-md [perspective:1000px]"
            role="button"
            aria-label="메인 추천 카드"
            onClick={toggleFlip}
          >
            <div
              className={`relative h-80 md:h-96 transition-transform duration-700 [transform-style:preserve-3d] ${
                flipped ? "[transform:rotateY(180deg)]" : ""
              }`}
            >
              {/* 앞면 */}
              <Card
                className={`absolute inset-0 p-6 [backface-visibility:hidden] flex flex-col items-center justify-center text-center ${mainTextColor}`}
                backgroundColor={mainBgColor} // 💡 메인 추천 색상 적용
              >
                {main ? (
                  <div className="space-y-3">
                    <div className="w-28 h-32 bg-neutral-200 rounded-xl mx-auto" />
                    <div className="text-sm">오늘의 베스트 매칭</div>
                    <div className="text-xl md:text-2xl font-semibold">
                      {main.name}
                    </div>
                    <div className="text-neutral-600">{main.brand}</div>
                  </div>
                ) : (
                  <div className="text-neutral-500">
                    조건에 맞는 향수를 찾는 중…
                  </div>
                )}
              </Card>

              {/* 뒷면 — 버튼 눌러 상세로 이동 */}
              <Card
                className={`absolute inset-0 [transform:rotateY(180deg)] [backface-visibility:hidden] p-6 flex flex-col items-center justify-center text-center ${mainTextColor}`}
                backgroundColor={mainBgColor} // 💡 메인 추천 색상 적용
              >
                {main ? (
                  <div className="space-y-4">
                    <div className="text-sm">향조 태그</div>
                    <div className="flex flex-wrap justify-center gap-2">
                      {[...main.top, ...main.heart, ...main.base]
                        .slice(0, 6)
                        .map((n, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 rounded-full border text-xs"
                          >
                            {n}
                          </span>
                        ))}
                    </div>
                    <div className="flex gap-3 justify-center pt-2">
                      {/* (main as any).external_url 필드가 없으므로, 임시로 GitHub 연결 */}
                      <a
                        href={`https://github.com/perfume-detail-${main.id}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="rounded-xl border px-3 py-1.5 text-sm hover:bg-neutral-50"
                      >
                        공식 사이트
                      </a>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          localStorage.setItem(
                            "lastPerfumeId",
                            String(main.id)
                          );
                          onNavigate(`perfume-${main.id}`);
                        }}
                        className="rounded-xl border px-3 py-1.5 text-sm hover:bg-neutral-50"
                      >
                        상세 페이지로
                      </button>
                    </div>
                    <div className="text-xs">
                      카드를 다시 클릭하면 앞면으로 돌아갑니다
                    </div>
                  </div>
                ) : null}
              </Card>
            </div>
          </div>
        </div>

        {/* Right (유사 추천 2) */}
        <div className="md:pt-6">
          {rightOne && (
            // 💡 유사 추천 카드는 테두리 색상만 적용하여 메인 카드와 차별화
            <Card
              className="p-4 md:p-5 cursor-pointer scale-95 border-4 hover:scale-100"
              style={{ borderColor: rightOne.color_hex ?? "#D3D6D8" }}
              onClick={() => {
                localStorage.setItem("lastPerfumeId", String(rightOne.id));
                onNavigate(`perfume-${rightOne.id}`);
              }}
              aria-label="유사 추천 향수"
            >
              <div className="w-full h-24 bg-neutral-200/60 rounded-md mb-3" />
              <div className="text-sm text-neutral-500">{rightOne.brand}</div>
              <div className="font-medium leading-snug">{rightOne.name}</div>
            </Card>
          )}
        </div>
      </section>

      {/* 푸터 */}
      <footer className="pt-6 pb-6 text-center text-xs text-neutral-500">
        2025SUINWebProjectHYAG
      </footer>
    </main>
  );
}
