// 파일: backend/routes/recommendations.js
import express from "express";

import { requireLogin } from "../middleware/auth.js";
import { buildRecommendations } from "../services/recommendation.js";

const router = express.Router();

router.post("/recommendations", requireLogin, async (req, res) => {
  const userId = req.session.userId;
  const { weather } = req.body ?? {}; // 더 이상 사용하지 않지만, API 호환성을 위해 받아둠

  try {
    const perfumes = await buildRecommendations({ userId, weather });
    return res.json({ success: true, perfumes });
  } catch (error) {
    console.error("[recommendations] error:", error);
    return res
      .status(500)
      .json({ success: false, message: "추천을 생성하지 못했습니다." });
  }
});

export default router;
