"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { searchDocs } from "@/api/docs/searchDocs";
import { DOCS_SEARCH_MAX_LENGTH, type DocsSearchItem } from "@/api/docs/types";
import { Search } from "@/icons";
import { cn } from "@/lib/utils";
import { useDocs } from "./DocsProvider";
import { docsPath } from "./docsPath";
import ClearInputButton from "@/components/ui/ClearInputButton";

const DEBOUNCE_MS = 250;
/** 드롭다운에는 몇 건만 보이고 나머지는 결과 화면으로 넘긴다. */
const DROPDOWN_LIMIT = 6;

type Status = "idle" | "loading" | "done" | "error";

/**
 * 문서 검색창. 입력을 잠시 멈추면 결과를 드롭다운으로 보이고(제목·그룹명), Enter 는 검색 결과 화면으로 간다.
 * 위·아래 화살표로 결과를 고르고 Enter 로 연다. Esc·바깥 클릭으로 닫는다.
 */
const DocsSearchBox = ({
  size = "md",
  defaultValue = "",
  autoFocus = false,
  className,
  onNavigate,
}: {
  size?: "md" | "lg";
  defaultValue?: string;
  autoFocus?: boolean;
  className?: string;
  onNavigate?: () => void;
}) => {
  const { locale, messages } = useDocs();
  const router = useRouter();
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState(defaultValue);
  const [items, setItems] = useState<DocsSearchItem[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const trimmed = query.trim();

  useEffect(() => {
    // 검색 결과 화면처럼 검색어를 미리 채워 둔 경우, 사용자가 창을 건드리기 전에는 묻지 않는다.
    if (!trimmed || !isOpen) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setStatus("loading");
      searchDocs(locale, trimmed, controller.signal)
        .then((response) => {
          setItems(response.items.slice(0, DROPDOWN_LIMIT));
          setActiveIndex(-1);
          setStatus("done");
        })
        .catch((error: unknown) => {
          if (controller.signal.aborted) return;
          console.error("[docs] 검색 실패:", error);
          setItems([]);
          setStatus("error");
        });
    }, DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [isOpen, locale, trimmed]);

  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen]);

  const close = () => {
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const finish = () => {
    close();
    onNavigate?.();
  };

  const submit = () => {
    if (!trimmed) return;
    const picked = activeIndex >= 0 ? items[activeIndex] : undefined;
    router.push(
      picked
        ? docsPath.article(locale, picked.slug)
        : docsPath.search(locale, trimmed),
    );
    finish();
  };

  const showDropdown = isOpen && Boolean(trimmed) && status !== "idle";
  const isLarge = size === "lg";

  return (
    <div ref={rootRef} className={cn("relative w-full", className)}>
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
        className={cn(
          "flex items-center gap-2 rounded-xl border text-font-1 transition-colors focus-within:border-brand",
          // 큰 검색창은 배너 · 검색 화면 바탕 위에 놓여, 바탕과 구분되게 한 단계 밝은 면에 테두리를 둔다.
          isLarge ? "h-13 border-main bg-dark px-4" : "h-10 border-transparent bg-card px-3",
        )}
      >
        <Search size={isLarge ? 22 : 18} className="shrink-0 text-font-2" aria-hidden="true" />
        <input
          type="search"
          value={query}
          maxLength={DOCS_SEARCH_MAX_LENGTH}
          autoFocus={autoFocus}
          placeholder={messages.searchPlaceholder}
          aria-label={messages.searchPlaceholder}
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined
          }
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
            if (!event.target.value.trim()) {
              setItems([]);
              setStatus("idle");
            }
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              close();
            } else if (event.key === "ArrowDown" && items.length) {
              event.preventDefault();
              setIsOpen(true);
              setActiveIndex((index) => (index + 1) % items.length);
            } else if (event.key === "ArrowUp" && items.length) {
              event.preventDefault();
              setActiveIndex((index) => (index <= 0 ? items.length - 1 : index - 1));
            }
          }}
          className={cn(
            "focus-ring-none min-w-0 flex-1 bg-transparent outline-none placeholder:text-font-disabled [&::-webkit-search-cancel-button]:hidden",
            isLarge ? "body-3" : "body-5",
          )}
        />
        {query && (
          <ClearInputButton
            label={messages.clearInput}
            onClear={() => {
              setQuery("");
              setItems([]);
              setStatus("idle");
            }}
          />
        )}
      </form>

      {showDropdown && (
        <div className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-xl border border-main bg-dark text-left shadow-popover">
          {status === "loading" && items.length === 0 && (
            <p className="body-5 px-4 py-3 text-font-2">{messages.searchLoading}</p>
          )}
          {status === "error" && (
            <p className="body-5 px-4 py-3 text-font-2">{messages.searchError}</p>
          )}
          {status === "done" && items.length === 0 && (
            <p className="body-5 px-4 py-3 text-font-2">{messages.searchEmpty}</p>
          )}
          {items.length > 0 && (
            <ul id={listId} role="listbox" className="max-h-80 overflow-y-auto py-1">
              {items.map((item, index) => (
                <li key={item.slug} id={`${listId}-${index}`} role="option" aria-selected={index === activeIndex}>
                  <Link
                    href={docsPath.article(locale, item.slug)}
                    onClick={finish}
                    onMouseEnter={() => setActiveIndex(index)}
                    className={cn(
                      "flex flex-col gap-0.5 px-4 py-2.5",
                      index === activeIndex && "bg-btn-hover",
                    )}
                  >
                    <span className="title-5 truncate text-font-1">{item.title}</span>
                    {item.groupName && (
                      <span className="body-7 truncate text-font-2">{item.groupName}</span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {status === "done" && items.length > 0 && (
            <Link
              href={docsPath.search(locale, trimmed)}
              onClick={finish}
              className="body-6 block border-t border-main px-4 py-2.5 text-brand-dark hover:bg-btn-hover"
            >
              {messages.searchSeeAll}
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

export default DocsSearchBox;
