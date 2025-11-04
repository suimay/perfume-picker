import express from "express";

import { pool } from "../db.js";

const router = express.Router();

const parseJsonField = (value) => {
  if (value === null || value === undefined) {
    return [];
  }
  if (Array.isArray(value)) {
    return value;
  }
  try {
    return JSON.parse(value);
  } catch (error) {
    console.warn("Failed to parse JSON field:", value, error);
    return [];
  }
};

router.get("/perfumes", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, name, brand, description, tags_json FROM perfumes"
    );

    const perfumes = rows.map((row) => ({
      id: row.id,
      name: row.name,
      brand: row.brand,
      description: row.description,
      tags: parseJsonField(row.tags_json),
      notes: parseJsonField(row.notes_json),
    }));

    return res.json({ success: true, perfumes });
  } catch (error) {
    console.error("GET /api/perfumes error:", error);
    return res
      .status(500)
      .json({ success: false, message: "향수 목록을 불러오지 못했습니다." });
  }
});

router.post("/recommendations", async (req, res) => {
  const { notes = [], exclude = [], context = [] } = req.body ?? {};
  const includeTags = new Set(
    [...notes, ...context].filter((tag) => typeof tag === "string" && tag.length)
  );
  const excludeTags = new Set(
    exclude.filter((tag) => typeof tag === "string" && tag.length)
  );

  try {
    const [rows] = await pool.query(
      "SELECT id, name, brand, description, tags_json FROM perfumes"
    );

    const recommendations = rows
      .map((row) => {
        const tags = parseJsonField(row.tags_json);
        const notesData = parseJsonField(row.notes_json);

        return {
          id: row.id,
          name: row.name,
          brand: row.brand,
          description: row.description,
          tags,
          notes: notesData,
        };
      })
      .filter((perfume) => {
        if (excludeTags.size > 0) {
          const hasExcludedTag = perfume.tags.some((tag) =>
            excludeTags.has(tag)
          );
          if (hasExcludedTag) {
            return false;
          }
        }

        if (includeTags.size === 0) {
          return true;
        }

        return perfume.tags.some((tag) => includeTags.has(tag));
      });

    return res.json({ success: true, perfumes: recommendations });
  } catch (error) {
    console.error("POST /api/recommendations error:", error);
    return res.status(500).json({
      success: false,
      message: "향수 추천을 생성하는 중 오류가 발생했습니다.",
    });
  }
});

export default router;
