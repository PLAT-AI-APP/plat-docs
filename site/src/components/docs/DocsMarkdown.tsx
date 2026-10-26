"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import type { Components } from "react-markdown";
import MarkdownDocument from "@/components/markdown/MarkdownDocument";
import { cn } from "@/lib/utils";
import DocsImageLightbox, { type DocsLightboxImage } from "./DocsImageLightbox";
import { useDocs } from "./DocsProvider";

/**
 * react-markdown 이 넘기는 mdast node 는 DOM 속성으로 새지 않게 뺀다(MarkdownDocument 와 같은 처리).
 */
const withoutNode = <T extends { node?: unknown }>(props: T): Omit<T, "node"> => {
  const rest = { ...props };
  delete rest.node;
  return rest;
};

/*
 * 문서 사이트용 요소 모양. 공지·약관과 달리 문서 제목(h1)과 본문 제목 단계를 그대로 맞춰
 * `##` → h2, `###` → h3 로 그린다(목차가 h2·h3 를 읽는다). 앵커로 이동해도 고정 헤더에 가리지 않게
 * scroll-margin 을 준다. 나머지 요소는 MarkdownDocument 기본 모양을 쓴다.
 */
const docsComponents: Partial<Components> = {
  h1: ({ className, ...props }) => (
    <h2 className={cn("heading-2 mt-12 scroll-mt-24 first:mt-0", className)} {...withoutNode(props)} />
  ),
  h2: ({ className, ...props }) => (
    <h2 className={cn("heading-2 mt-12 scroll-mt-24 first:mt-0", className)} {...withoutNode(props)} />
  ),
  h3: ({ className, ...props }) => (
    <h3 className={cn("title-1 mt-8 scroll-mt-24 first:mt-0", className)} {...withoutNode(props)} />
  ),
  h4: ({ className, ...props }) => (
    <h4 className={cn("title-2 mt-6 first:mt-0", className)} {...withoutNode(props)} />
  ),
  p: ({ className, ...props }) => (
    <p className={cn("leading-[1.75]", className)} {...withoutNode(props)} />
  ),
  // 사이트 안 주소(/docs/... 등)는 next/link 로 열어 화면 전체를 다시 받지 않는다(일반 <a> 는 문서를 처음부터 다시 불러왔다).
  // 같은 문서 안 앵커(#...)는 그대로, 외부 링크는 새 탭에서 연다.
  a: ({ className, href, ...props }) => {
    const linkClassName = cn("text-brand-dark underline underline-offset-2", className);
    if (href?.startsWith("/") && !href.startsWith("//")) {
      return <Link href={href} className={linkClassName} {...withoutNode(props)} />;
    }
    const isExternal = /^https?:\/\//.test(href ?? "");
    return (
      <a
        href={href}
        className={linkClassName}
        {...(isExternal ? { target: "_blank", rel: "noreferrer" } : {})}
        {...withoutNode(props)}
      />
    );
  },
  blockquote: ({ className, ...props }) => (
    <blockquote
      className={cn(
        "flex flex-col gap-2 rounded-xl bg-card px-5 py-4 text-font-1 [&_p]:leading-relaxed",
        className,
      )}
      {...withoutNode(props)}
    />
  ),
};

/**
 * 문서 본문. 이미지는 누르면 라이트박스로 크게 본다(본문에 든 주소 그대로).
 */
const DocsMarkdown = ({ content }: { content: string }) => {
  const { messages } = useDocs();
  const [zoomed, setZoomed] = useState<DocsLightboxImage | null>(null);
  const close = useCallback(() => setZoomed(null), []);

  const components = useMemo<Partial<Components>>(
    () => ({
      ...docsComponents,
      img: ({ className, alt, src, ...props }) => {
        const imageSrc = typeof src === "string" ? src : "";
        const image = (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt={alt ?? ""}
            src={imageSrc || undefined}
            loading="lazy"
            className={cn("h-auto max-w-full rounded-xl border border-main", className)}
            {...withoutNode(props)}
          />
        );
        if (!imageSrc) return image;
        return (
          <button
            type="button"
            aria-haspopup="dialog"
            aria-label={alt ? `${messages.imageZoom}: ${alt}` : messages.imageZoom}
            onClick={() => setZoomed({ src: imageSrc, alt: alt ?? "" })}
            className="my-2 inline-block max-w-full cursor-zoom-in rounded-xl align-top focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            {image}
          </button>
        );
      },
    }),
    [messages.imageZoom],
  );

  return (
    <>
      <MarkdownDocument content={content} anchorHeadings components={components} />
      {zoomed && <DocsImageLightbox image={zoomed} onClose={close} />}
    </>
  );
};

export default DocsMarkdown;
