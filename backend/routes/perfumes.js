// 파일: backend/routes/perfumes.js
import express from "express";

import { pool } from "../db.js";

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
      return value
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);
    } catch (_) {
      return value
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);
    }
  }
  if (typeof value === "object") {
    return Object.values(value)
      .flat()
      .filter((tag) => typeof tag === "string" && tag.trim().length > 0);
  }
  return [];
};

// 향수 전체 조회
router.get("/perfumes", async (_req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM perfumes");
    return res.json(rows);
  } catch (error) {
    console.error("[perfumes] GET error:", error);
    return res
      .status(500)
      .json({ success: false, message: "향수 데이터를 불러오지 못했습니다." });
  }
});

// 향수 추천
router.post("/recommendations", async (req, res) => {
  const { notes = [], exclude = [], context = [] } = req.body ?? {};
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

    const filtered = mapped.filter((perfume) => {
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

    const result =
      filtered.length > 0 ? filtered.slice(0, 12) : mapped.slice(0, 12);

    return res.json(result);
  } catch (error) {
    console.error("[perfumes] recommendations error:", error);
    return res
      .status(500)
      .json({ success: false, message: "향수 추천을 생성하는 중 오류가 발생했습니다." });
  }
});

export default router;
