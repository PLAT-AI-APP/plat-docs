"use client";

import ReactMarkdown, { type Components } from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

interface MarkdownDocumentProps {
  content: string;
  /**
   * 본문 `##`·`###` 제목에 id 를 붙여 목차 앵커로 쓸 수 있게 한다(문서 사이트).
   * 끄면(기본) 지금까지와 같다.
   */
  anchorHeadings?: boolean;
  /** 화면별로 일부 요소 모양만 바꿀 때. 넘긴 요소만 기본 모양을 덮는다. */
  components?: Partial<Components>;
}

/** 목차 앵커를 붙일 마크다운 제목 깊이(## · ###). */
const ANCHOR_HEADING_DEPTHS = [2, 3];

interface MdastNode {
  type: string;
  depth?: number;
  value?: string;
  children?: MdastNode[];
  data?: { hProperties?: Record<string, unknown> };
}

const textOf = (node: MdastNode): string =>
  node.value ?? (node.children ?? []).map(textOf).join("");

/** 제목 글자로 id 를 만든다. 한글 등 글자·숫자는 남기고 나머지는 - 로 잇는다. */
const toHeadingId = (text: string) =>
  text
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "section";

/**
 * `##`·`###` 제목에 id 를 붙이는 remark 플러그인. 같은 제목이 여러 번이면 -1, -2 를 붙여 겹치지 않게 한다.
 * rehype-slug 를 들이지 않으려고 직접 둔다(제목만 훑으면 되어 짧다).
 */
const remarkHeadingIds = () => (tree: MdastNode) => {
  const used = new Map<string, number>();
  const visit = (node: MdastNode) => {
    if (node.type === "heading" && ANCHOR_HEADING_DEPTHS.includes(node.depth ?? 0)) {
      const base = toHeadingId(textOf(node));
      const count = used.get(base) ?? 0;
      used.set(base, count + 1);
      node.data = {
        ...node.data,
        hProperties: { ...node.data?.hProperties, id: count ? `${base}-${count}` : base },
      };
    }
    node.children?.forEach(visit);
  };
  visit(tree);
};

/**
 * react-markdown 은 각 요소에 mdast node 를 함께 넘긴다. 그대로 펼치면 DOM 속성으로 새어
 * 경고가 나므로 빼고 넘긴다.
 */
const withoutNode = <T extends { node?: unknown }>(props: T): Omit<T, "node"> => {
  const rest = { ...props };
  delete rest.node;
  return rest;
};

/*
 * Tailwind preflight 가 제목 크기·목록 기호·표 테두리 같은 브라우저 기본 스타일을 전부 지우므로,
 * 마크다운 요소를 하나씩 다시 입혀야 흔히 보는 마크다운(GitHub 등)처럼 보인다.
 * className 은 항상 cn 으로 합친다 — remark-gfm 이 체크리스트 등에 붙이는 클래스를 덮어쓰지 않게.
 */
