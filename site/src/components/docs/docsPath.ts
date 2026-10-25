import type { DocsLocale } from "@/api/docs/types";

/*
 * 문서 사이트 내부 링크는 전부 여기서 만든다.
 * 독립 사이트(docs.plat.so)라 문서가 도메인 맨 앞에서 시작한다. plat-fe 안에 있을 때는 "/docs" 였다.
 */
export const DOCS_BASE_PATH = "";

/**
 * 앱에서 문서로 들어갈 때 붙이는 앱 언어(`https://docs.plat.so/?lang=en`).
 * 문서가 그 언어를 지원하면 그 언어 홈으로, 아니면 기본 언어로 간다(app/page.tsx 가 고른다).
 */
export const DOCS_ENTRY_LANG_PARAM = "lang";

/** 진입 언어가 지원 목록에 있으면 그 언어, 없으면 기본 언어. */
export const pickDocsEntryLocale = (
  requested: string | null | undefined,
  supported: { defaultLocale: DocsLocale; locales: { code: DocsLocale }[] },
): DocsLocale =>
  supported.locales.some((item) => item.code === requested) ? (requested as DocsLocale) : supported.defaultLocale;

export const docsPath = {
  home: (locale: DocsLocale) => `${DOCS_BASE_PATH}/${locale}`,
  category: (locale: DocsLocale, slug: string) => `${DOCS_BASE_PATH}/${locale}/categories/${slug}`,
  article: (locale: DocsLocale, slug: string) => `${DOCS_BASE_PATH}/${locale}/articles/${slug}`,
  search: (locale: DocsLocale, query?: string) => {
    const trimmed = query?.trim();
    return `${DOCS_BASE_PATH}/${locale}/search${
      trimmed ? `?${new URLSearchParams({ q: trimmed })}` : ""
    }`;
  },
};

/** 현재 문서 주소의 종류와 slug. 사이드바 강조·언어 전환이 주소만 보고 판단한다. */
export const parseDocsPathname = (
  pathname: string,
): { locale: string; kind: "home" | "category" | "article" | "search" | "other"; slug?: string } => {
  const rest = pathname.startsWith(DOCS_BASE_PATH)
    ? pathname.slice(DOCS_BASE_PATH.length)
    : pathname;
  const [, locale = "", section, slug] = rest.split("/");
  if (!section) return { locale, kind: "home" };
  if (section === "search") return { locale, kind: "search" };
  if ((section === "categories" || section === "articles") && slug) {
    return { locale, kind: section === "categories" ? "category" : "article", slug };
  }
  return { locale, kind: "other" };
};

/** 같은 화면을 다른 언어로 연 주소. 기준 경로 뒤 첫 조각(locale)만 바꾼다. */
export const swapDocsLocale = (pathname: string, search: string, locale: DocsLocale) => {
  const rest = pathname.slice(DOCS_BASE_PATH.length).split("/");
  rest[1] = locale;
  return `${DOCS_BASE_PATH}${rest.join("/")}${search}`;
};
