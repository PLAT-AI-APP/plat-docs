import type { ReactNode } from "react";
import type { DocsMessages } from "@/i18n/locales/docs";
import DocsTree from "./DocsTree";

/**
 * 카테고리·아티클 화면의 틀. 데스크톱(lg 이상)은 왼쪽에 전체 트리 사이드바를 고정하고,
 * 모바일은 사이드바를 숨긴다(헤더 햄버거의 드로어가 같은 트리를 연다).
 */
const DocsFrame = ({
  messages,
  children,
}: {
  messages: DocsMessages;
  children: ReactNode;
}) => (
  <div className="mx-auto flex w-full max-w-[1440px]">
    <aside className="sticky top-[var(--docs-header-height)] hidden h-[calc(100dvh-var(--docs-header-height))] w-[260px] shrink-0 flex-col border-r border-main lg:flex">
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-6">
        <DocsTree />
      </div>
      <p className="body-7 px-5 py-4 text-font-disabled">{messages.poweredBy}</p>
    </aside>
    <div className="min-w-0 flex-1">{children}</div>
  </div>
);

export default DocsFrame;
