"use client";

import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import type { DocsLocale, DocsLocaleInfo, DocsTreeNode } from "@/api/docs/types";
import type { DocsMessages } from "@/i18n/locales/docs";

interface DocsContextValue {
  locale: DocsLocale;
  /** 문서 레포가 정한 지원 언어(메뉴 순서). */
  locales: DocsLocaleInfo[];
  messages: DocsMessages;
  tree: DocsTreeNode[];
}

const DocsContext = createContext<DocsContextValue | null>(null);

/** 문서 레이아웃이 서버에서 받은 언어·문구·트리를 클라이언트 컴포넌트(헤더·사이드바)에 나눠 준다. */
export const DocsProvider = ({
  locale,
  locales,
  messages,
  tree,
  children,
}: {
  locale: DocsLocale;
  locales: DocsLocaleInfo[];
  messages: DocsMessages;
  tree: DocsTreeNode[];
  children: ReactNode;
}) => {
  // 앱의 IntlProvider 가 <html lang> 을 앱 언어로 맞추므로, 문서에서는 주소 locale 로 다시 맞춘다.
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo(
    () => ({ locale, locales, messages, tree }),
    [locale, locales, messages, tree],
  );

  return <DocsContext.Provider value={value}>{children}</DocsContext.Provider>;
};

export const useDocs = () => {
  const context = useContext(DocsContext);
  if (!context) throw new Error("useDocs 는 DocsProvider 안에서만 쓴다.");
  return context;
};

