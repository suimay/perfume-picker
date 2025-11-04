import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

const FALLBACK_WEATHER = {
  temp: 25,
  description: "맑음(더미)",
};

router.get("/weather", async (req, res) => {
  const apiKey = process.env.OPENWEATHER_KEY;

  if (!apiKey) {
    return res.json({ success: true, ...FALLBACK_WEATHER });
  }

  const { lat, lon } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({
      success: false,
      message: "lat과 lon 쿼리 파라미터가 필요합니다.",
    });
  }

  const endpoint = new URL("https://api.openweathermap.org/data/2.5/weather");
  endpoint.search = new URLSearchParams({
    lat,
    lon,
    appid: apiKey,
    units: "metric",
    lang: "kr",
  }).toString();

  try {
    const response = await fetch(endpoint);
    if (!response.ok) {
      throw new Error(`OpenWeather response: ${response.status}`);
    }

    const payload = await response.json();
    const temp = payload?.main?.temp;
    const description = payload?.weather?.[0]?.description ?? "날씨 정보 없음";

    return res.json({
      success: true,
      temp,
      description,
    });
  } catch (error) {
    console.error("GET /api/weather error:", error);
    return res.status(502).json({
      success: false,
      message: "날씨 정보를 불러오지 못했습니다.",
    });
  }
});

export default router;
