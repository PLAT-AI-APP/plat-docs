import { redirect } from "next/navigation";
import { getDocsLocales } from "@/api/docs/server";
import { DOCS_ENTRY_LANG_PARAM, docsPath, pickDocsEntryLocale } from "@/components/docs/docsPath";

interface DocsIndexPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/** `/` 는 앱에서 넘긴 언어(?lang=)가 지원되면 그 언어, 아니면 문서 레포가 정한 기본 언어의 문서 홈으로 보낸다. */
export default async function DocsIndexPage({ searchParams }: DocsIndexPageProps) {
  const [locales, params] = await Promise.all([getDocsLocales(), searchParams]);
  const requested = params[DOCS_ENTRY_LANG_PARAM];
  redirect(docsPath.home(pickDocsEntryLocale(typeof requested === "string" ? requested : null, locales)));
}
