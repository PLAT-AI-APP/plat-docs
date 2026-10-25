import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { findDocsInOtherLocales, getDocsLocales, getDocsPage, listDocsParams } from "@/api/docs/server";
import DocsMarkdown from "@/components/docs/DocsMarkdown";
import DocsToc from "@/components/docs/DocsToc";
import DocsUntranslated from "@/components/docs/DocsUntranslated";
import { buildDocsMetadata, readDocsLocale } from "@/components/docs/docsMetadata";
import { docsPath } from "@/components/docs/docsPath";
import { ChevronIcon } from "@/components/docs/DocsIcons";
import { getDocsMessages } from "@/i18n/locales/docs";

/*
 * 빌드 때 모든 언어의 화면을 미리 그려 둔다(문서는 빌드에 함께 들어 있다). 문서가 바뀌면 다시 빌드·배포된다.
 */

export async function generateStaticParams(): Promise<{ locale: string; slug: string }[]> {
  return listDocsParams("pages");
}

/** 빌드 때 만든 주소 밖은 그리지 않고 404 로 보낸다(없는 문서). */
export const dynamicParams = false;

interface ArticlePageProps {
  params: Promise<{ locale: string; slug: string }>;
}

const ARTICLE_BODY_ID = "docs-article-body";

const loadArticle = async (params: ArticlePageProps["params"]) => {
  const { locale: rawLocale, slug } = await params;
  const locale = await readDocsLocale(rawLocale);
  if (!locale) return null;
  const page = await getDocsPage(locale, slug);
  if (page) return { locale, page, translations: [] };
  // 이 언어로는 없는 문서 — 다른 언어로 있으면 번역 없음 안내를, 어디에도 없으면 404 를 그린다.
  const translations = await findDocsInOtherLocales(locale, (other) => getDocsPage(other, slug));
  return translations.length ? { locale, page: null, translations } : null;
};

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const loaded = await loadArticle(params);
  if (!loaded) return {};
  const { locale, page, translations } = loaded;
  if (!page) {
    return { title: translations[0].item.title, robots: { index: false, follow: true } };
  }
  return buildDocsMetadata({
    locale,
    title: page.title,
    description: page.summary,
    path: docsPath.article(locale, page.slug),
    alternates: Object.fromEntries(
      page.availableLocales.map((each) => [each, docsPath.article(each, page.slug)]),
    ),
  });
}

/** 아티클 화면: 가운데 본문 · 오른쪽 목차(xl 이상). 왼쪽 트리는 (frame) 레이아웃이 그린다. */
export default async function DocsArticlePage({ params }: ArticlePageProps) {
  const loaded = await loadArticle(params);
  if (!loaded) notFound();
  const { locale, page, translations } = loaded;

  if (!page) {
    const { locales } = await getDocsLocales();
    return (
      <DocsUntranslated
        locale={locale}
        languageName={locales.find((each) => each.code === locale)?.name ?? locale}
        translations={translations.map((each) => ({
          locale: each.locale,
          languageName: each.name,
          title: each.item.title,
          href: docsPath.article(each.locale, each.item.slug),
        }))}
      />
    );
  }

  const messages = getDocsMessages(locale);

  return (
    <>
      <div className="mx-auto flex w-full max-w-[1100px] gap-12 px-4 pt-6 pb-24 sm:px-8 lg:pt-10">
        <article className="min-w-0 flex-1">
          {page.breadcrumbs.length > 0 && (
            <nav aria-label="breadcrumb" className="mb-4">
              <ol className="body-6 flex flex-wrap items-center gap-1 text-font-2">
                {page.breadcrumbs.map((crumb, index) => (
                  <li key={crumb.slug} className="flex items-center gap-1">
                    {index > 0 && <ChevronIcon size={12} aria-hidden="true" className="text-font-disabled" />}
                    <Link
                      href={docsPath.category(locale, crumb.slug)}
                      className="hover:text-font-1 hover:underline"
                    >
                      {crumb.name}
                    </Link>
                  </li>
                ))}
              </ol>
            </nav>
          )}

          <header className="flex flex-col gap-3 border-b border-main pb-8">
            <h1 className="text-[2rem] leading-tight font-bold break-keep text-font-0 sm:text-[2.5rem]">
              {page.title}
            </h1>
            {page.summary && <p className="body-3 text-font-2">{page.summary}</p>}
          </header>

          <div id={ARTICLE_BODY_ID} className="body-3 mt-8 flex flex-col gap-4 break-words text-font-1">
            <DocsMarkdown content={page.content} />
          </div>
        </article>

        <aside className="hidden w-[220px] shrink-0 xl:block">
          <div className="sticky top-[calc(var(--docs-header-height)+40px)] max-h-[calc(100dvh-var(--docs-header-height)-80px)] overflow-y-auto">
            <DocsToc containerId={ARTICLE_BODY_ID} title={messages.tableOfContents} />
          </div>
        </aside>
      </div>
    </>
  );
}
