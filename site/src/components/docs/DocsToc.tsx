"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface TocItem {
  id: string;
  text: string;
  level: 2 | 3;
}

/** 헤더(60px)에 가리지 않도록 이만큼 위를 기준선으로 본다. */
const ACTIVE_OFFSET_PX = 96;

/**
 * 본문의 h2·h3 로 만든 목차. 본문은 마크다운이 그린 뒤라 DOM 에서 제목을 읽는다.
 * 스크롤 위치를 지난 마지막 제목을 강조하고, 누르면 그 제목으로 부드럽게 이동한다.
 */
const DocsToc = ({ containerId, title }: { containerId: string; title: string }) => {
  const [items, setItems] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const container = document.getElementById(containerId);
    if (!container) return;

    const headings = Array.from(
      container.querySelectorAll<HTMLHeadingElement>("h2[id], h3[id]"),
    );
    // 마크다운이 그린 제목을 목차로 옮겨 담는다(외부 DOM → React 상태 동기화).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(
      headings.map((heading) => ({
        id: heading.id,
        text: heading.textContent ?? "",
        level: heading.tagName === "H3" ? 3 : 2,
      })),
    );

    let frame = 0;
    const update = () => {
      frame = 0;
      let current: string | null = headings[0]?.id ?? null;
      for (const heading of headings) {
        if (heading.getBoundingClientRect().top - ACTIVE_OFFSET_PX <= 0) current = heading.id;
        else break;
      }
      // 맨 아래까지 내렸으면 마지막 제목이 기준선에 닿지 못해도 마지막을 강조한다.
      // 스크롤이 없는 짧은 문서는 처음부터 "맨 아래"라서, 실제로 내렸을 때만 이 규칙을 쓴다.
      if (
        headings.length &&
        window.scrollY > 0 &&
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2
      ) {
        current = headings[headings.length - 1].id;
      }
      setActiveId(current);
    };
    const handleScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [containerId]);

  if (items.length === 0) return null;

  return (
    <nav aria-label={title} className="flex flex-col gap-3">
      <p className="title-6 text-font-1">{title}</p>
      <ul className="flex flex-col gap-0.5 border-l border-main">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              onClick={(event) => {
                event.preventDefault();
                document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth" });
                window.history.replaceState(null, "", `#${item.id}`);
                setActiveId(item.id);
              }}
              className={cn(
                "body-6 -ml-px block border-l-2 py-1 break-keep transition-colors",
                item.level === 3 ? "pl-6" : "pl-3",
                item.id === activeId
                  ? "border-brand font-semibold text-brand-dark"
                  : "border-transparent text-font-2 hover:text-font-1",
              )}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default DocsToc;
