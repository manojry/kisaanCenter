// Global cache for categories (per session)
let categoriesCache: any[] | null = null;

export function useCategoriesCache() {
  const getCategories = () => categoriesCache;
  const setCategoriesCache = (categories: any[]) => {
    categoriesCache = categories;
  };
  return { getCategories, setCategoriesCache };
}
