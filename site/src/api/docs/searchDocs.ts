import { docsPath } from "@/components/docs/docsPath";
import type { DocsLocale, DocsSearchResponse } from "./types";
import { DOCS_SEARCH_MAX_LENGTH } from "./types";

/**
 * 검색창 자동완성용 브라우저 요청. 같은 사이트의 route(`/{locale}/search-suggest`)를 부른다.
 * 실패해도 드롭다운만 비우면 되므로 fetch 를 바로 쓴다.
 */
export const searchDocs = async (
  locale: DocsLocale,
  rawQuery: string,
  signal?: AbortSignal,
): Promise<DocsSearchResponse> => {
  const query = rawQuery.trim();
  if (!query || query.length > DOCS_SEARCH_MAX_LENGTH) return { items: [] };

  const params = new URLSearchParams({ q: query });
  const response = await fetch(`${docsPath.home(locale)}/search-suggest?${params}`, {
    headers: { Accept: "application/json" },
    signal,
  });
  if (!response.ok) throw new Error(`[docs] 검색 실패: ${response.status}`);
  return (await response.json()) as DocsSearchResponse;
};
