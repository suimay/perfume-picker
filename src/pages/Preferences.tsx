import { useState } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';

interface PreferencesProps {
  onNavigate: (page: string, preferences?: any) => void;
}

const SCENT_OPTIONS = [
  { id: 'fresh', label: '상큼한', description: '시트러스 / 레몬 / 오렌지', icon: '🍋' },
  { id: 'sweet', label: '달달한', description: '바닐라 / 꿀 / 과일', icon: '🍯' },
  { id: 'warm', label: '포근한', description: '머스크 / 코튼 / 파우더리', icon: '☁️' },
  { id: 'sharp', label: '차가운', description: '아쿠아 / 민트', icon: '❄️' },
  { id: 'calm', label: '깔끔한', description: '우디 / 스파이시 / 오리엔탈', icon: '🌿' }
];

const EXCLUDE_OPTIONS = [
  { id: 'no-vanilla', label: '바닐라 계열은 싫어요' },
  { id: 'no-citrus', label: '시트러스 계열은 싫어요' },
  { id: 'no-musk', label: '머스크 계열은 싫어요' }
];

export function Preferences({ onNavigate }: PreferencesProps) {
  const [selectedScents, setSelectedScents] = useState<string[]>([]);
  const [excludedNotes, setExcludedNotes] = useState<string[]>([]);

  const toggleScent = (id: string) => {
    setSelectedScents(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const toggleExclude = (id: string) => {
    setExcludedNotes(prev =>
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    );
  };

  const handleSubmit = () => {
    if (selectedScents.length === 0) {
      alert('최소 하나의 향을 선택해주세요!');
      return;
    }

    onNavigate('results', { selectedScents, excludedNotes });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <h1 className="text-4xl font-bold cursor-pointer" onClick={() => onNavigate('home')}>
            향(香)
          </h1>
          <Button variant="outline" onClick={() => onNavigate('home')}>
            홈으로
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">당신의 취향을 선택하세요</h2>
          <p className="text-neutral-600">원하는 향의 느낌을 모두 선택해주세요</p>
        </div>

        <Card className="bg-white mb-8">
          <h3 className="text-xl font-bold mb-6">노트 / 느낌</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SCENT_OPTIONS.map(option => (
              <div
                key={option.id}
                onClick={() => toggleScent(option.id)}
                className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedScents.includes(option.id)
                    ? 'border-neutral-900 bg-neutral-50'
                    : 'border-neutral-200 hover:border-neutral-400'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl">{option.icon}</span>
                  <div>
                    <h4 className="font-bold text-lg">{option.label}</h4>
                    <p className="text-sm text-neutral-600">{option.description}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedScents.includes(option.id)}
                    onChange={() => {}}
                    className="ml-auto w-5 h-5"
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="bg-white mb-8">
          <h3 className="text-xl font-bold mb-6">제외 옵션</h3>
          <div className="space-y-3">
            {EXCLUDE_OPTIONS.map(option => (
              <label
                key={option.id}
                className="flex items-center gap-3 p-4 rounded-lg border border-neutral-200 hover:bg-neutral-50 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={excludedNotes.includes(option.id)}
                  onChange={() => toggleExclude(option.id)}
                  className="w-5 h-5"
                />
                <span className="text-neutral-700">{option.label}</span>
              </label>
            ))}
          </div>
        </Card>

        <div className="text-center">
          <Button size="lg" onClick={handleSubmit} className="px-16">
            추천받기
          </Button>
        </div>
      </main>
    </div>
  );
}
