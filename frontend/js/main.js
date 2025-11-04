import { dummyUser, dummyWeather, perfumeList, preferenceLabels } from "./data.js";
import {
  isBookmarked,
  loadBookmarks,
  loadPreferences,
  savePreferences,
  toggleBookmark,
} from "./storage.js";

// 변경 시작
const USER_STORAGE_KEY = "hyang.user";
let cachedApiPerfumes = null;

const safeJsonParse = (value, fallback) => {
  if (typeof value !== "string") {
    return fallback;
  }
  try {
    return JSON.parse(value);
  } catch (error) {
    return fallback;
  }
};

const parseTagsFromSource = (source) => {
  if (Array.isArray(source)) {
    return source;
  }
  if (typeof source === "string") {
    const trimmed = source.trim();
    if (!trimmed) {
      return [];
    }
    const parsed = safeJsonParse(trimmed, null);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return trimmed
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

const normalizeNotes = (source) => {
  if (!source) {
    return { top: [], middle: [], base: [] };
  }
  if (typeof source === "string") {
    const parsed = safeJsonParse(source, null);
    if (parsed) {
      return normalizeNotes(parsed);
    }
    return { top: [source], middle: [], base: [] };
  }
  if (Array.isArray(source)) {
    return { top: source, middle: [], base: [] };
  }
  if (typeof source === "object") {
    return {
      top: Array.isArray(source.top) ? source.top : [],
      middle: Array.isArray(source.middle) ? source.middle : [],
      base: Array.isArray(source.base) ? source.base : [],
    };
  }
  return { top: [], middle: [], base: [] };
};

const normalizePerfumeForUi = (perfume) => {
  if (!perfume) {
    return null;
  }

  const tags = parseTagsFromSource(perfume.tags ?? perfume.tags_json);
  const accords = Array.isArray(perfume.accords) ? perfume.accords : [];
  const notesSource = perfume.notes ?? perfume.notes_json;

  return {
    ...perfume,
    tags,
    accords,
    notes: normalizeNotes(notesSource),
  };
};

const fetchPerfumesFromApi = async () => {
  if (cachedApiPerfumes) {
    return cachedApiPerfumes;
  }

  const response = await fetch("/api/perfumes");
  if (!response.ok) {
    throw new Error(`Perfumes request failed: ${response.status}`);
  }
  const payload = await response.json();
  const rawList = Array.isArray(payload) ? payload : payload?.perfumes ?? [];
  cachedApiPerfumes = rawList
    .map(normalizePerfumeForUi)
    .filter((perfume) => perfume && perfume.id);
  return cachedApiPerfumes;
};

const loadStoredUser = () => {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.warn("Failed to load stored user:", error);
    return null;
  }
};

const saveUser = (user) => {
  try {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } catch (error) {
    console.warn("Failed to store user:", error);
  }
};

const setupNavigation = () => {
  const currentPage = document.body.dataset.page;
  document.querySelectorAll("[data-nav]").forEach((link) => {
    if (link.dataset.nav === currentPage) {
      link.classList.add("topbar__link--active");
    }
  });
};

const updateUserBadge = (profile) => {
  const userNameTarget = document.getElementById("topbarUserName");
  if (!userNameTarget) {
    return;
  }
  if (!profile) {
    userNameTarget.textContent = dummyUser.name;
    return;
  }

  const displayName =
    profile.nickname ??
    profile.name ??
    profile.email ??
    dummyUser.name;

  userNameTarget.textContent = displayName;
};

const hydrateUserBadge = () => {
  const stored = loadStoredUser();
  updateUserBadge(stored ?? dummyUser);
};

const setupLoginModal = () => {
  const modal = document.getElementById("loginModal");
  const form = document.getElementById("loginForm");

  if (!modal || !form) {
    return;
  }

  const errorEl = document.getElementById("loginError");

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const email = (formData.get("email") ?? "").toString().trim();
    const password = (formData.get("password") ?? "").toString().trim();

    if (!email || !password) {
      if (errorEl) {
        errorEl.textContent = "이메일과 비밀번호를 모두 입력해주세요.";
      }
      return;
    }

    if (errorEl) {
      errorEl.textContent = "";
    }

    fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data?.success) {
          const user = data.user ?? { email };
          saveUser(user);
          updateUserBadge(user);
          modal.classList.remove("is-open");
          form.reset();
          if (errorEl) {
            errorEl.textContent = "";
          }
        } else if (errorEl) {
          errorEl.textContent =
            data?.message ?? "로그인에 실패했습니다.";
        }
      })
      .catch(() => {
        const fallbackUser = { email };
        saveUser(fallbackUser);
        updateUserBadge(fallbackUser);
        modal.classList.remove("is-open");
      });
  });
};

