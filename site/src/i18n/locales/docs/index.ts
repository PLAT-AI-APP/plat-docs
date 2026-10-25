import type { DocsLocale } from "@/api/docs/types";
import en from "./en";
import ko from "./ko";

export type DocsMessages = typeof ko;

const MESSAGES: Record<DocsLocale, DocsMessages> = { ko, en };

/**
 * 주소 locale 에 맞는 문서 화면 문구. 서버 컴포넌트에서 골라 클라이언트 컴포넌트에 props 로 넘긴다.
 * 지원 언어는 문서 레포(docs.config.json)가 정하므로, 레포가 언어를 먼저 늘려 사이트에 문구가 아직 없으면 영어 문구를 쓴다
 * (본문 · 제목은 문서 레포에 그 언어로 있다).
 */
export const getDocsMessages = (locale: DocsLocale): DocsMessages => MESSAGES[locale] ?? MESSAGES.en;

/** "{name}" 자리표시자를 채운다. */
export const formatDocsMessage = (
  template: string,
  values: Record<string, string | number>,
) => template.replace(/\{(\w+)\}/g, (whole, key: string) => String(values[key] ?? whole));

/** 개수에 따라 단수·복수를 고르는 문구. 한국어처럼 가르지 않는 언어는 둘을 같게 둔다. */
export interface DocsCountMessage {
  one: string;
  other: string;
}

/** 개수 문구를 locale 의 복수 규칙으로 골라 "{count}" 를 채운다. */
export const formatDocsCount = (locale: DocsLocale, message: DocsCountMessage, count: number) =>
  formatDocsMessage(new Intl.PluralRules(locale).select(count) === "one" ? message.one : message.other, {
    count,
  });
