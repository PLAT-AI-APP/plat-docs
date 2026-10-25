"use client";

import React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark" // 다크 모드를 기본값으로 설정
      enableSystem={false}
      disableTransitionOnChange // 테마 변경 시 애니메이션 튐 방지
    >
      {children}
    </NextThemesProvider>
  );
}

export default ThemeProvider;
