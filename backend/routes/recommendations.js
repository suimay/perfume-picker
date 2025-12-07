// 파일: backend/routes/recommendations.js
import express from "express";

import { pool } from "../db.js";
import { buildRecommendations } from "../services/recommendation.js";

const router = express.Router();

const parseTags = (value) => {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value;
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch (_error) {
      // fall through to comma split
    }
    return value
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }
  if (typeof value === "object") {
    return Object.values(value)
      .flat()
      .filter((tag) => typeof tag === "string" && tag.trim().length > 0);
  }
  return [];
};

const loadUserPreferenceTags = async (userId) => {
  const [rows] = await pool.query(
    `SELECT n.name AS note, up.type
     FROM user_preferences up
     JOIN notes n ON up.note_id = n.id
     WHERE up.user_id = ?`,
    [userId]
  );
  const likes = [];
  const dislikes = [];
  rows.forEach(({ note, type }) => {
    if (type === "LIKE") {
      likes.push(note);
    } else if (type === "DISLIKE") {
      dislikes.push(note);
    }
  });
  return { likes, dislikes };
};

router.post("/recommendations", async (req, res) => {
  const userId = req.session?.userId ?? null;
  const { notes = [], exclude = [], context = [] } = req.body ?? {};

  // 기본 요청 기반 필터링
  const includeTags = new Set(
    [...(Array.isArray(notes) ? notes : []), ...(Array.isArray(context) ? context : [])]
      .filter((tag) => typeof tag === "string" && tag.trim().length > 0)
  );
  const excludeTags = new Set(
    (Array.isArray(exclude) ? exclude : []).filter(
      (tag) => typeof tag === "string" && tag.trim().length > 0
    )
  );

  try {
    const [rows] = await pool.query("SELECT * FROM perfumes");
    const mapped = rows.map((row) => ({
      ...row,
      tags: parseTags(row.tags_json),
    }));

    let filtered = mapped.filter((perfume) => {
      const tagSet = new Set(perfume.tags);

      if (excludeTags.size > 0) {
        for (const tag of excludeTags) {
          if (tagSet.has(tag)) {
            return false;
          }
        }
      }

      if (includeTags.size === 0) {
        return true;
      }

      for (const tag of includeTags) {
        if (tagSet.has(tag)) {
          return true;
        }
      }
      return false;
    });

    // 로그인 사용자의 선호가 있으면 더 좁혀서 추천
    if (userId) {
      try {
        const { likes, dislikes } = await loadUserPreferenceTags(userId);
        if (likes.length || dislikes.length) {
          filtered = filtered.filter((perfume) => {
            const tagSet = new Set(perfume.tags);
            const hasLike = likes.length === 0 || likes.some((tag) => tagSet.has(tag));
            const hasDislike = dislikes.some((tag) => tagSet.has(tag));
            return hasLike && !hasDislike;
          });
        }
      } catch (prefError) {
        console.warn("[recommendations] user preference filter skipped:", prefError);
      }
    }

    // DB 기반 추천이 없으면 DB 전체 일부와 서비스 fallback(태그 기반) 제공
    const result =
      filtered.length > 0
        ? filtered.slice(0, 12)
        : (await buildRecommendations({ userId })).slice(0, 12);

    return res.json({ success: true, perfumes: result });
  } catch (error) {
    console.error("[recommendations] error:", error);
    return res
      .status(500)
      .json({ success: false, message: "추천을 생성하지 못했습니다." });
  }
});

export default router;