const markdownComponents: Partial<Components> = {
  // 페이지 제목이 h1 이라 본문 제목은 한 단계씩 내린다.
  h1: ({ className, ...props }) => (
    <h2 className={cn("title-1 mt-6 first:mt-0", className)} {...withoutNode(props)} />
  ),
  h2: ({ className, ...props }) => (
    <h3 className={cn("title-2 mt-6 first:mt-0", className)} {...withoutNode(props)} />
  ),
  h3: ({ className, ...props }) => (
    <h4 className={cn("title-3 mt-5 first:mt-0", className)} {...withoutNode(props)} />
  ),
  h4: ({ className, ...props }) => (
    <h5 className={cn("title-4 mt-4 first:mt-0", className)} {...withoutNode(props)} />
  ),
  h5: ({ className, ...props }) => (
    <h6 className={cn("title-5 mt-4 first:mt-0", className)} {...withoutNode(props)} />
  ),
  h6: ({ className, ...props }) => (
    <h6
      className={cn("title-6 mt-4 text-font-2 first:mt-0", className)}
      {...withoutNode(props)}
    />
  ),
  p: ({ className, ...props }) => (
    <p className={cn("leading-relaxed", className)} {...withoutNode(props)} />
  ),
  strong: ({ className, ...props }) => (
    <strong className={cn("font-semibold text-font-0", className)} {...withoutNode(props)} />
  ),
  del: ({ className, ...props }) => (
    <del className={cn("text-font-2", className)} {...withoutNode(props)} />
  ),
  // 중첩 목록은 위 항목과 붙지 않게 살짝 띄우고, 한 항목 안의 문단(느슨한 목록)도 간격을 준다.
  ul: ({ className, ...props }) => (
    <ul
      className={cn(
        "list-disc space-y-1 pl-5 leading-relaxed [&_ul]:mt-1 [&_ul]:list-[circle]",
        className,
      )}
      {...withoutNode(props)}
    />
  ),
  ol: ({ className, ...props }) => (
    <ol
      className={cn(
        "list-decimal space-y-1 pl-5 leading-relaxed [&_ol]:mt-1",
        className,
      )}
      {...withoutNode(props)}
    />
  ),
  li: ({ className, ...props }) => (
    <li
      className={cn(
        "[&>p+p]:mt-2",
        // 체크리스트 항목은 글머리 기호 자리에 체크박스를 둔다. 같은 목록의 일반 항목은 기호를 그대로 쓴다.
        className?.includes("task-list-item") &&
          "-ml-5 flex list-none items-start gap-2",
        className,
      )}
      {...withoutNode(props)}
    />
  ),
  input: ({ className, ...props }) => (
    <input
      className={cn("mt-1.5 size-3.5 shrink-0 accent-brand", className)}
      {...withoutNode(props)}
    />
  ),
  a: ({ className, ...props }) => (
    <a
      className={cn("text-brand underline underline-offset-2", className)}
      target="_blank"
      rel="noreferrer"
      {...withoutNode(props)}
    />
  ),
  // 인라인 코드. 코드 블록 안의 code 는 pre 쪽에서 이 모양을 걷어낸다.
  code: ({ className, ...props }) => (
    <code
      className={cn("rounded bg-card px-1.5 py-0.5 font-mono text-[0.9em]", className)}
      {...withoutNode(props)}
    />
  ),
  // 긴 줄이 화면 밖으로 나가지 않도록 코드 블록만 가로로 스크롤한다.
  pre: ({ className, ...props }) => (
    <pre
      className={cn(
        "body-5 overflow-x-auto rounded-xl bg-card p-4 font-mono leading-relaxed",
        "[&>code]:rounded-none [&>code]:bg-transparent [&>code]:p-0 [&>code]:text-[1em]",
        className,
      )}
      {...withoutNode(props)}
    />
  ),
  blockquote: ({ className, ...props }) => (
    <blockquote
      className={cn("flex flex-col gap-2 border-l-2 border-brand pl-4 text-font-2", className)}
      {...withoutNode(props)}
    />
  ),
  // 표는 좁은 화면에서 본문 폭을 밀어내지 않도록 감싼 상자 안에서만 가로 스크롤한다.
  table: ({ className, ...props }) => (
    <div className="overflow-x-auto">
      <table
        className={cn("w-full border-collapse text-left", className)}
        {...withoutNode(props)}
      />
    </div>
  ),
  th: ({ className, ...props }) => (
    <th
      className={cn("border border-main bg-card px-3 py-2 font-semibold", className)}
      {...withoutNode(props)}
    />
  ),
  td: ({ className, ...props }) => (
    <td className={cn("border border-main px-3 py-2", className)} {...withoutNode(props)} />
  ),
  // 공지 이미지는 외부 주소라 크기를 미리 알 수 없어 next/image 대신 img 를 쓴다.
  img: ({ className, alt, ...props }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt={alt ?? ""}
      loading="lazy"
      className={cn("h-auto max-w-full rounded-xl", className)}
      {...withoutNode(props)}
    />
  ),
  hr: ({ className, ...props }) => (
    <hr className={cn("my-2 border-main", className)} {...withoutNode(props)} />
  ),
};

const MarkdownDocument = ({
  content,
  anchorHeadings = false,
  components,
}: MarkdownDocumentProps) => (
  <ReactMarkdown
    remarkPlugins={
      anchorHeadings
        ? [remarkGfm, remarkBreaks, remarkHeadingIds]
        : [remarkGfm, remarkBreaks]
    }
    components={components ? { ...markdownComponents, ...components } : markdownComponents}
  >
    {content}
  </ReactMarkdown>
);

export default MarkdownDocument;
