import Link from "next/link";
import { getDocsLocales } from "@/api/docs/server";
import { docsPath } from "@/components/docs/docsPath";
import { getDocsMessages } from "@/i18n/locales/docs";

/** 없는 주소. 어느 언어로 들어왔는지 모를 수 있어 기본 언어 문구로 그리고, 문서 홈으로 돌려보낸다. */
export default async function NotFound() {
  const { defaultLocale } = await getDocsLocales();
  const messages = getDocsMessages(defaultLocale);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-dark px-4 text-center text-font-1">
      <p className="display-1 text-font-0">404</p>
      <p className="body-3 text-font-2">{messages.notFound}</p>
      <Link
        href={docsPath.home(defaultLocale)}
        className="title-4 rounded-xl bg-brand px-5 py-3 text-white hover:opacity-90"
      >
        {messages.untranslatedHome}
      </Link>
    </main>
  );
}