const updateWeatherWidget = (weather) => {
  const widget = document.getElementById("weatherWidget");
  if (!widget) {
    return;
  }

  const locationEl = widget.querySelector(".weather-card__location");
  const statusEl =
    document.getElementById("weatherStatus") ??
    document.getElementById("weatherDescription");
  const tempEl =
    document.getElementById("weatherTemp") ??
    widget.querySelector(".weather-card__temperature");
  const humidityEl = document.getElementById("weatherHumidity");

  if (locationEl) {
    locationEl.textContent =
      weather.location ?? weather.city ?? dummyWeather.location;
  }

  const statusText =
    weather.description ?? weather.status ?? dummyWeather.description;
  if (statusEl) {
    statusEl.textContent = statusText;
  }

  const tempValue =
    weather.temp ?? weather.temperature ?? dummyWeather.temperature;
  if (tempEl) {
    tempEl.textContent =
      typeof tempValue === "number" ? `${Math.round(tempValue)}°C` : "--°C";
  }

  if (humidityEl) {
    const humidityValue =
      weather.humidity ?? weather.hum ?? dummyWeather.humidity;
    humidityEl.textContent =
      typeof humidityValue === "number"
        ? `습도 ${humidityValue}%`
        : "";
  }
};

const setBookmarkButtonState = (button, active) => {
  if (!button) {
    return;
  }
  button.classList.toggle("bookmark-button--active", active);
  button.textContent = active ? "북마크 해제" : "북마크";
};

const createPerfumeCard = (perfume, options = {}) => {
  const { onBookmarkChange } = options;
  const card = document.createElement("article");
  card.className = "card";
  card.dataset.perfumeId = perfume.id;

  const tagList = Array.isArray(perfume.tags) ? perfume.tags : [];
  const preferenceTags = tagList
    .map((tag) => `<span class="tag">#${preferenceLabels[tag] ?? tag}</span>`)
    .join("");

  const accords = Array.isArray(perfume.accords) ? perfume.accords : [];
  const accordText = accords.length ? accords.join(" · ") : "";

  card.innerHTML = `
    <div class="card__image" aria-hidden="true"></div>
    <div class="card__body">
      <span class="tag">${perfume.brand ?? "HYANG"}</span>
      <h2 class="card__title">${perfume.name}</h2>
      <p>${perfume.description ?? ""}</p>
      <div class="card__meta">${accordText}</div>
      <div class="card__meta">${preferenceTags}</div>
      <div class="card__actions">
        <a class="card__link" href="detail.html?id=${encodeURIComponent(
          perfume.id
        )}">상세 보기</a>
        <button class="bookmark-button" type="button" data-bookmark-btn>북마크</button>
      </div>
    </div>
  `;

  const bookmarkButton = card.querySelector("[data-bookmark-btn]");
  setBookmarkButtonState(bookmarkButton, isBookmarked(perfume.id));
  bookmarkButton?.addEventListener("click", () => {
    const updatedList = toggleBookmark(perfume.id);
    const isActive = updatedList.includes(perfume.id);
    setBookmarkButtonState(bookmarkButton, isActive);
    onBookmarkChange?.(perfume.id, updatedList);
  });

  return card;
};

