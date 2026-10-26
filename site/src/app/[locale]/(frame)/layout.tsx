import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import DocsFrame from "@/components/docs/DocsFrame";
import { readDocsLocale } from "@/components/docs/docsMetadata";
import { getDocsMessages } from "@/i18n/locales/docs";

/**
 * 카테고리 · 아티클이 함께 쓰는 틀(왼쪽 트리 사이드바). 레이아웃이라 문서 사이를 오가도 다시 그려지지 않는다 —
 * 바뀌는 것은 가운데 본문(과 목차)뿐이고, 사이드바 트리의 펼침 · 스크롤은 그대로 남는다.
 * 홈 · 검색은 사이드바 없이 넓게 그리므로 이 묶음 밖에 둔다.
 */
export default async function DocsFramedLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const locale = await readDocsLocale((await params).locale);
  if (!locale) notFound();

  return <DocsFrame messages={getDocsMessages(locale)}>{children}</DocsFrame>;
}
