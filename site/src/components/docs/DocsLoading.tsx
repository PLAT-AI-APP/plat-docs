"use client";

import { useDocs } from "./DocsProvider";

/**
 * 문서 사이를 옮길 때 서버 응답을 기다리는 동안의 자리표시자. 사이드바 · 헤더는 레이아웃이라 그대로 두고 본문 자리만 바꾼다.
 * 빠른 이동에서 번쩍이지 않게 300ms 뒤에 나타난다(delayed-appear).
 */
const DocsLoading = () => {
  const { messages } = useDocs();
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className="delayed-appear mx-auto flex w-full max-w-[1100px] flex-col gap-4 px-4 pt-6 pb-24 sm:px-8 lg:pt-10"
    >
      <span className="sr-only">{messages.loading}</span>
      <div aria-hidden="true" className="flex animate-pulse flex-col gap-4">
        <div className="h-4 w-32 rounded bg-btn-hover" />
        <div className="h-10 w-2/3 rounded-lg bg-btn-hover" />
        <div className="h-4 w-1/2 rounded bg-btn-hover" />
        <div className="mt-8 h-4 w-full rounded bg-btn-hover" />
        <div className="h-4 w-11/12 rounded bg-btn-hover" />
        <div className="h-4 w-4/5 rounded bg-btn-hover" />
      </div>
    </div>
  );
};

export default DocsLoading;