const renderResultCards = (container, perfumes, options = {}) => {
  container.innerHTML = "";
  perfumes.forEach((perfume) => {
    const normalized = normalizePerfumeForUi(perfume);
    if (!normalized) {
      return;
    }
    container.appendChild(createPerfumeCard(normalized, options));
  });
};

const initHomePage = () => {
  updateWeatherWidget(dummyWeather);

  fetch("/api/weather")
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Weather request failed: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      updateWeatherWidget({
        ...dummyWeather,
        location: data.location ?? data.city ?? dummyWeather.location,
        temp: data.temp ?? data.temperature ?? dummyWeather.temperature,
        description: data.description ?? dummyWeather.description,
        humidity: data.humidity ?? dummyWeather.humidity,
        status: data.status ?? dummyWeather.status,
      });
    })
    .catch(() => {
      // API 실패 시 더미 데이터를 유지합니다.
    });
};

const initSelectPage = () => {
  const form = document.getElementById("preferenceForm");
  if (!form) {
    return;
  }
  const storedPreferences = new Set(loadPreferences());
  form
    .querySelectorAll('input[name="preferences"]')
    .forEach((checkbox) => {
      checkbox.checked = storedPreferences.has(checkbox.value);
    });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const selected = Array.from(
      form.querySelectorAll('input[name="preferences"]:checked')
    ).map((input) => input.value);

    if (selected.length === 0) {
      alert("최소 한 가지 이상의 취향을 선택해주세요.");
      return;
    }

    savePreferences(selected);
    window.location.href = "result.html";
  });
};

const initResultPage = () => {
  const preferences = loadPreferences();
  const summaryEl = document.getElementById("resultSummary");
  const listEl = document.getElementById("resultList");
  const emptyStateEl = document.getElementById("resultEmptyState");

  if (!listEl || !summaryEl || !emptyStateEl) {
    return;
  }

  if (preferences.length === 0) {
    summaryEl.textContent = "취향이 설정되지 않아 추천을 진행할 수 없습니다.";
    emptyStateEl.hidden = false;
    listEl.innerHTML = "";
    return;
  }

  const readablePreferences = preferences
    .map((key) => preferenceLabels[key] ?? key)
    .join(", ");
  summaryEl.textContent = `${readablePreferences} 취향에 맞춰 향수를 골라봤어요.`;

  const renderCards = (list) => {
    const normalized = list
      .map(normalizePerfumeForUi)
      .filter((perfume) => perfume && perfume.id);

    if (normalized.length === 0) {
      emptyStateEl.hidden = false;
      listEl.innerHTML = "";
      return;
    }

    emptyStateEl.hidden = true;
    renderResultCards(listEl, normalized);
  };

  const renderCardsFromDummy = () => {
    const filtered = perfumeList.filter((perfume) =>
      preferences.some((pref) => perfume.tags.includes(pref))
    );

    if (filtered.length === 0) {
      emptyStateEl.hidden = false;
      emptyStateEl.querySelector("h2").textContent = "추천할 향수가 없어요";
      emptyStateEl.querySelector("p").textContent =
        "다른 취향을 추가하거나 수정하면 더 다양한 향수를 소개해드릴게요.";
      listEl.innerHTML = "";
      return;
    }

    emptyStateEl.hidden = true;
    renderResultCards(listEl, filtered);
  };

  fetch("/api/recommendations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ notes: preferences, exclude: [], context: [] }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Recommendations request failed: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      const list = Array.isArray(data) ? data : data?.perfumes ?? [];
      renderCards(list);
    })
    .catch(() => {
      renderCardsFromDummy();
    });
};

