import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { searchDocsOnServer } from "@/api/docs/server";
import DocsSearchBox from "@/components/docs/DocsSearchBox";
import { readDocsLocale } from "@/components/docs/docsMetadata";
import { docsPath } from "@/components/docs/docsPath";
import { formatDocsCount, formatDocsMessage, getDocsMessages } from "@/i18n/locales/docs";

interface SearchPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string | string[] }>;
}

const readQuery = (value: string | string[] | undefined) =>
  (Array.isArray(value) ? value[0] : value)?.trim() ?? "";

export async function generateMetadata({ params }: SearchPageProps): Promise<Metadata> {
  const locale = await readDocsLocale((await params).locale);
  if (!locale) return {};
  // 검색 결과 화면은 색인하지 않는다(질의마다 주소가 달라 중복 문서가 된다).
  return {
    title: getDocsMessages(locale).searchTitle,
    robots: { index: false, follow: true },
  };
}

/** 검색 결과 화면. 헤더 검색창에서 Enter 로 온다. */
export default async function DocsSearchPage({ params, searchParams }: SearchPageProps) {
  const locale = await readDocsLocale((await params).locale);
  if (!locale) notFound();

  const query = readQuery((await searchParams).q);
  const messages = getDocsMessages(locale);
  const { items } = await searchDocsOnServer(locale, query);

  return (
    <section className="mx-auto w-full max-w-[800px] px-4 pt-8 pb-24 sm:px-6 sm:pt-12">
      {/* 같은 검색어로 다시 올 때도 입력값이 맞도록 검색어마다 새로 그린다. */}
      <DocsSearchBox key={query} size="lg" defaultValue={query} />

      {query ? (
        <>
          <div className="mt-10 flex items-baseline justify-between gap-4 border-b border-main pb-4">
            <h1 className="heading-3 break-all text-font-0">
              {formatDocsMessage(messages.searchResultHeading, { query })}
            </h1>
            <p className="body-6 shrink-0 text-font-2">
              {formatDocsCount(locale, messages.searchResultCount, items.length)}
            </p>
          </div>
          {items.length === 0 ? (
            <p className="body-4 py-16 text-center text-font-2">{messages.searchEmpty}</p>
          ) : (
            <ul className="mt-2 flex flex-col">
              {items.map((item) => (
                <li key={item.slug} className="border-b border-main last:border-b-0">
                  <Link
                    href={docsPath.article(locale, item.slug)}
                    className="group -mx-3 flex flex-col gap-1 rounded-xl px-3 py-4 transition-colors hover:bg-btn-hover"
                  >
                    {item.groupName && (
                      <span className="body-7 text-font-disabled">{item.groupName}</span>
                    )}
                    <span className="title-2 text-font-0 group-hover:text-brand-dark">
                      {item.title}
                    </span>
                    {item.summary && (
                      <span className="body-5 line-clamp-2 text-font-2">{item.summary}</span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <p className="body-4 py-16 text-center text-font-2">{messages.searchPrompt}</p>
      )}
    </section>
  );
}
