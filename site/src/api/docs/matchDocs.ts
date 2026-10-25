import type { DocsSearchEntry, DocsSearchItem } from "./types";
import { DOCS_SEARCH_MAX_LENGTH } from "./types";

const MAX_RESULTS = 20;

/**
 * 문서 검색. 검색 화면(서버)과 검색창 자동완성(route)이 같이 쓴다.
 * 대소문자를 가리지 않고, 제목에 있는 문서를 요약·본문에만 있는 문서보다 앞에 두며, 최대 20건이다.
 * 검색어는 앞뒤 공백을 뺀 뒤 1~50자만 받고, 범위를 벗어나면 빈 결과다.
 */
export const matchDocs = (entries: DocsSearchEntry[], rawQuery: string): DocsSearchItem[] => {
  const query = rawQuery.trim().toLowerCase();
  if (!query || query.length > DOCS_SEARCH_MAX_LENGTH) return [];

  const inTitle: DocsSearchItem[] = [];
  const inBody: DocsSearchItem[] = [];
  for (const { text, ...item } of entries) {
    if (item.title.toLowerCase().includes(query)) inTitle.push(item);
    else if (`${item.summary ?? ""} ${text}`.toLowerCase().includes(query)) inBody.push(item);
  }
  return [...inTitle, ...inBody].slice(0, MAX_RESULTS);
};
