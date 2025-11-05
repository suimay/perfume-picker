const PREFERENCE_KEY = "prefs";
const BOOKMARK_KEY = "hyang.bookmarks";

const safeParse = (raw, fallback) => {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    console.warn("Failed to parse stored data:", error);
    return fallback;
  }
};

export const loadPreferences = () => {
  const data = safeParse(localStorage.getItem(PREFERENCE_KEY), {
    notes: [],
    exclude: [],
    context: [],
  });
  if (Array.isArray(data)) {
    return { notes: data, exclude: [], context: [] };
  }
  return {
    notes: Array.isArray(data.notes) ? data.notes : [],
    exclude: Array.isArray(data.exclude) ? data.exclude : [],
    context: Array.isArray(data.context) ? data.context : [],
  };
};

export const savePreferences = (preferences) => {
  localStorage.setItem(PREFERENCE_KEY, JSON.stringify(preferences));
};

export const loadBookmarks = () => {
  return safeParse(localStorage.getItem(BOOKMARK_KEY), []);
};

export const saveBookmarks = (bookmarkIds) => {
  localStorage.setItem(BOOKMARK_KEY, JSON.stringify(bookmarkIds));
};

export const toggleBookmark = (perfumeId) => {
  const key = String(perfumeId);
  const current = new Set(loadBookmarks());
  if (current.has(key)) {
    current.delete(key);
  } else {
    current.add(key);
  }
  const result = Array.from(current);
  saveBookmarks(result);
  return result;
};

export const isBookmarked = (perfumeId) => {
  const key = String(perfumeId);
  return loadBookmarks().includes(key);
};
