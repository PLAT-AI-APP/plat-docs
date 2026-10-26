import type { Metadata } from "next";
import { getDocsLocales } from "@/api/docs/server";
import type { DocsLocale } from "@/api/docs/types";
import { getDocsMessages } from "@/i18n/locales/docs";

/**
 * 주소의 locale 조각을 문서 언어로 읽는다. 문서 레포가 지원하는 언어가 아니면 null(페이지가 notFound).
 * 언어 목록은 요청 하나에서 한 번만 받는다(getDocsLocales 가 cache 로 묶여 있다).
 */
export const readDocsLocale = async (value: string): Promise<DocsLocale | null> => {
  const { locales } = await getDocsLocales();
  return locales.some((locale) => locale.code === value) ? value : null;
};

/** og:locale 표기. 모르는 언어는 코드 그대로 둔다. */
const OG_LOCALE: Record<string, string> = { ko: "ko_KR", en: "en_US" };

/**
 * 문서 화면 공통 메타데이터. canonical 은 정규 주소(slug-id), 같은 문서가 있는 다른 언어는 hreflang 으로 잇는다.
 * 상대 경로는 루트 레이아웃의 metadataBase(SITE_URL)로 풀린다.
 */
export const buildDocsMetadata = ({
  locale,
  title,
  description,
  path,
  alternates,
}: {
  locale: DocsLocale;
  title?: string;
  description?: string | null;
  path: string;
  /** 언어별 같은 문서 주소. 없으면 hreflang 을 달지 않는다. */
  alternates?: Partial<Record<DocsLocale, string>>;
}): Metadata => {
  const messages = getDocsMessages(locale);
  const desc = description?.trim() || messages.metaDescription;
  return {
    ...(title ? { title } : {}),
    description: desc,
    alternates: {
      canonical: path,
      ...(alternates ? { languages: alternates } : {}),
    },
    openGraph: {
      type: "website",
      siteName: messages.siteName,
      locale: OG_LOCALE[locale] ?? locale,
      title: title ? `${title} | ${messages.siteName}` : messages.siteName,
      description: desc,
      url: path,
    },
  };
};

/** 모든 언어 주소(홈처럼 언어마다 반드시 있는 화면). */
export const allLocaleAlternates = async (
  toPath: (locale: DocsLocale) => string,
): Promise<Record<DocsLocale, string>> => {
  const { locales } = await getDocsLocales();
  return Object.fromEntries(locales.map(({ code }) => [code, toPath(code)]));
};
