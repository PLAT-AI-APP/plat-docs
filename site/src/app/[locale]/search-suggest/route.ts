import { NextResponse } from "next/server";
import { searchDocsOnServer } from "@/api/docs/server";
import { readDocsLocale } from "@/components/docs/docsMetadata";

/**
 * 검색창 자동완성. 묶음은 서버에만 있으므로 브라우저는 이 주소로 검색어를 넘긴다(검색 화면과 같은 매칭).
 * 지원하지 않는 언어면 404.
 */
export async function GET(request: Request, { params }: { params: Promise<{ locale: string }> }) {
  const locale = await readDocsLocale((await params).locale);
  if (!locale) return NextResponse.json({ items: [] }, { status: 404 });
  const query = new URL(request.url).searchParams.get("q") ?? "";
  return NextResponse.json(await searchDocsOnServer(locale, query));
}
