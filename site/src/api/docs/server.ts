import { cache } from "react";
import content from "@/generated/content.json";
import { matchDocs } from "./matchDocs";
import type {
  DocsGroupResponse,
  DocsHomeResponse,
  DocsLocale,
  DocsLocaleBundle,
  DocsLocalesResponse,
  DocsPageResponse,
  DocsSearchResponse,
  DocsTreeResponse,
} from "./types";

/*
 * 문서 사이트 데이터 레이어. 서버 컴포넌트·route 에서만 부른다(검색 엔진이 본문을 읽도록 서버에서 그린다).
 *
 * - 원본은 이 레포의 ko/ · en/ · assets/ 다. 빌드 직전에 scripts/prepare-content.mjs 가 레포의
 *   scripts/build-bundle.mjs 로 검사·묶음을 만들어 src/generated/content.json 에 쓰고, 여기서는 그것만 읽는다.
 *   문서를 고치면 다시 빌드·배포되어야 사이트에 보인다(사이트가 실행 중에 문서를 다시 받지 않는다).
 * - 묶음에 없는 slug 는 null 로 돌려 페이지가 notFound() 를 부르게 한다.
 */

interface DocsContent {
  locales: DocsLocalesResponse;
  byLocale: Record<DocsLocale, DocsLocaleBundle>;
}

const bundle = content as unknown as DocsContent;

/** 레코드에서 slug 로 찾는다. `constructor` 같은 프로토타입 이름이 주소로 들어와도 걸리지 않게 자기 키만 본다. */
const pick = <T>(record: Record<string, T>, slug: string): T | null =>
  Object.hasOwn(record, slug) ? record[slug] : null;

/**
 * 지원 언어. 주소 검사 · 언어 메뉴 · hreflang · `/` 기본 언어가 모두 이것을 쓴다.
 * 비어 있으면 문서를 그릴 수 없으므로 던진다(오류 화면).
 */
export const getDocsLocales = cache(async (): Promise<DocsLocalesResponse> => {
  if (!bundle.locales?.locales?.length) throw new Error("[docs] 지원 언어가 비었습니다.");
  return bundle.locales;
});

const getDocsBundle = cache(async (locale: DocsLocale): Promise<DocsLocaleBundle> => {
  const found = pick(bundle.byLocale, locale);
  if (!found) throw new Error(`[docs] '${locale}' 묶음이 없습니다.`);
  return found;
});

export const getDocsTree = cache(async (locale: DocsLocale): Promise<DocsTreeResponse> => ({
  items: (await getDocsBundle(locale)).tree,
}));

export const getDocsHome = cache(async (locale: DocsLocale): Promise<DocsHomeResponse> => ({
  groups: (await getDocsBundle(locale)).home,
}));

export const getDocsGroup = cache(
  async (locale: DocsLocale, slug: string): Promise<DocsGroupResponse | null> =>
    pick((await getDocsBundle(locale)).groups, slug),
);

export const getDocsPage = cache(
  async (locale: DocsLocale, slug: string): Promise<DocsPageResponse | null> =>
    pick((await getDocsBundle(locale)).pages, slug),
);

export const searchDocsOnServer = cache(
  async (locale: DocsLocale, query: string): Promise<DocsSearchResponse> => ({
    items: matchDocs((await getDocsBundle(locale)).search, query),
  }),
);

/**
 * 빌드 때 미리 그릴 주소. 어느 언어에든 있는 그룹·페이지 slug 를 모든 언어 주소로 돌려준다.
 * 한쪽 언어에만 있는 문서도 다른 언어 주소로 미리 그려 "번역 없음" 안내가 나오게 한다.
 * 이 목록 밖의 주소는 페이지가 dynamicParams = false 로 바로 404 를 낸다.
 */
export const listDocsParams = async (kind: "groups" | "pages"): Promise<{ locale: string; slug: string }[]> => {
  const { locales } = await getDocsLocales();
  const slugs = new Set(locales.flatMap(({ code }) => Object.keys(pick(bundle.byLocale, code)?.[kind] ?? {})));
  return locales.flatMap(({ code }) => [...slugs].map((slug) => ({ locale: code, slug })));
};

/**
 * 지금 언어에 없는 문서가 다른 언어로는 있는지 찾는다. 언어를 바꿔 들어온 문서가 그 언어로 번역되지 않았을 때
 * "다른 언어로 보기" 안내를 그리는 데 쓴다. 어느 언어에도 없으면 빈 배열(진짜 없는 문서 → 404).
 */
export const findDocsInOtherLocales = async <T>(
  locale: DocsLocale,
  load: (other: DocsLocale) => Promise<T | null>,
): Promise<{ locale: DocsLocale; name: string; item: T }[]> => {
  const { locales } = await getDocsLocales();
  const found = await Promise.all(
    locales
      .filter((each) => each.code !== locale)
      .map(async (each) => ({ locale: each.code, name: each.name, item: await load(each.code) })),
  );
  return found.flatMap((each) => (each.item ? [{ ...each, item: each.item }] : []));
};
