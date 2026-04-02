import { useMemo } from "react";

const FAVORITE_KEY = "hk-school-app-favorites";

const loadFavoriteIds = (): string[] => {
  try {
    const raw = localStorage.getItem(FAVORITE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveFavoriteIds = (ids: string[]): void => {
  localStorage.setItem(FAVORITE_KEY, JSON.stringify(ids));
};

export const useFavoriteHelpers = (favoriteIds: string[]) => {
  const favoriteSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);

  const toggleFavorite = (id: string): string[] => {
    if (favoriteSet.has(id)) {
      const next = favoriteIds.filter((item) => item !== id);
      saveFavoriteIds(next);
      return next;
    }

    const next = [...favoriteIds, id];
    saveFavoriteIds(next);
    return next;
  };

  return { favoriteSet, toggleFavorite };
};

export { loadFavoriteIds };
