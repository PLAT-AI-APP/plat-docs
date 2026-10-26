import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { findDocsInOtherLocales, getDocsGroup, getDocsLocales, listDocsParams } from "@/api/docs/server";
import DocsThumbnail from "@/components/docs/DocsThumbnail";
import DocsUntranslated from "@/components/docs/DocsUntranslated";
import { buildDocsMetadata, readDocsLocale } from "@/components/docs/docsMetadata";
import { docsPath } from "@/components/docs/docsPath";
import { formatDocsCount, getDocsMessages } from "@/i18n/locales/docs";

/*
 * 빌드 때 모든 언어의 화면을 미리 그려 둔다(문서는 빌드에 함께 들어 있다). 문서가 바뀌면 다시 빌드·배포된다.
 */

export async function generateStaticParams(): Promise<{ locale: string; slug: string }[]> {
  return listDocsParams("groups");
}

/** 빌드 때 만든 주소 밖은 그리지 않고 404 로 보낸다(없는 문서). */
export const dynamicParams = false;

interface CategoryPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

const loadCategory = async (params: CategoryPageProps["params"]) => {
  const { locale: rawLocale, slug } = await params;
  const locale = await readDocsLocale(rawLocale);
  if (!locale) return null;
  const group = await getDocsGroup(locale, slug);
  if (group) return { locale, group, translations: [] };
  // 이 언어로는 보이지 않는 카테고리 — 다른 언어로 있으면 번역 없음 안내를, 어디에도 없으면 404 를 그린다.
  const translations = await findDocsInOtherLocales(locale, (other) => getDocsGroup(other, slug));
  return translations.length ? { locale, group: null, translations } : null;
};

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const loaded = await loadCategory(params);
  if (!loaded) return {};
  const { locale, group, translations } = loaded;
  if (!group) {
    return { title: translations[0].item.name, robots: { index: false, follow: true } };
  }
  return buildDocsMetadata({
    locale,
    title: group.name,
    description: group.description,
    path: docsPath.category(locale, group.slug),
    alternates: Object.fromEntries(
      group.availableLocales.map((each) => [each, docsPath.category(each, group.slug)]),
    ),
  });
}

/** 카테고리(그룹) 화면: 커버, 제목·설명, 하위 그룹 카드와 아티클 목록. */
export default async function DocsCategoryPage({ params }: CategoryPageProps) {
  const loaded = await loadCategory(params);
  if (!loaded) notFound();
  const { locale, group, translations } = loaded;

  if (!group) {
    const { locales } = await getDocsLocales();
    return (
      <DocsUntranslated
        locale={locale}
        languageName={locales.find((each) => each.code === locale)?.name ?? locale}
        translations={translations.map((each) => ({
          locale: each.locale,
          languageName: each.name,
          title: each.item.name,
          href: docsPath.category(each.locale, each.item.slug),
        }))}
      />
    );
  }

  const messages = getDocsMessages(locale);
  const subgroups = group.children.filter((child) => child.type === "GROUP");
  const pages = group.children.filter((child) => child.type === "PAGE");

  return (
    <>
      <article className="mx-auto w-full max-w-[800px] px-4 pt-6 pb-24 sm:px-8 lg:pt-10">
        <DocsThumbnail
          src={group.coverImageUrl}
          alt=""
          eager
          iconSize={96}
          className="aspect-[16/7] w-full rounded-2xl"
        />

        <header className="mt-8 flex flex-col gap-3 border-b border-main pb-8">
          <p className="title-6 text-brand-dark">{messages.categoryLabel}</p>
          <h1 className="text-[2rem] leading-tight font-bold text-font-0 sm:text-[2.5rem]">
            {group.name}
          </h1>
          {group.description && <p className="body-3 text-font-2">{group.description}</p>}
        </header>

        {group.children.length === 0 && (
          <p className="body-4 py-12 text-center text-font-2">{messages.emptyCategory}</p>
        )}

        {subgroups.length > 0 && (
          <ul className="mt-6 flex flex-col gap-2">
            {subgroups.map((child) => (
              <li key={`group-${child.slug}`}>
                <Link
                  href={docsPath.category(locale, child.slug)}
                  className="group -mx-3 flex items-center gap-6 rounded-2xl p-3 transition-colors hover:bg-btn-hover"
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <h2 className="title-2 text-font-0 group-hover:text-brand-dark">{child.name}</h2>
                    {child.description && (
                      <p className="body-5 line-clamp-2 text-font-2">{child.description}</p>
                    )}
                    <p className="body-7 text-font-disabled">
                      {formatDocsCount(locale, messages.articleCount, child.pageCount)}
                    </p>
                  </div>
                  <DocsThumbnail
                    src={child.coverImageUrl}
                    alt=""
                    className="aspect-[16/9] w-28 shrink-0 sm:w-[200px]"
                    iconSize={44}
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}

        {pages.length > 0 && (
          <ul className="mt-6 flex flex-col gap-1">
            {pages.map((child) => (
              <li key={`page-${child.slug}`}>
                <Link
                  href={docsPath.article(locale, child.slug)}
                  className="group -mx-3 flex flex-col gap-1 rounded-xl px-3 py-4 transition-colors hover:bg-btn-hover"
                >
                  <h2 className="title-2 text-font-0 group-hover:text-brand-dark">{child.title}</h2>
                  {child.summary && (
                    <p className="body-5 line-clamp-1 text-font-2">{child.summary}</p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </article>
    </>
  );
}
