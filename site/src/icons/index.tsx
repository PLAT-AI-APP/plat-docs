import type React from "react";

/* 문서 사이트가 쓰는 아이콘만 plat-fe(src/icons)에서 그대로 가져왔다. 모양을 바꿀 때는 앱과 함께 맞춘다. */
export { default as ArrowDown } from "./ArrowDown";
export { default as Check } from "./Check";
export { default as Close } from "./Close";
export { default as Global } from "./Global";
export { default as LogoWordmark } from "./LogoWordmark";
export { default as Moon } from "./Moon";
export { default as Search } from "./Search";
export { default as Sun } from "./Sun";

// 모든 아이콘이 공유할 타입
export interface IconProps extends React.ComponentPropsWithoutRef<"svg"> {
  size?: number | string;
}

// 아이콘의 틀만 담당하는 컴포넌트
export const IconWrapper = ({
  size = 24,
  className = "",
  children,
  ...props
}: IconProps & { children: React.ReactNode }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    className={`${className}`}
    fill="currentColor"
    stroke="none"
    {...props}
  >
    {children}
  </svg>
);
