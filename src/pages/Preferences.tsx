import { useState } from "react";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Check } from "lucide-react"; // 선택 완료 표시용 아이콘 추가

interface PreferencesProps {
  onNavigate: (page: string, preferences?: any) => void;
}

// 💡 프로젝트 컬러 팔레트 기반 색상 코드를 추가했습니다.
const SCENT_OPTIONS = [
  // 맑고 따뜻함 + 상큼한 향 = 옐로우톤 (#F3AF42)
  {
    id: "fresh",
    label: "상큼한",
    description: "시트러스 / 레몬 / 오렌지",
    icon: "🍋",
    color: "#F3AF42",
  },
  // 맑고 따뜻함 + 달달한 향 = 핑크/코랄톤 (#EE545A)
  {
    id: "sweet",
    label: "달달한",
    description: "바닐라 / 꿀 / 과일",
    icon: "🍯",
    color: "#EE545A",
  },
  // 포근함/머스크 = 라이트 그레이톤 (#D3D6D8)
  {
    id: "warm",
    label: "포근한",
    description: "머스크 / 코튼 / 파우더리",
    icon: "☁️",
    color: "#D3D6D8",
  },
  // 습한 날씨 + 차가운 향 = 푸른색 (#9EC9EA)
  {
    id: "sharp",
    label: "차가운",
    description: "아쿠아 / 민트",
    icon: "❄️",
    color: "#9EC9EA",
  },
  // 겨울/차가움 + 우디향 = 브라운/그레이톤 (#A65A37)
  {
    id: "calm",
    label: "차분한",
    description: "우디 / 스파이시 / 오리엔탈",
    icon: "🌿",
    color: "#A65A37",
  },
];

const EXCLUDE_OPTIONS = [
  // 제외 옵션도 노트 대신 감각 키워드를 포함하도록 리팩토링할 수 있지만, 일단 기존 구조 유지
  { id: "no-vanilla", label: "바닐라 계열은 싫어요" },
  { id: "no-citrus", label: "시트러스 계열은 싫어요" },
  { id: "no-musk", label: "머스크 계열은 싫어요" },
];

export function Preferences({ onNavigate }: PreferencesProps) {
  const [selectedScents, setSelectedScents] = useState<string[]>([]);
  const [excludedNotes, setExcludedNotes] = useState<string[]>([]);

  const toggleScent = (id: string) => {
    setSelectedScents((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const toggleExclude = (id: string) => {
    setExcludedNotes((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
  };

  const handleSubmit = () => {
    if (selectedScents.length === 0) {
      alert("최소 하나의 향을 선택해주세요!");
      return;
    }

    // 다음 단계의 추천 로직(Results.tsx)에서 사용할 수 있도록 데이터를 전달합니다.
    onNavigate("results", { prefs: { selectedScents, excludedNotes } });
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* ❌ 로컬 헤더 제거: App.tsx의 전역 Navbar가 담당합니다. */}

      <main className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">당신의 감각을 선택하세요</h2>
          <p className="text-neutral-600">
            원하는 향의 '색'과 '느낌'을 기준으로 모두 선택해주세요.
          </p>
        </div>

        <Card className="bg-white mb-10 p-8 shadow-xl">
          {" "}
          {/* 카드 디자인 강조 */}
          <h3 className="text-2xl font-bold mb-6">노트 / 감각 선택</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {" "}
            {/* 3열 레이아웃으로 변경 */}
            {SCENT_OPTIONS.map((option) => {
              const isSelected = selectedScents.includes(option.id);
              return (
                // Card 컴포넌트를 직접 사용하여 시각적 강조 효과를 얻습니다.
                <Card
                  key={option.id}
                  onClick={() => toggleScent(option.id)}
                  className={`p-4 rounded-xl border-4 transition-all duration-200 shadow-md ${
                    isSelected
                      ? "shadow-xl text-neutral-900" // 선택 시 그림자 강조
                      : "hover:shadow-lg hover:border-neutral-200 border-white"
                  }`}
                  style={{
                    borderColor: isSelected ? option.color : "transparent", // 테두리 색상 동적 변경
                    backgroundColor: isSelected ? option.color + "1A" : "white", // 배경에 옅은 색상 적용 (HEX + Transparency)
                  }}
                >
                  <div className="flex flex-col items-center justify-center text-center">
                    <span className="text-4xl mb-2">{option.icon}</span>
                    <h4 className="font-bold text-lg">{option.label}</h4>
                    <p className="text-xs text-neutral-500 mt-1">
                      {option.description}
                    </p>

                    {/* 선택 완료 표시 */}
                    <div
                      className={`mt-3 transition-opacity duration-200 ${
                        isSelected ? "opacity-100" : "opacity-0"
                      }`}
                    >
                      <Check size={20} className="text-neutral-900" />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </Card>

        {/* 제외 옵션은 깔끔하게 Card 내에서 유지합니다. */}
        <Card className="bg-white mb-8 p-8 shadow-md">
          <h3 className="text-2xl font-bold mb-6">제외 옵션 (싫어하는 향)</h3>
          <div className="space-y-3">
            {EXCLUDE_OPTIONS.map((option) => (
              <label
                key={option.id}
                onClick={() => toggleExclude(option.id)}
                className={`flex items-center gap-3 p-4 rounded-lg border-2 hover:bg-neutral-50 cursor-pointer transition-colors ${
                  excludedNotes.includes(option.id)
                    ? "border-red-500 bg-red-50"
                    : "border-neutral-200"
                }`}
              >
                <input
                  type="checkbox"
                  checked={excludedNotes.includes(option.id)}
                  onChange={() => {}} // 부모 onClick으로 처리
                  className="w-5 h-5 accent-red-500"
                />
                <span className="text-neutral-700">{option.label}</span>
              </label>
            ))}
          </div>
        </Card>

        <div className="text-center mt-12">
          <Button
            size="lg"
            onClick={handleSubmit}
            className="px-16 shadow-lg hover:shadow-xl"
          >
            추천받기
          </Button>
        </div>
      </main>
    </div>
  );
}
