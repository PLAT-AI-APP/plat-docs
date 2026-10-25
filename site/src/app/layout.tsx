import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@/app/globals.css";
// 가변(variable) 폰트의 글자 범위별 조각. plat-fe 와 같은 글꼴을 쓴다.
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import ThemeProvider from "@/providers/ThemeProvider";
import { ALLOW_INDEXING, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "PLAT 문서",
  // 클로즈베타 동안은 수집 차단, NEXT_PUBLIC_ALLOW_INDEXING=true 로 연다.
  robots: { index: ALLOW_INDEXING, follow: ALLOW_INDEXING },
  // 문서 화면의 상대 주소(canonical · hreflang · og:url)가 이 주소로 풀린다.
  metadataBase: new URL(SITE_URL),
};

/** 문서 사이트 뼈대. 언어별 머리(헤더 · 트리)는 [locale]/layout 이 그린다. */
export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
