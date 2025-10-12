import { useEffect, useState } from "react";
import { Card } from "../components/Card";
import { supabase, Perfume } from "../lib/supabase";

type MyPageProps = {
  onNavigate: (page: string) => void;
  user?: any; // supabase.auth.getUser() 결과 형태 가정
};

/** ---------- 로컬 저장소 키 ---------- */
const LS_PREFS = "userPreferences"; // { liked_notes: string[], disliked_notes: string[] }
const LS_ALGO = "algoOptions"; // { seasonBoost: boolean, tempWeight: number }
const LS_RECENT = "recentViewed"; // [{ id: number, ts: number }, ...]

/** ---------- 헬퍼 ---------- */
function formatDate(d?: string) {
  if (!d) return "";
  const dt = new Date(d);
  return `${dt.getFullYear()}.${String(dt.getMonth() + 1).padStart(
    2,
    "0"
  )}.${String(dt.getDate()).padStart(2, "0")}`;
}

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function saveJSON(key: string, value: any) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

/** ---------- 컴포넌트 ---------- */
export function MyPage({ onNavigate, user }: MyPageProps) {
  /** A. 프로필(닉네임/아바타) */
  const [nickname, setNickname] = useState<string>("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [busyEdit, setBusyEdit] = useState(false);
  const [editNick, setEditNick] = useState("");
  const [editFile, setEditFile] = useState<File | null>(null);
  const joinedAt = user?.created_at as string | undefined;

  /** B. 취향/설정 요약 + 알고리즘 옵션 */
  const [liked, setLiked] = useState<string[]>([]);
  const [disliked, setDisliked] = useState<string[]>([]);
  const [seasonBoost, setSeasonBoost] = useState<boolean>(true);
  const [tempWeight, setTempWeight] = useState<number>(1); // 0~2, 0.5단위

  /** C. 북마크(복구됨) */
  const [bookmarks, setBookmarks] = useState<Perfume[]>([]);

  /** D. 최근 본 향 */
  const [recent, setRecent] = useState<{ id: number; ts: number }[]>([]);
  const [recentPerfumes, setRecentPerfumes] = useState<Perfume[]>([]);

  /** -------- 초기 로드 -------- */
  useEffect(() => {
    // 프로필 기본값
    setNickname(
      user?.user_metadata?.nickname || user?.email?.split("@")[0] || "Guest"
    );
    setAvatarUrl(user?.user_metadata?.avatar_url || null);

    // 취향/알고리즘: DB 우선, 없으면 로컬 폴백
    (async () => {
      if (user) {
        const { data } = await supabase
          .from("user_preferences")
          .select("liked_notes, disliked_notes, season_boost, temp_weight")
          .eq("user_id", user.id)
          .maybeSingle();

        if (data) {
          setLiked(data.liked_notes ?? []);
          setDisliked(data.disliked_notes ?? []);
          setSeasonBoost(Boolean(data.season_boost ?? true));
          setTempWeight(Number(data.temp_weight ?? 1));
        } else {
          const prefs = readJSON<{
            liked_notes: string[];
            disliked_notes: string[];
          }>(LS_PREFS, { liked_notes: [], disliked_notes: [] });
          const algo = readJSON<{ seasonBoost: boolean; tempWeight: number }>(
            LS_ALGO,
            { seasonBoost: true, tempWeight: 1 }
          );
          setLiked(prefs.liked_notes);
          setDisliked(prefs.disliked_notes);
          setSeasonBoost(algo.seasonBoost);
          setTempWeight(algo.tempWeight);
        }
      } else {
        const prefs = readJSON<{
          liked_notes: string[];
          disliked_notes: string[];
        }>(LS_PREFS, { liked_notes: [], disliked_notes: [] });
        const algo = readJSON<{ seasonBoost: boolean; tempWeight: number }>(
          LS_ALGO,
          { seasonBoost: true, tempWeight: 1 }
        );
        setLiked(prefs.liked_notes);
        setDisliked(prefs.disliked_notes);
        setSeasonBoost(algo.seasonBoost);
        setTempWeight(algo.tempWeight);
      }
    })();

    // 최근 본 향: 로컬에서 읽기
    const r = readJSON<{ id: number; ts: number }[]>(LS_RECENT, []);
    setRecent(r.slice(0, 20)); // 최대 20개

    // 북마크: DB에서 조회
    (async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from("user_bookmarks")
        .select("perfume_id, perfumes(*)")
        .eq("user_id", user.id)
        .limit(40);
      if (!error && data) {
        const items = data
          .map((row: any) => row.perfumes)
          .filter(Boolean) as Perfume[];
        setBookmarks(items);
      }
    })();
  }, [user]);

  useEffect(() => {
    (async () => {
      if (recent.length === 0) {
        setRecentPerfumes([]);
        return;
      }
      const ids = recent.map((r) => r.id);
      const { data } = await supabase
        .from("perfumes")
        .select("*")
        .in("id", ids);
      const map = new Map<number, Perfume>();
      (data ?? []).forEach((p: any) => map.set(p.id, p));
      // 최근순 정렬
      const ordered = recent
        .filter((r) => map.has(r.id))
        .map((r) => map.get(r.id)!) as Perfume[];
      setRecentPerfumes(ordered);
    })();
  }, [recent]);

  /** -------- 프로필 저장 -------- */
  const handleSaveProfile = async () => {
    if (!user) return;
    setBusyEdit(true);
    try {
      let newAvatarUrl: string | null = avatarUrl;

      // 1) 아바타 업로드
      if (editFile) {
        const path = `${user.id}/${Date.now()}-${editFile.name}`;
        const up = await supabase.storage
          .from("avatars")
          .upload(path, editFile, { upsert: true });
        if (!up.error) {
          const { data } = supabase.storage.from("avatars").getPublicUrl(path);
          newAvatarUrl = data.publicUrl || null;
        }
      }

      // 2) 메타데이터 업데이트
      const upd = await supabase.auth.updateUser({
        data: {
          nickname: editNick || nickname,
          avatar_url: newAvatarUrl ?? undefined,
        },
      });
      if (!upd.error) {
        setNickname(editNick || nickname);
        setAvatarUrl(newAvatarUrl ?? avatarUrl);
        setShowEdit(false);
      } else {
        alert("프로필 업데이트 중 문제가 발생했어요.");
      }
    } finally {
      setBusyEdit(false);
    }
  };

  /** -------- 설정 저장 -------- */
  const persistPrefs = async (next: {
    liked_notes?: string[];
    disliked_notes?: string[];
  }) => {
    const newLiked = next.liked_notes ?? liked;
    const newDis = next.disliked_notes ?? disliked;
    setLiked(newLiked);
    setDisliked(newDis);
    saveJSON(LS_PREFS, { liked_notes: newLiked, disliked_notes: newDis });

    if (user) {
      await supabase.from("user_preferences").upsert(
        {
          user_id: user.id,
          liked_notes: newLiked,
          disliked_notes: newDis,
          season_boost: seasonBoost,
          temp_weight: tempWeight,
        },
        { onConflict: "user_id" }
      );
    }
  };

  const persistAlgo = async (next: {
    seasonBoost?: boolean;
    tempWeight?: number;
  }) => {
    const s = next.seasonBoost ?? seasonBoost;
    const t = next.tempWeight ?? tempWeight;
    setSeasonBoost(s);
    setTempWeight(t);
    saveJSON(LS_ALGO, { seasonBoost: s, tempWeight: t });

    if (user) {
      await supabase.from("user_preferences").upsert(
        {
          user_id: user.id,
          liked_notes: liked,
          disliked_notes: disliked,
          season_boost: s,
          temp_weight: t,
        },
        { onConflict: "user_id" }
      );
    }
  };

  /** -------- 최근 본 항목 비우기 -------- */
  const clearRecent = () => {
    saveJSON(LS_RECENT, []);
    setRecent([]);
    setRecentPerfumes([]);
  };

  /** -------- UI -------- */
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 space-y-8">
      {/* 헤더 중앙 배치 */}
      <header className="text-center space-y-2">
        <h1 className="text-2xl md:text-3xl font-semibold">마이페이지</h1>
      </header>

      {/* A. 프로필 섹션 */}
      <section className="mx-auto flex flex-col items-center gap-3">
        <div className="size-16 rounded-full bg-neutral-200 overflow-hidden">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="avatar"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full grid place-items-center text-neutral-600">
              😊
            </div>
          )}
        </div>
        <div className="text-lg font-medium">{nickname}</div>
        <div className="text-neutral-500 text-sm">{user?.email}</div>
        {user?.created_at && (
          <div className="text-neutral-400 text-xs">
            가입일 {formatDate(user.created_at)}
          </div>
        )}
        {user ? (
          <button
            className="mt-1 rounded-xl border px-3 py-1.5 text-sm hover:bg-neutral-50"
            onClick={() => {
              setEditNick(nickname);
              setEditFile(null);
              setShowEdit(true);
            }}
          >
            프로필 편집
          </button>
        ) : (
          <div className="text-neutral-500 text-sm">
            로그인 후 프로필을 편집할 수 있어요.
          </div>
        )}
      </section>

      {/* B. 취향/설정 요약 */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">나의 취향 & 설정</h2>

        {/* 선호/비선호 노트 요약 */}
        <Card className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <div>
                <div className="text-sm text-neutral-500 mb-1">선호 노트</div>
                <div className="flex flex-wrap gap-2">
                  {liked.length === 0 ? (
                    <span className="text-neutral-400 text-sm">없음</span>
                  ) : (
                    liked.map((n, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 rounded-full border text-xs"
                      >
                        {n}
                      </span>
                    ))
                  )}
                </div>
              </div>
              <div>
                <div className="text-sm text-neutral-500 mb-1">비선호 노트</div>
                <div className="flex flex-wrap gap-2">
                  {disliked.length === 0 ? (
                    <span className="text-neutral-400 text-sm">없음</span>
                  ) : (
                    disliked.map((n, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 rounded-full border text-xs"
                      >
                        {n}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>
            <div>
              <button
                className="rounded-xl border px-3 py-1.5 text-sm hover:bg-neutral-50"
                onClick={() => onNavigate("preferences")}
              >
                취향 다시 선택하기
              </button>
            </div>
          </div>
        </Card>

        {/* 추천 알고리즘 옵션 */}
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">계절 반영</div>
              <div className="text-sm text-neutral-500">
                봄/여름/가을/겨울 가중치를 적용합니다.
              </div>
            </div>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={seasonBoost}
                onChange={(e) => persistAlgo({ seasonBoost: e.target.checked })}
              />
              <span className="text-sm">ON</span>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">
                기온 가중치{" "}
                <span className="ml-2 rounded-md border px-2 py-0.5 text-xs">
                  {tempWeight.toFixed(1)}
                </span>
              </div>
              <div className="text-sm text-neutral-500">
                0 ~ 2 (0.5 단위, 총 5단계)
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={2}
              step={0.5}
              value={tempWeight}
              onChange={(e) =>
                persistAlgo({ tempWeight: Number(e.target.value) })
              }
            />
          </div>
        </Card>
      </section>

      {/* C. 북마크 — 복구됨 */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">북마크</h2>
        {bookmarks.length === 0 ? (
          <div className="text-neutral-500">아직 북마크가 없어요.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {bookmarks.map((p: any) => (
              <Card
                key={p.id}
                className="p-4 cursor-pointer"
                onClick={() => onNavigate(`perfume-${p.id}`)}
              >
                <div className="w-full h-28 bg-neutral-200 rounded-md mb-3" />
                <div className="text-sm text-neutral-500">{p.brand}</div>
                <div className="font-medium leading-snug">{p.name}</div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* D. 최근 본 향 */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">최근 본 향</h2>
          {recent.length > 0 && (
            <button
              className="rounded-xl border px-3 py-1.5 text-sm hover:bg-neutral-50"
              onClick={clearRecent}
            >
              최근 항목 비우기
            </button>
          )}
        </div>

        {recentPerfumes.length === 0 ? (
          <div className="text-neutral-500">아직 본 향이 없어요.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {recentPerfumes.map((p: any) => {
              const rec = recent.find((r) => r.id === p.id);
              return (
                <Card
                  key={p.id}
                  className="p-4 cursor-pointer"
                  onClick={() => onNavigate(`perfume-${p.id}`)}
                >
                  <div className="w-full h-28 bg-neutral-200 rounded-md mb-3" />
                  <div className="text-sm text-neutral-500">{p.brand}</div>
                  <div className="font-medium leading-snug">{p.name}</div>
                  {rec && (
                    <div className="text-xs text-neutral-400 mt-1">
                      {new Date(rec.ts).toLocaleString()}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* 푸터 */}

      {/* 프로필 편집 모달 */}
      {showEdit && (
        <div
          className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm grid place-items-center p-4"
          onClick={() => !busyEdit && setShowEdit(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4">프로필 편집</h3>

            <div className="flex items-center gap-4 mb-4">
              <div className="size-14 rounded-full bg-neutral-200 overflow-hidden">
                {editFile ? (
                  <img
                    src={URL.createObjectURL(editFile)}
                    className="w-full h-full object-cover"
                  />
                ) : avatarUrl ? (
                  <img src={avatarUrl} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full grid place-items-center text-neutral-600">
                    😊
                  </div>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setEditFile(e.target.files?.[0] ?? null)}
              />
            </div>

            <label className="block mb-2 text-sm text-neutral-600">
              닉네임
            </label>
            <input
              className="w-full rounded-xl border px-3 py-2 mb-4"
              value={editNick}
              onChange={(e) => setEditNick(e.target.value)}
              placeholder="닉네임"
            />

            <div className="flex justify-end gap-2">
              <button
                className="rounded-xl border px-3 py-1.5 text-sm hover:bg-neutral-50"
                onClick={() => !busyEdit && setShowEdit(false)}
              >
                취소
              </button>
              <button
                className="rounded-xl border px-3 py-1.5 text-sm hover:bg-neutral-50 disabled:opacity-60"
                disabled={busyEdit}
                onClick={handleSaveProfile}
              >
                {busyEdit ? "저장 중…" : "저장"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
