"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Close } from "@/icons";
import { useDocs } from "./DocsProvider";

export interface DocsLightboxImage {
  src: string;
  alt: string;
}

/**
 * 본문 이미지를 화면 가득 크게 보여 주는 오버레이. 본문에 들어 있는 이미지 주소를 그대로 쓴다 —
 * 본문 이미지는 문서 레포 assets/ 의 원본(GitHub raw 주소)이라 따로 바꿀 주소가 없다.
 * ESC · 바깥(이미지가 아닌 곳) 클릭 · 닫기 버튼으로 닫고, 닫으면 연 이미지 버튼으로 초점을 돌려준다.
 * 바탕은 문서 바탕색(테마를 따른다)을 거의 불투명하게 깐다.
 */
const DocsImageLightbox = ({
  image,
  onClose,
}: {
  image: DocsLightboxImage;
  onClose: () => void;
}) => {
  const { messages } = useDocs();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
      }
      // 오버레이 안의 초점 가능한 요소는 닫기 버튼 하나라 Tab 이 밖으로 나가지 않게 붙잡아 둔다.
      if (event.key === "Tab") {
        event.preventDefault();
        closeRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      opener?.focus();
    };
  }, [onClose]);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={image.alt || messages.imageViewer}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-dark/95 p-4 backdrop-blur-sm sm:p-10"
    >
      <button
        ref={closeRef}
        type="button"
        aria-label={messages.imageClose}
        onClick={onClose}
        className="absolute top-3 right-3 flex size-11 items-center justify-center rounded-full border border-main bg-card text-font-1 shadow-popover hover:bg-btn-hover sm:top-5 sm:right-5"
      >
        <Close size={20} aria-hidden="true" />
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element -- 문서 레포의 이미지라 크기를 미리 알 수 없다. */}
      <img
        src={image.src}
        alt={image.alt}
        className="max-h-full max-w-full rounded-xl object-contain shadow-modal"
      />
    </div>,
    document.body,
  );
};

export default DocsImageLightbox;
