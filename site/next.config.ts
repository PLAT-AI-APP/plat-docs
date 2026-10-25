import type { NextConfig } from "next";

/**
 * 모든 응답에 붙이는 보안 헤더(plat-fe 와 같다).
 * - X-Frame-Options: 다른 사이트가 우리 화면을 iframe 에 넣어 클릭을 가로채지 못하게 한다.
 * - X-Content-Type-Options: 브라우저가 응답 형식을 추측해 스크립트로 실행하지 않게 한다.
 * - Referrer-Policy: 다른 사이트로 나갈 때 주소의 경로·쿼리를 넘기지 않는다.
 * - Content-Security-Policy: 플러그인 실행·base 태그 바꿔치기·프레임 삽입을 막는다.
 */
const SECURITY_HEADERS = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'",
  },
];

/*
 * 두 곳에서 같은 빌드로 돈다. develop 은 Vercel(dev-docs.plat.so), main 은 Firebase App Hosting(docs.plat.so, apphosting.yaml).
 * 문서는 빌드 때 모든 페이지를 미리 그려 두므로(generateStaticParams) 서버는 그려 둔 화면과 검색 자동완성만 내주고,
 * 문서가 바뀌면 브랜치 커밋마다 각 호스팅이 다시 빌드한다.
 */
const nextConfig: NextConfig = {
  images: { unoptimized: true },
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
