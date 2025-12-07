// 파일: backend/routes/perfumes.js
import express from "express";

import { pool } from "../db.js";

const router = express.Router();

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

export default router;
