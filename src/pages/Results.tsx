import { useEffect, useState } from "react";
import { Card } from "../components/Card";
import { supabase, Perfume } from "../lib/supabase";

type Props = {
  onNavigate: (page: string) => void;
  preferences?: {
    liked_notes?: string[];
    disliked_notes?: string[];
  } | null;
};

type Weather = { sky: string; temp: number; hum: number };
type AlgoOptions = { seasonBoost: boolean; tempWeight: number };

// 로컬스토리지 키 (MyPage와 동일)
const LS_ALGO = "algoOptions";

function scorePerfume(
  p: any,
  prefs: Props["preferences"],
  weather: Weather,
  options: AlgoOptions
) {
  let s = 0;

  const liked = new Set((prefs?.liked_notes ?? []).map((v) => v.toLowerCase()));
  const disliked = new Set(
    (prefs?.disliked_notes ?? []).map((v) => v.toLowerCase())
  );

  const notes: string[] = [
    ...(p.top_notes || []),
    ...(p.middle_notes || []),
    ...(p.base_notes || []),
  ].map((v: string) => (v || "").toLowerCase());

  // (1) 취향 기반 가/감점
  for (const n of notes) {
    if (liked.has(n)) s += 3;
    if (disliked.has(n)) s -= 4;
  }

  // (2) 계절/날씨 가중치 (토글 가능)
  if (options.seasonBoost) {
    // 맑음 / 습도 높은 날 보정(간단 데모)
    if (weather.sky.includes("맑")) {
      if (notes.some((n) => /citrus|green|marine|ozon|aqua|mint/.test(n)))
        s += 1.5;
    }
    if (weather.hum > 60 || weather.sky.includes("비")) {
      if (
        notes.some((n) =>
          /woody|amber|vanil|musk|gourmand|tonka|patchouli/.test(n)
        )
      )
        s += 1.5;
    }
  }

  // (3) 기온 가중치 (슬라이더 값 0~2가 계수로 곱해짐)
  const w = options.tempWeight ?? 1;
  if (weather.temp >= 25) {
    // 더운 날 → 산뜻/아쿠아 계열 가점
    if (notes.some((n) => /citrus|aqua|mint|green|tea|marine|ozon/.test(n)))
      s += 2 * w;
  } else if (weather.temp <= 10) {
    // 추운 날 → 우디/앰버/머스크/고몽 가점
    if (
      notes.some((n) =>
        /woody|amber|vanil|musk|gourmand|tonka|sandal|cedar/.test(n)
      )
    )
      s += 2 * w;
  }

  return s;
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

  // 추천 목록(3장만 사용)
  const [list, setList] = useState<Perfume[]>([]);
  const [main, setMain] = useState<Perfume | null>(null);
  const [leftOne, setLeftOne] = useState<Perfume | null>(null);
  const [rightOne, setRightOne] = useState<Perfume | null>(null);

  // 중앙 카드 플립
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    // 날씨 데모 값
    setWeather({ sky: "맑음", temp: 22, hum: 45 });

    // MyPage에서 저장한 옵션 로드
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

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("perfumes")
        .select("*")
        .limit(120);
      if (!error && data) {
        const scored = data
          .map((p: any) => ({
            p,
            s: scorePerfume(p, preferences || undefined, weather, algo),
          }))
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

  useEffect(() => {
    if (list.length > 0) {
      setMain(list[0] ?? null);
      setLeftOne(list[1] ?? null);
      setRightOne(list[2] ?? null);
      if (list[0]) localStorage.setItem("lastPerfumeId", (list[0] as any).id);
    } else {
      setMain(null);
      setLeftOne(null);
      setRightOne(null);
    }
  }, [list]);

  const toggleFlip = () => setFlipped((v) => !v);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 space-y-8">
      {/* 상단 헤더: 중앙/확대 */}
      <header className="text-center space-y-2">
        <h1 className="text-2xl md:text-3xl font-semibold">추천 결과</h1>
        <p className="text-sm text-neutral-500">
          {weather.sky} · {weather.temp}°C · {weather.hum}% 기준
        </p>
      </header>

      {/* 3장 레이아웃: 좌/중/우 (좌우 축소) */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Left */}
        <div className="md:pt-6">
          {leftOne && (
            <Card
              className="p-4 md:p-5 cursor-pointer scale-95"
              onClick={() => {
                localStorage.setItem(
                  "lastPerfumeId",
                  String((leftOne as any).id)
                ); // ✅ 추가
                onNavigate(`perfume-${(leftOne as any).id}`);
              }}
              aria-label="유사 추천 향수"
            >
              <div className="w-full h-24 bg-neutral-200/60 rounded-md mb-3" />
              <div className="text-sm text-neutral-500">
                {(leftOne as any).brand}
              </div>
              <div className="font-medium leading-snug">
                {(leftOne as any).name}
              </div>
            </Card>
          )}
        </div>

        {/* Center (플립) */}
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
              <Card className="absolute inset-0 p-6 [backface-visibility:hidden] flex flex-col items-center justify-center text-center">
                {main ? (
                  <div className="space-y-3">
                    <div className="w-28 h-32 bg-neutral-200 rounded-xl mx-auto" />
                    <div className="text-sm text-neutral-500">
                      오늘의 베스트 매칭
                    </div>
                    <div className="text-xl md:text-2xl font-semibold">
                      {(main as any).name}
                    </div>
                    <div className="text-neutral-600">
                      {(main as any).brand}
                    </div>
                  </div>
                ) : (
                  <div className="text-neutral-500">추천 계산 중…</div>
                )}
              </Card>

              {/* 뒷면 — 버튼 눌러 상세로 이동 */}
              <Card className="absolute inset-0 [transform:rotateY(180deg)] [backface-visibility:hidden] p-6 flex flex-col items-center justify-center text-center">
                {main ? (
                  <div className="space-y-4">
                    <div className="text-sm text-neutral-500">향조 태그</div>
                    <div className="flex flex-wrap justify-center gap-2">
                      {(
                        [
                          ...((main as any).top_notes || []),
                          ...((main as any).middle_notes || []),
                          ...((main as any).base_notes || []),
                        ] as string[]
                      )
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
                      {(main as any).external_url && (
                        <a
                          href={(main as any).external_url}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="rounded-xl border px-3 py-1.5 text-sm hover:bg-neutral-50"
                        >
                          공식 사이트
                        </a>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          localStorage.setItem(
                            "lastPerfumeId",
                            String((main as any).id)
                          ); // ✅ 추가
                          onNavigate(`perfume-${(main as any).id}`);
                        }}
                        className="rounded-xl border px-3 py-1.5 text-sm hover:bg-neutral-50"
                      >
                        상세 페이지로
                      </button>
                    </div>
                    <div className="text-xs text-neutral-400">
                      카드를 다시 클릭하면 앞면으로 돌아갑니다
                    </div>
                  </div>
                ) : null}
              </Card>
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="md:pt-6">
          {rightOne && (
            <Card
              className="p-4 md:p-5 cursor-pointer scale-95"
              onClick={() => {
                localStorage.setItem(
                  "lastPerfumeId",
                  String((leftOne as any).id)
                ); // ✅ 추가
                onNavigate(`perfume-${(leftOne as any).id}`);
              }}
              aria-label="유사 추천 향수"
            >
              <div className="w-full h-24 bg-neutral-200/60 rounded-md mb-3" />
              <div className="text-sm text-neutral-500">
                {(rightOne as any).brand}
              </div>
              <div className="font-medium leading-snug">
                {(rightOne as any).name}
              </div>
            </Card>
          )}
        </div>
      </section>

      {/* 푸터 (홈과 동일) */}
      <footer className="pt-6 pb-6 text-center text-xs text-neutral-500">
        2025SUINWebProjectHYAG
      </footer>
    </main>
  );
}
