import type { CSSProperties, ReactNode } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDocsLocales, getDocsTree } from "@/api/docs/server";
import DocsHeader from "@/components/docs/DocsHeader";
import { readDocsLocale } from "@/components/docs/docsMetadata";
import { DocsProvider } from "@/components/docs/DocsProvider";
import { getDocsMessages } from "@/i18n/locales/docs";

interface DocsLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: DocsLayoutProps): Promise<Metadata> {
  const locale = await readDocsLocale((await params).locale);
  if (!locale) return {};
  const messages = getDocsMessages(locale);
  return {
    // absolute: 루트 레이아웃의 "%s | PLAT" 템플릿을 덧붙이지 않는다.
    title: { absolute: messages.siteName, template: `%s | ${messages.siteName}` },
    description: messages.metaDescription,
  };
}

/**
 * 문서 사이트 레이아웃. 앱 셸(헤더·사이드바·하단탭)은 AppShell 이 /docs 에서 그리지 않고, 여기서 문서 헤더만 그린다.
 * 언어는 주소의 locale 로 정한다(앱의 언어 store 와 무관). 사이드바·드로어가 쓰는 트리는 여기서 한 번 받는다.
 */
export default async function DocsLocaleLayout({ children, params }: DocsLayoutProps) {
  const locale = await readDocsLocale((await params).locale);
  if (!locale) notFound();

  const [tree, { locales }] = await Promise.all([getDocsTree(locale), getDocsLocales()]);
  const messages = getDocsMessages(locale);

  return (
    <DocsProvider locale={locale} locales={locales} messages={messages} tree={tree.items}>
      <div
        lang={locale}
        className="min-h-dvh bg-dark whitespace-normal text-font-1"
        style={{ "--docs-header-height": "60px" } as CSSProperties}
      >
        <DocsHeader />
        <main>{children}</main>
      </div>
    </DocsProvider>
  );
}
