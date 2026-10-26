"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { DocsLocale } from "@/api/docs/types";
import { ArrowDown, Check, Global } from "@/icons";
import { cn } from "@/lib/utils";
import { useDocs } from "./DocsProvider";
import { swapDocsLocale } from "./docsPath";

/**
 * 문서 언어 전환. 어느 화면이든 같은 주소의 언어만 바꿔 연다.
 * 번역이 있는지는 여기서 판단하지 않는다 — 지금 화면의 응답은 캐시(서버 데이터 캐시 · 라우터 캐시)에 남은 옛 값일 수 있어
 * 번역을 나중에 추가한 문서를 "번역 없음" 으로 잘못 보고 홈으로 보냈다. 고른 언어로 없는 문서는 그 화면이
 * 번역 없음 안내(다른 언어 판 · 문서 홈 링크)를 그린다.
 */
const DocsLanguageMenu = ({
  variant = "dropdown",
  onNavigate,
}: {
  variant?: "dropdown" | "list";
  onNavigate?: () => void;
}) => {
  const { locale, locales, messages } = useDocs();
  const nameOf = (code: DocsLocale) =>
    locales.find((item) => item.code === code)?.name ?? code.toUpperCase();
  const router = useRouter();
  const pathname = usePathname();
  const rootRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const select = (next: DocsLocale) => {
    setIsOpen(false);
    onNavigate?.();
    if (next === locale) return;
    // 쿼리(검색어)는 누른 순간의 주소에서 읽는다. useSearchParams 를 쓰면 미리 그려 둔(정적) 화면이
    // 이 메뉴 아래를 통째로 클라이언트 렌더로 미뤄 본문이 HTML 에서 빠진다.
    router.push(swapDocsLocale(pathname, window.location.search, next));
  };

  const options = (
    <ul role="listbox" aria-label={messages.language} className="flex flex-col py-1">
      {locales.map(({ code: option, name }) => (
        <li key={option} role="option" aria-selected={option === locale}>
          <button
            type="button"
            lang={option}
            onClick={() => select(option)}
            className={cn(
              "body-5 flex w-full items-center justify-between gap-6 px-4 py-2.5 text-left hover:bg-btn-hover",
              option === locale ? "font-semibold text-font-1" : "text-font-2",
            )}
          >
            {name}
            {option === locale && <Check size={16} className="text-brand" aria-hidden="true" />}
          </button>
        </li>
      ))}
    </ul>
  );

  if (variant === "list") {
    return (
      <div className="flex flex-col gap-1">
        <p className="body-7 flex items-center gap-1.5 px-4 text-font-disabled">
          <Global size={14} aria-hidden="true" />
          {messages.language}
        </p>
        {options}
      </div>
    );
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={messages.language}
        onClick={() => setIsOpen((open) => !open)}
        className="body-5 flex h-10 items-center gap-1.5 rounded-lg px-2.5 text-font-1 hover:bg-btn-hover"
      >
        <Global size={18} className="text-font-2" aria-hidden="true" />
        {nameOf(locale)}
        <ArrowDown
          size={16}
          className={cn("text-font-2 transition-transform", isOpen && "rotate-180")}
          aria-hidden="true"
        />
      </button>
      {isOpen && (
        <div className="absolute top-full right-0 z-30 mt-1 min-w-36 overflow-hidden rounded-xl border border-main bg-dark shadow-popover">
          {options}
        </div>
      )}
    </div>
  );
};

export default DocsLanguageMenu;
