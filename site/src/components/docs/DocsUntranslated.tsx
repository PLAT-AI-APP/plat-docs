import Link from "next/link";
import type { DocsLocale } from "@/api/docs/types";
import { Global } from "@/icons";
import { formatDocsMessage, getDocsMessages } from "@/i18n/locales/docs";
import { docsPath } from "./docsPath";

export interface DocsTranslationLink {
  locale: DocsLocale;
  /** 그 언어로 적은 언어 이름(한국어 · English). */
  languageName: string;
  title: string;
  href: string;
}

/**
 * 지금 언어로는 번역되지 않은 문서·카테고리를 열었을 때의 안내. 언어 메뉴는 번역 여부를 미리 판단하지 않고
 * 같은 주소의 언어만 바꾸므로(캐시된 이전 응답으로 잘못 판단하지 않게), 번역이 없으면 여기서 다른 언어 판과
 * 문서 홈으로 안내한다.
 */
const DocsUntranslated = ({
  locale,
  languageName,
  translations,
}: {
  locale: DocsLocale;
  /** 지금 언어의 이름. */
  languageName: string;
  translations: DocsTranslationLink[];
}) => {
  const messages = getDocsMessages(locale);
  return (
    <section className="mx-auto flex w-full max-w-[640px] flex-col items-center gap-6 px-4 pt-20 pb-24 text-center sm:px-8">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-brand-opacity text-brand">
        <Global size={28} aria-hidden="true" />
      </div>
      <div className="flex flex-col gap-2">
        <h1 className="heading-2 break-keep text-font-0">
          {formatDocsMessage(messages.untranslatedTitle, { language: languageName })}
        </h1>
        <p className="body-4 break-keep text-font-2">{messages.untranslatedDescription}</p>
      </div>
      <ul className="flex w-full flex-col gap-2">
        {translations.map((each) => (
          <li key={each.locale}>
            <Link
              href={each.href}
              hrefLang={each.locale}
              className="flex items-center justify-between gap-4 rounded-xl border border-main px-4 py-3 text-left transition-colors hover:bg-btn-hover"
            >
              <span lang={each.locale} className="title-4 min-w-0 truncate text-font-0">
                {each.title}
              </span>
              <span lang={each.locale} className="body-6 shrink-0 text-font-2">
                {each.languageName}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <Link href={docsPath.home(locale)} className="body-5 text-brand-dark underline underline-offset-2">
        {messages.untranslatedHome}
      </Link>
    </section>
  );
};

export default DocsUntranslated;
