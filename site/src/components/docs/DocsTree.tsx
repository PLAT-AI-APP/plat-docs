"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { DocsTreeNode } from "@/api/docs/types";
import { cn } from "@/lib/utils";
import { ChevronIcon } from "./DocsIcons";
import { useDocs } from "./DocsProvider";
import { docsPath, parseDocsPathname } from "./docsPath";

const nodeKey = (node: Pick<DocsTreeNode, "type" | "slug">) => `${node.type}:${node.slug}`;

/** 트리에서 대상 노드까지의 경로(자신 포함 조상 키). 없으면 빈 배열. */
const findPath = (nodes: DocsTreeNode[], target: string): string[] => {
  for (const node of nodes) {
    const key = nodeKey(node);
    if (key === target) return [key];
    const below = findPath(node.children, target);
    if (below.length) return [key, ...below];
  }
  return [];
};

/**
 * 전체 문서 트리. 지금 보는 문서는 강조하고, 그 문서까지의 그룹은 펼친다.
 * 그룹 이름을 누르면 카테고리 화면으로 가면서 펼치고, 꺾쇠는 펼침만 바꾼다.
 */
const DocsTree = ({ onNavigate }: { onNavigate?: () => void }) => {
  const { tree, locale, messages } = useDocs();
  const pathname = usePathname();
  const current = parseDocsPathname(pathname);
  const activeKey =
    current.slug && (current.kind === "article" || current.kind === "category")
      ? nodeKey({ type: current.kind === "article" ? "PAGE" : "GROUP", slug: current.slug })
      : null;
  const activePath = useMemo(
    () => (activeKey ? findPath(tree, activeKey) : []),
    [tree, activeKey],
  );

  const [openKeys, setOpenKeys] = useState<Set<string>>(() => new Set(activePath));
  const [syncedKey, setSyncedKey] = useState(activeKey);
  // 다른 문서로 옮기면 그 문서까지의 그룹을 펼친다. 사용자가 접어 둔 다른 그룹은 그대로 둔다.
  if (syncedKey !== activeKey) {
    setSyncedKey(activeKey);
    if (activePath.some((key) => !openKeys.has(key))) {
      setOpenKeys(new Set([...openKeys, ...activePath]));
    }
  }

  const toggle = (key: string) =>
    setOpenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const renderNodes = (nodes: DocsTreeNode[], depth: number) => (
    <ul className="flex flex-col gap-0.5">
      {nodes.map((node) => {
        const key = nodeKey(node);
        const isGroup = node.type === "GROUP";
        const isOpen = openKeys.has(key);
        const isActive = key === activeKey;
        const label = (isGroup ? node.name : node.title) ?? "";
        const href = isGroup
          ? docsPath.category(locale, node.slug)
          : docsPath.article(locale, node.slug);

        return (
          <li key={key}>
            <div
              className={cn(
                "group flex min-h-8 items-center rounded-lg pr-2 transition-colors",
                isActive
                  ? "bg-brand-opacity text-brand-dark"
                  : "text-font-2 hover:bg-btn-hover hover:text-font-1",
              )}
              style={{ paddingLeft: `${depth * 12 + 4}px` }}
            >
              {isGroup ? (
                <button
                  type="button"
                  aria-label={isOpen ? messages.collapse : messages.expand}
                  aria-expanded={isOpen}
                  onClick={() => toggle(key)}
                  className="flex size-6 shrink-0 items-center justify-center rounded-md"
                >
                  <ChevronIcon
                    size={14}
                    className={cn("transition-transform", isOpen && "rotate-90")}
                  />
                </button>
              ) : (
                <span aria-hidden="true" className="size-6 shrink-0" />
              )}
              <Link
                href={href}
                aria-current={isActive ? "page" : undefined}
                onClick={() => {
                  if (isGroup && !isOpen) toggle(key);
                  onNavigate?.();
                }}
                className={cn(
                  "body-6 min-w-0 flex-1 py-1.5 break-keep",
                  isActive && "font-semibold",
                )}
              >
                {label}
              </Link>
            </div>
            {isGroup && isOpen && node.children.length > 0 && (
              <div className="mt-0.5">{renderNodes(node.children, depth + 1)}</div>
            )}
          </li>
        );
      })}
    </ul>
  );

  return <nav aria-label={messages.siteName}>{renderNodes(tree, 0)}</nav>;
};

export default DocsTree;