const initDetailPage = () => {
  const params = new URLSearchParams(window.location.search);
  const perfumeId = params.get("id");
  const content = document.getElementById("detailContent");
  const emptyState = document.getElementById("detailEmptyState");

  if (!perfumeId || !content || !emptyState) {
    return;
  }

  const applyPerfumeDetails = (perfume) => {
    const brandEl = document.getElementById("detailBrand");
    const titleEl = document.getElementById("detailTitle");
    const descriptionEl = document.getElementById("detailDescription");
    const topEl = document.getElementById("detailTopNotes");
    const middleEl = document.getElementById("detailMiddleNotes");
    const baseEl = document.getElementById("detailBaseNotes");
    const bookmarkButton = document.getElementById("detailBookmarkButton");

    if (brandEl) {
      brandEl.textContent = perfume.brand ?? "HYANG";
    }
    if (titleEl) {
      titleEl.textContent = perfume.name;
    }
    if (descriptionEl) {
      descriptionEl.textContent = perfume.description ?? "";
    }
    if (topEl) {
      topEl.textContent = perfume.notes.top.join(", ") || "정보 준비 중";
    }
    if (middleEl) {
      middleEl.textContent =
        perfume.notes.middle.join(", ") || "정보 준비 중";
    }
    if (baseEl) {
      baseEl.textContent = perfume.notes.base.join(", ") || "정보 준비 중";
    }

    if (bookmarkButton) {
      setBookmarkButtonState(bookmarkButton, isBookmarked(perfume.id));
      bookmarkButton.addEventListener("click", () => {
        const updated = toggleBookmark(perfume.id);
        const isActive = updated.includes(perfume.id);
        setBookmarkButtonState(bookmarkButton, isActive);
      });
    }

    emptyState.hidden = true;
    content.hidden = false;
  };

  const showFallback = () => {
    const fallbackPerfume = normalizePerfumeForUi(
      perfumeList.find((item) => item.id === perfumeId)
    );
    if (fallbackPerfume) {
      applyPerfumeDetails(fallbackPerfume);
    } else {
      emptyState.hidden = false;
      content.hidden = true;
    }
  };

  fetchPerfumesFromApi()
    .then((list) => {
      const target = list.find((item) => item.id === perfumeId);
      if (target) {
        applyPerfumeDetails(target);
      } else {
        showFallback();
      }
    })
    .catch(() => {
      showFallback();
    });
};

const initMyPage = () => {
  const listEl = document.getElementById("bookmarkList");
  const emptyStateEl = document.getElementById("bookmarkEmptyState");
  if (!listEl || !emptyStateEl) {
    return;
  }

  const renderFromSource = (sourceList) => {
    const bookmarkSet = new Set(loadBookmarks());
    if (bookmarkSet.size === 0) {
      emptyStateEl.hidden = false;
      listEl.innerHTML = "";
      return;
    }

    const normalized = sourceList
      .map(normalizePerfumeForUi)
      .filter((perfume) => perfume && bookmarkSet.has(perfume.id));

    if (normalized.length === 0) {
      emptyStateEl.hidden = false;
      listEl.innerHTML = "";
      return;
    }

    emptyStateEl.hidden = true;
    renderResultCards(listEl, normalized, {
      onBookmarkChange: (perfumeId, updatedList) => {
        if (!updatedList.includes(perfumeId)) {
          renderFromSource(sourceList);
        }
      },
    });
  };

  fetchPerfumesFromApi()
    .then((list) => renderFromSource(list))
    .catch(() => renderFromSource(perfumeList));
};

const pageInitializers = {
  home: initHomePage,
  select: initSelectPage,
  result: initResultPage,
  detail: initDetailPage,
  mypage: initMyPage,
};

document.addEventListener("DOMContentLoaded", () => {
  setupNavigation();
  hydrateUserBadge();
  setupLoginModal();

  const pageKey = document.body.dataset.page;
  const initializer = pageInitializers[pageKey];
  if (initializer) {
    initializer();
  }
});
// 변경 끝
