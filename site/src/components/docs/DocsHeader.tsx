"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Close, LogoWordmark, Search } from "@/icons";
import { APP_URL } from "@/lib/site";
import { cn } from "@/lib/utils";
import DocsLanguageMenu from "./DocsLanguageMenu";
import { MenuIcon } from "./DocsIcons";
import { useDocs } from "./DocsProvider";
import DocsSearchBox from "./DocsSearchBox";
import DocsThemeToggle from "./DocsThemeToggle";
import DocsTree from "./DocsTree";
import { docsPath, parseDocsPathname } from "./docsPath";

/**
 * 문서 상단 헤더. 왼쪽 로고 | 서비스명, 데스크톱은 오른쪽에 검색창·언어 선택,
 * 모바일은 검색 아이콘(헤더 아래로 검색창을 펼침)과 햄버거(트리 드로어)만 둔다.
 * 라이트 · 다크 전환은 화면 크기와 상관없이 맨 오른쪽(모바일은 햄버거 앞)에 둔다.
 * 로고는 PLAT 메인으로, 옆의 "문서" 는 문서 홈으로 간다.
 */
const DocsHeader = () => {
  const { locale, messages } = useDocs();
  const pathname = usePathname();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [lastPathname, setLastPathname] = useState(pathname);

  // 다른 화면으로 옮기면 모바일 검색·드로어를 닫는다.
  if (lastPathname !== pathname) {
    setLastPathname(pathname);
    setIsSearchOpen(false);
    setIsDrawerOpen(false);
  }

  useEffect(() => {
    if (!isDrawerOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsDrawerOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isDrawerOpen]);

  // 홈은 배너에, 검색 결과 화면은 본문 위에 큰 검색창이 있어 헤더 검색창을 두지 않는다.
  const pageKind = parseDocsPathname(pathname).kind;
  const hasPageSearch = pageKind === "home" || pageKind === "search";

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-main bg-dark">
        <div className="mx-auto flex h-[var(--docs-header-height)] w-full max-w-[1440px] items-center gap-4 px-4 lg:px-6">
          <div className="flex shrink-0 items-center gap-2.5">
            {/* 로고는 PLAT 앱으로 나간다(다른 도메인이라 Link 대신 a). 주소는 배포마다 환경 변수로 정한다. */}
            <a href={APP_URL} aria-label={messages.backToApp}>
              <LogoWordmark className="h-5.5 w-auto" aria-hidden="true" />
            </a>
            <Link
              href={docsPath.home(locale)}
              className="title-3 border-l border-main pl-2.5 text-font-1"
            >
              {messages.serviceLabel}
            </Link>
          </div>

          <div className="ml-auto flex items-center gap-1 md:gap-2">
            <div className="hidden items-center gap-2 md:flex">
              {!hasPageSearch && <DocsSearchBox className="w-72" />}
              <DocsLanguageMenu />
            </div>
            <button
              type="button"
              aria-label={isSearchOpen ? messages.searchClose : messages.searchOpen}
              aria-expanded={isSearchOpen}
              onClick={() => setIsSearchOpen((open) => !open)}
              className="flex size-10 items-center justify-center rounded-lg text-font-2 hover:bg-btn-hover md:hidden"
            >
              {isSearchOpen ? <Close size={18} /> : <Search size={22} />}
            </button>
            <DocsThemeToggle />
            <button
              type="button"
              aria-label={messages.menuOpen}
              aria-expanded={isDrawerOpen}
              aria-controls="docs-drawer"
              onClick={() => setIsDrawerOpen(true)}
              className="flex size-10 items-center justify-center rounded-lg text-font-2 hover:bg-btn-hover lg:hidden"
            >
              <MenuIcon size={22} />
            </button>
          </div>
        </div>

        {isSearchOpen && (
          <div className="border-t border-main px-4 py-3 md:hidden">
            <DocsSearchBox autoFocus onNavigate={() => setIsSearchOpen(false)} />
          </div>
        )}
      </header>

      <div
        className={cn(
          "fixed inset-0 z-40 lg:hidden",
          isDrawerOpen ? "visible" : "invisible",
        )}
        aria-hidden={!isDrawerOpen}
      >
        <button
          type="button"
          tabIndex={-1}
          aria-label={messages.menuClose}
          onClick={() => setIsDrawerOpen(false)}
          className={cn(
            "absolute inset-0 bg-scrim/50 transition-opacity",
            isDrawerOpen ? "opacity-100" : "opacity-0",
          )}
        />
        <div
          id="docs-drawer"
          role="dialog"
          aria-modal="true"
          aria-label={messages.siteName}
          className={cn(
            "absolute inset-y-0 right-0 flex w-[85%] max-w-sm flex-col bg-dark shadow-modal transition-transform",
            isDrawerOpen ? "translate-x-0" : "translate-x-full",
          )}
        >
          <div className="flex h-[var(--docs-header-height)] shrink-0 items-center justify-between border-b border-main px-4">
            <span className="title-3 text-font-1">{messages.siteName}</span>
            <button
              type="button"
              aria-label={messages.menuClose}
              onClick={() => setIsDrawerOpen(false)}
              className="flex size-10 items-center justify-center rounded-lg text-font-2 hover:bg-btn-hover"
            >
              <Close size={18} />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
            {isDrawerOpen && <DocsTree onNavigate={() => setIsDrawerOpen(false)} />}
          </div>
          <div className="border-t border-main py-3">
            <DocsLanguageMenu variant="list" onNavigate={() => setIsDrawerOpen(false)} />
          </div>
        </div>
      </div>
    </>
  );
};

export default DocsHeader;
