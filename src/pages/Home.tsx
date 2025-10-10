import { useState, useEffect } from "react";
import { Cloud, Sun, CloudRain, Droplets, Sparkles } from "lucide-react";
import { Card } from "../components/Card";
import { supabase, Perfume } from "../lib/supabase";

interface HomeProps {
  onNavigate: (page: string) => void;
  user: any;
}

export function Home({ onNavigate, user }: HomeProps) {
  // 날씨(데모 값)
  const [weather, setWeather] = useState<string>("맑음");
  const [temperature, setTemperature] = useState<number>(22);
  const [humidity, setHumidity] = useState<number>(45);

  // 플립/추천 상태
  const [flipped, setFlipped] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [recommended, setRecommended] = useState<Perfume | null>(null);

  // 메인 아이덴티티 이미지 로드 실패 시 폴백
  const [identityError, setIdentityError] = useState<boolean>(false);

  useEffect(() => {
    // TODO: 실제 날씨 API 연동 가능 (현재 데모 값)
    setWeather("맑음");
    setTemperature(22);
    setHumidity(45);
  }, []);

  // 바로추천(플립 시 뒤집힌 면에 표시할 추천 한 개)
  const fetchQuickRecommendation = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("perfumes")
      .select("*")
      .limit(1)
      .order("id", { ascending: false });
    if (data && data.length) {
      setRecommended(data[0] as any);
      localStorage.setItem("lastPerfumeId", (data[0] as any).id);
    }
    setLoading(false);
  };

  const handleFlip = async () => {
    if (!flipped) await fetchQuickRecommendation();
    setFlipped((v) => !v);
  };

  const WeatherIcon = weather.includes("비")
    ? CloudRain
    : weather.includes("구름")
    ? Cloud
    : Sun;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 space-y-10">
      {/* 1) 메인 아이덴티티 이미지 (나중에 타이포/브랜딩 삽입) */}
      <section>
        {!identityError ? (
          <img
            src="/home-identity.jpg"
            alt="메인 아이덴티티 이미지"
            className="w-full h-60 md:h-80 object-cover rounded-2xl"
            onError={() => setIdentityError(true)}
          />
        ) : (
          <div className="w-full h-60 md:h-80 rounded-2xl bg-gradient-to-br from-neutral-900 to-neutral-700 flex items-center justify-center">
            <span className="text-white/80 text-sm md:text-base">
              /public/home-identity.jpg 를 추가해 아이덴티티 이미지를 넣어보세요
            </span>
          </div>
        )}
      </section>

      {/* 2) 타이틀 & 부제(설명) — 유지 */}
      <section className="text-center space-y-2">
        <h1 className="text-2xl md:text-3xl font-semibold">
          보이지 않는 향을, 느껴지는 감각으로
        </h1>
        <p className="text-neutral-600">
          지금의 날씨와 나의 취향을 반영해, 오늘의 향을 가볍게 추천받아 보세요.
        </p>
      </section>

      {/* 3) 오늘의 날씨 ↔ 추천 플립 카드 (버튼 없이 카드 클릭) */}
      <section>
        <div
          className="group relative mx-auto max-w-3xl [perspective:1000px]"
          onClick={handleFlip}
          role="button"
          aria-label="오늘의 날씨 카드, 클릭 시 추천 카드로 전환"
        >
          <div
            className={`relative h-56 md:h-64 transition-transform duration-700 [transform-style:preserve-3d] ${
              flipped ? "[transform:rotateY(180deg)]" : ""
            }`}
          >
            {/* 앞면: 날씨 */}
            <Card className="absolute inset-0 flex items-center justify-between px-4 sm:px-6 md:px-8 [backface-visibility:hidden]">
              <div className="flex items-center gap-4">
                <WeatherIcon className="size-10 text-neutral-700" />
                <div>
                  <div className="text-sm text-neutral-500">오늘의 날씨</div>
                  <div className="text-2xl font-semibold">{weather}</div>
                </div>
              </div>
              <div className="flex items-center gap-8 text-right">
                <div>
                  <div className="text-sm text-neutral-500">기온</div>
                  <div className="text-xl font-medium">{temperature}°C</div>
                </div>
                <div>
                  <div className="text-sm text-neutral-500">습도</div>
                  <div className="text-xl font-medium">{humidity}%</div>
                </div>
                <div className="hidden sm:flex items-center gap-2 text-neutral-500">
                  <Droplets className="size-5" />
                  <span className="text-sm">카드를 눌러 바로 추천</span>
                </div>
              </div>
            </Card>

            {/* 뒷면: 추천 */}
            <Card className="absolute inset-0 px-4 sm:px-6 md:px-8 [transform:rotateY(180deg)] [backface-visibility:hidden] flex flex-col items-center justify-center text-center">
              {loading ? (
                <div className="text-neutral-500">추천 불러오는 중…</div>
              ) : recommended ? (
                <div className="space-y-3">
                  <div className="text-sm text-neutral-500">
                    오늘의 추천 향수
                  </div>
                  <div className="text-2xl font-semibold">
                    {(recommended as any).name}
                  </div>
                  <div className="text-neutral-600">
                    {(recommended as any).brand}
                  </div>
                  <div className="text-sm text-neutral-500">
                    카드를 다시 클릭하면 날씨로 돌아갑니다
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigate(`perfume-${(recommended as any).id}`);
                    }}
                    className="mt-2 inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm hover:bg-neutral-50"
                  >
                    <Sparkles className="size-4" /> 상세 보기
                  </button>
                </div>
              ) : (
                <div className="text-neutral-500">추천 항목이 없습니다.</div>
              )}
            </Card>
          </div>
        </div>
      </section>

      {/* 4) 하단 바로가기(취향 선택/상세) 섹션 제거 — 네비게이션 바로 충분 */}

      {/* 5) 푸터 */}
      <footer className="pt-10 pb-6 text-center text-xs text-neutral-500">
        2025SUINWebProjectHYAG
      </footer>
    </main>
  );
}
