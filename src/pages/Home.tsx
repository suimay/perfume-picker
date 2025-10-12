// src/pages/Home.tsx

import { useState, useEffect } from "react";
import { Cloud, Sun, CloudRain, Droplets, Sparkles } from "lucide-react";
import { Card } from "../components/Card";
import { supabase, Perfume } from "../lib/supabase";

interface HomeProps {
  onNavigate: (page: string) => void;
  user: any;
}

// 💡 날씨 조건에 따른 색상 매핑 함수 (3감각 융합의 시작)
const getWeatherColor = (weather: string, temp: number) => {
  let color = "#FFFFFF"; // 기본 흰색
  let isDarkText = true; // 텍스트 색상 (밝은 배경이면 true)

  // 1. 비/흐림 (Cold/Humid -> Blue/Gray)
  if (weather.includes("비") || weather.includes("구름") || temp <= 10) {
    color = "#9EC9EA"; // 하늘색 (습함/차가움)
    isDarkText = true;
  }
  // 2. 맑음/따뜻함 (Clear/Warm -> Yellow/Orange)
  else if (weather.includes("맑음") && temp >= 20 && temp <= 25) {
    color = "#F3AF42"; // 오렌지/옐로우 (따뜻함/쾌적)
    isDarkText = true;
  }
  // 3. 더움/화창 (Hot/Bright -> Coral/Pink)
  else if (temp > 25) {
    color = "#EE545A"; // 코랄 핑크 (더움/활기)
    isDarkText = false; // 배경이 어두워지므로 흰색 텍스트
  }
  // 4. 일반/중립 (Default -> Light Gray)
  else {
    color = "#D3D6D8"; // 라이트 그레이 (중립)
    isDarkText = true;
  }

  return { color, isDarkText };
};

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
    // 💡 실제 날씨 API 연동 시 이 부분을 교체하면 됩니다.
    setWeather("맑음");
    setTemperature(22);
    setHumidity(45);
  }, []);

  // 바로추천(플립 시 뒤집힌 면에 표시할 추천 한 개)
  const fetchQuickRecommendation = async () => {
    setLoading(true);
    // 💡 DB에서 color_hex 필드를 가져와야 추천 카드의 색상을 입힐 수 있습니다.
    const { data } = await supabase
      .from("perfumes")
      // color_hex 필드를 포함하여 선택한다고 가정
      .select("*, color_hex")
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

  // 💡 동적 색상 및 텍스트 결정 로직
  const { color: weatherBgColor, isDarkText: weatherIsDark } = getWeatherColor(
    weather,
    temperature
  );
  const weatherTextColor = weatherIsDark ? "text-neutral-900" : "text-white";

  // 추천 향수의 색상 코드가 있다면 사용, 없으면 기본 밝은 색상 적용
  const recBgColor = (recommended as any)?.color_hex ?? "#F7A091";
  // 추천 배경색에 따른 텍스트 색상 (간단한 임시 로직)
  const recTextColor =
    recBgColor === "#EE545A" ? "text-white" : "text-neutral-900";

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 space-y-10">
      {/* 1) 메인 아이덴티티 이미지 */}
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

      {/* 2) 타이틀 & 부제(설명) */}
      <section className="text-center space-y-2">
        <h1 className="text-2xl md:text-3xl font-semibold">
          보이지 않는 향을, 느껴지는 감각으로
        </h1>
        <p className="text-neutral-600">
          날씨의 체감과 색의 경험을 더해, 향을 감각으로 전하다
        </p>
      </section>

      {/* 3) 오늘의 날씨 ↔ 추천 플립 카드 (색상 동적 적용) */}
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
            {/* 앞면: 날씨 (날씨 색상 적용) */}
            <Card
              className={`absolute inset-0 flex items-center justify-between px-4 sm:px-6 md:px-8 [backface-visibility:hidden] ${weatherTextColor}`}
              backgroundColor={weatherBgColor} // 💡 날씨 색상 적용
            >
              <div className="flex items-center gap-4">
                <WeatherIcon className={`size-10 ${weatherTextColor}`} />{" "}
                {/* 💡 아이콘 색상도 동적 변경 */}
                <div>
                  <div className="text-sm">오늘의 날씨</div>
                  <div className="text-2xl font-semibold">{weather}</div>
                </div>
              </div>
              <div className="flex items-center gap-8 text-right">
                <div>
                  <div className="text-sm">기온</div>
                  <div className="text-xl font-medium">{temperature}°C</div>
                </div>
                <div>
                  <div className="text-sm">습도</div>
                  <div className="text-xl font-medium">{humidity}%</div>
                </div>
                <div
                  className={`hidden sm:flex items-center gap-2 ${weatherTextColor}`}
                >
                  <Droplets className="size-5" />
                  <span className="text-sm">카드를 눌러 바로 추천</span>
                </div>
              </div>
            </Card>

            {/* 뒷면: 추천 (향수 색상 적용) */}
            <Card
              className={`absolute inset-0 px-4 sm:px-6 md:px-8 [transform:rotateY(180deg)] [backface-visibility:hidden] flex flex-col items-center justify-center text-center ${recTextColor}`}
              backgroundColor={recBgColor} // 💡 추천 향수 색상 적용
            >
              {loading ? (
                <div className="text-neutral-500">추천 불러오는 중…</div>
              ) : recommended ? (
                <div className="space-y-3">
                  <div className="text-sm">오늘의 추천 향수</div>
                  <div className="text-2xl font-semibold">
                    {(recommended as any).name}
                  </div>
                  <div className="text-lg">{(recommended as any).brand}</div>
                  <div className="text-sm">
                    카드를 다시 클릭하면 날씨로 돌아갑니다
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigate(`perfume-${(recommended as any).id}`);
                    }}
                    className={`mt-2 inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm ${
                      recTextColor === "text-white"
                        ? "border-white text-white hover:bg-white/10"
                        : "border-neutral-900 hover:bg-neutral-900/10"
                    }`}
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
    </main>
  );
}
