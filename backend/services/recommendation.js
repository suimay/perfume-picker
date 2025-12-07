// 파일: backend/services/recommendation.js
import { pool } from "../db.js";

// 사용자 선호를 읽어와 DB 향수만으로 추천합니다.
export const buildRecommendations = async ({ userId }) => {
  const [prefs] = await pool.query(
    `SELECT n.name, up.type
     FROM user_preferences up
     JOIN notes n ON up.note_id = n.id
     WHERE up.user_id = ?`,
    [userId]
  );

  const likes = prefs.filter((p) => p.type === "LIKE").map((p) => p.name);
  const dislikes = prefs.filter((p) => p.type === "DISLIKE").map((p) => p.name);

  const [dbPerfumes] = await pool.query("SELECT * FROM perfumes");
  const filtered = dbPerfumes
    .map((row) => ({
      ...row,
      tags: parseJsonArray(row.tags_json),
    }))
    .filter((p) => {
      const hasLike = likes.length === 0 || p.tags.some((t) => likes.includes(t));
      const hasDislike = p.tags.some((t) => dislikes.includes(t));
      return hasLike && !hasDislike;
    });

  const shuffled = filtered.sort(() => Math.random() - 0.5);
  const fallback =
    filtered.length > 0
      ? []
      : dbPerfumes
          .map((row) => ({ ...row, tags: parseJsonArray(row.tags_json) }))
          .slice(0, 5);

  return [...shuffled.slice(0, 5), ...fallback].slice(0, 5);
};

const parseJsonArray = (value) => {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value;
  }
  if (typeof value === "object") {
    return Object.values(value)
      .flat()
      .filter((item) => typeof item === "string" && item.trim().length > 0);
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed)
        ? parsed
        : value
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);
    } catch (_error) {
      return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }
  return [];
};
