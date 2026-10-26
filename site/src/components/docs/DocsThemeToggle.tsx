"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "@/icons";
import { useDocs } from "./DocsProvider";

const subscribeToNothing = () => () => {};

/**
 * 하이드레이션이 끝났는지. 서버 렌더 때는 저장된 테마를 몰라 resolvedTheme 이 비어 있다 —
 * 그대로 그리면 첫 프레임 아이콘이 저장된 테마와 어긋났다가 튄다(설정 화면 테마 스위치와 같은 처리).
 */
const useIsHydrated = () =>
  useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  );

/**
 * 문서 헤더 오른쪽 끝의 라이트 · 다크 전환. 앱 전체 테마(next-themes)를 그대로 바꾼다 —
 * 설정 화면의 테마 스위치와 같은 값이라 문서에서 바꾸면 앱에서도 그 테마다.
 * 아이콘은 누르면 바뀔 테마를 보여 준다(다크에서는 해, 라이트에서는 달).
 */
const DocsThemeToggle = () => {
  const { messages } = useDocs();
  const { resolvedTheme, setTheme } = useTheme();
  const isHydrated = useIsHydrated();
  const isLight = isHydrated && resolvedTheme === "light";
  const label = isLight ? messages.themeToDark : messages.themeToLight;

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={() => setTheme(isLight ? "dark" : "light")}
      className="flex size-10 items-center justify-center rounded-lg text-font-2 hover:bg-btn-hover hover:text-font-1"
    >
      {/* 하이드레이션 전에는 자리만 잡아 두고 아이콘을 그리지 않는다. */}
      {isHydrated && (isLight ? <Moon size={20} /> : <Sun size={20} />)}
    </button>
  );
};

export default DocsThemeToggle;
